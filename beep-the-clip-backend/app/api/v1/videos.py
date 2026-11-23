import uuid

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.video import Video
from app.models.workspace import Workspace
from app.schemas.video import (
    ALLOWED_CONTENT_TYPES,
    MAX_FILE_SIZE_BYTES,
    UploadUrlRequest,
    UploadUrlResponse,
    VideoResponse,
)

router = APIRouter(prefix="/videos", tags=["videos"])

# Presigned URL expiry — 15 minutes
PRESIGNED_URL_EXPIRY = 900


def _s3_client():
    return boto3.client("s3", region_name=settings.AWS_REGION)


@router.post("/upload-url", response_model=UploadUrlResponse, status_code=status.HTTP_201_CREATED)
def request_upload_url(
    body: UploadUrlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate content type
    if body.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported content type. Allowed: {sorted(ALLOWED_CONTENT_TYPES)}",
        )

    # Validate file size
    if body.file_size_bytes > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File exceeds the 2 GB limit.",
        )

    # Verify workspace ownership
    workspace = (
        db.query(Workspace)
        .filter(
            Workspace.id == body.workspace_id,
            Workspace.owner_id == current_user.id,
            Workspace.status != "archived",
        )
        .first()
    )
    if workspace is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    # Determine S3 key before creating the DB record
    video_id = uuid.uuid4()
    s3_key = f"videos/{body.workspace_id}/{video_id}/{body.filename}"

    # Create video record with status=pending
    video = Video(
        id=video_id,
        workspace_id=body.workspace_id,
        filename=body.filename,
        s3_key=s3_key,
        status="pending",
        file_size_bytes=body.file_size_bytes,
        content_type=body.content_type,
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    # Generate presigned PUT URL — frontend uploads directly to S3
    try:
        s3 = _s3_client()
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": s3_key,
                "ContentType": body.content_type,
                "ContentLength": body.file_size_bytes,
            },
            ExpiresIn=PRESIGNED_URL_EXPIRY,
        )
    except ClientError as exc:
        # Roll back the video record if we can't generate the URL
        db.delete(video)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not generate upload URL: {exc}",
        )

    return UploadUrlResponse(video_id=video_id, upload_url=upload_url, s3_key=s3_key)


@router.patch("/{video_id}/confirm", response_model=VideoResponse)
def confirm_upload(
    video_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Called by frontend after S3 returns 200 on the PUT.
    Sets video status to 'uploaded' and workspace status to 'active'.
    """
    video = (
        db.query(Video)
        .join(Workspace, Video.workspace_id == Workspace.id)
        .filter(
            Video.id == video_id,
            Workspace.owner_id == current_user.id,
        )
        .first()
    )
    if video is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")

    if video.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Video is already in status '{video.status}'.",
        )

    video.status = "uploaded"

    # Promote workspace from hidden → active on first upload
    workspace = db.query(Workspace).filter(Workspace.id == video.workspace_id).first()
    if workspace and workspace.status == "hidden":
        workspace.status = "active"

    db.commit()
    db.refresh(video)
    return video


@router.get("/{video_id}", response_model=VideoResponse)
def get_video(
    video_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = (
        db.query(Video)
        .join(Workspace, Video.workspace_id == Workspace.id)
        .filter(
            Video.id == video_id,
            Workspace.owner_id == current_user.id,
        )
        .first()
    )
    if video is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    return video
