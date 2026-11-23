from fastapi import APIRouter

from app.api.v1 import workspaces, videos

router = APIRouter(prefix="/api/v1")

router.include_router(workspaces.router)
router.include_router(videos.router)
