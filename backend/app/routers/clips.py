from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_storage_service, get_supabase_service, get_current_user
from app.services.storage_service import StorageService
from app.services.supabase_service import SupabaseService

router = APIRouter(prefix="/clips", tags=["clips"])


@router.get("")
async def list_clips(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase_service),
):
    items, total = supabase.list_clips(user["id"], page, page_size)
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.delete("/{clip_id}")
async def delete_clip(
    clip_id: str,
    user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase_service),
    storage: StorageService = Depends(get_storage_service),
):
    clip = supabase.get_clip(user["id"], clip_id)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    storage_path = clip.get("storage_path")
    thumb_path = clip.get("thumbnail_path")

    if storage_path:
        storage.remove_clip(storage_path)
    if thumb_path:
        storage.remove_clip(thumb_path)

    supabase.delete_clip(user["id"], clip_id)
    return {"ok": True}
