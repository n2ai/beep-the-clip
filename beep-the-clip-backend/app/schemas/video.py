import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# Allowed video MIME types
ALLOWED_CONTENT_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
}

# Max file size: 2 GB
MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024


class UploadUrlRequest(BaseModel):
    workspace_id: uuid.UUID
    filename: str = Field(min_length=1, max_length=256)
    content_type: str
    file_size_bytes: int = Field(gt=0)


class UploadUrlResponse(BaseModel):
    video_id: uuid.UUID
    upload_url: str
    s3_key: str


class VideoConfirmRequest(BaseModel):
    video_id: uuid.UUID


class VideoResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    filename: str
    s3_key: str
    status: str
    duration_seconds: float | None
    file_size_bytes: int | None
    content_type: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
