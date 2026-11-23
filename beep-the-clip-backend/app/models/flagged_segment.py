import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.video import Video
    from app.models.analysis_job import AnalysisJob


class FlaggedSegment(Base):
    __tablename__ = "flagged_segments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    video_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("analysis_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    # rekognition | transcribe
    source: Mapped[str] = mapped_column(String(16), nullable=False)
    # e.g. "explicit_nudity", "violence", "profanity", "hate_speech"
    violation_type: Mapped[str] = mapped_column(String(64), nullable=False)
    # Confidence score from AWS (0.0 – 100.0)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    # Full raw response from Rekognition/Transcribe for debugging
    raw_response: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    video: Mapped["Video"] = relationship("Video", back_populates="flagged_segments")
    job: Mapped["AnalysisJob"] = relationship("AnalysisJob", back_populates="flagged_segments")
