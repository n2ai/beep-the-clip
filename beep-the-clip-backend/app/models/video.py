import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.analysis_job import AnalysisJob
    from app.models.flagged_segment import FlaggedSegment


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(256), nullable=False)
    # Path in S3: "videos/{workspace_id}/{video_id}/{filename}"
    s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    # pending    → presigned URL issued, not yet uploaded
    # uploaded   → S3 confirmed, waiting for analysis
    # processing → Step Functions running
    # ready      → analysis complete, no flags
    # flagged    → analysis complete, flags found
    # failed     → analysis failed
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_type: Mapped[str] = mapped_column(String(64), nullable=False, default="video/mp4")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="videos")
    analysis_jobs: Mapped[list["AnalysisJob"]] = relationship(
        "AnalysisJob", back_populates="video", cascade="all, delete-orphan"
    )
    flagged_segments: Mapped[list["FlaggedSegment"]] = relationship(
        "FlaggedSegment", back_populates="video", cascade="all, delete-orphan"
    )
