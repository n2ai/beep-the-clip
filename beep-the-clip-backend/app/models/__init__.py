# Import all models here so Alembic autogenerate can detect them
from app.models.user import User
from app.models.workspace import Workspace
from app.models.video import Video
from app.models.analysis_job import AnalysisJob
from app.models.flagged_segment import FlaggedSegment

__all__ = ["User", "Workspace", "Video", "AnalysisJob", "FlaggedSegment"]
