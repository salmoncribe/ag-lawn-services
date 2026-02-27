from __future__ import annotations

from app.services.storage_service import StorageService
from app.services.local_db_service import LocalDBService


class CleanupService:
    def __init__(self, local_db: LocalDBService, storage_service: StorageService) -> None:
        self.local_db = local_db
        self.storage = storage_service

    def cleanup_expired_clips(self, retention_days: int) -> int:
        expired = self.local_db.mark_old_clips_for_deletion(retention_days)
        for clip in expired:
            path = clip.get("storage_path")
            if path:
                self.storage.remove_clip(path)

            thumb = clip.get("thumbnail_path")
            if thumb:
                self.storage.remove_clip(thumb)

            self.local_db.delete_clip(clip.get("user_id"), clip.get("clip_id"))

        return len(expired)
