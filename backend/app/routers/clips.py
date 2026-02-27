from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks

from app.deps import get_storage_service, get_supabase_service, get_current_user, get_clip_manager
from app.services.storage_service import StorageService
from app.services.local_db_service import LocalDBService
from app.services.clip_manager import ClipManager
from app.schemas import ProcessClipPayload

router = APIRouter(prefix="/clips", tags=["clips"])


@router.get("")
async def list_clips(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    user: dict = Depends(get_current_user),
    local_db: LocalDBService = Depends(get_supabase_service),
):
    items, total = local_db.list_clips(user["id"], page, page_size)
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.post("/process")
async def process_clip(
    payload: ProcessClipPayload,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    local_db: LocalDBService = Depends(get_supabase_service),
    manager: ClipManager = Depends(get_clip_manager),
):
    profile = local_db.get_profile(user["id"])
    if not profile or profile.get("credit_balance", 0) < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits. Please purchase a package.")

    # Deduct credit immediately to prevent spam
    local_db.consume_credits(user["id"], 1)

    # Dispatch to background task. 
    background_tasks.add_task(
        manager.process_link,
        profile=profile,
        video_url=payload.video_url
    )

    return {"ok": True, "message": "Link queued for processing. 1 credit deducted."}

@router.delete("/{clip_id}")
async def delete_clip(
    clip_id: str,
    user: dict = Depends(get_current_user),
    local_db: LocalDBService = Depends(get_supabase_service),
    storage: StorageService = Depends(get_storage_service),
):
    clip = local_db.get_clip(user["id"], clip_id)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    storage_path = clip.get("storage_path")
    thumb_path = clip.get("thumbnail_path")

    if storage_path:
        storage.remove_clip(storage_path)
    if thumb_path:
        storage.remove_clip(thumb_path)

    local_db.delete_clip(user["id"], clip_id)
    return {"ok": True}
