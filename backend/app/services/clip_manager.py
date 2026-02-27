from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path

from app.services.storage_service import StorageService
from app.services.supabase_service import SupabaseService
from app.services.video_pipeline import HighlightEvent, VideoPipelineService


class ClipManager:
    def __init__(
        self,
        supabase_service: SupabaseService,
        storage_service: StorageService,
        video_pipeline: VideoPipelineService,
    ) -> None:
        self.supabase = supabase_service
        self.storage = storage_service
        self.pipeline = video_pipeline
        self._seen_keys: set[str] = set()

    async def process_link(self, profile: dict, video_url: str) -> list[dict]:
        user_id = profile["user_id"]
        watermark = profile.get("watermark_text", "ClipperAI")
        
        try:
            processed_list = await asyncio.to_thread(
                self.pipeline.process_url,
                video_url=video_url,
                watermark=watermark,
                keywords=profile.get("keyword_triggers", [])
            )
        except Exception as e:
            print(f"Error processing URL {video_url}: {e}")
            return []

        created_clips = []
        from app.deps import get_supabase_service
        local_db = get_supabase_service()

        for processed in processed_list:
            storage_video_path = f"{user_id}/{processed.clip_id}.mp4"
            storage_thumb_path = f"{user_id}/{processed.clip_id}.jpg"

            video_url = await asyncio.to_thread(
                self.storage.upload_clip,
                processed.final_path,
                storage_video_path,
            )
            thumb_url = await asyncio.to_thread(
                self.storage.upload_clip,
                processed.thumbnail_path,
                storage_thumb_path,
            )

            payload = {
                "clip_id": processed.clip_id,
                "user_id": user_id,
                "stream_id": "manual_link",
                "platform": processed.platform,
                "title": f"Clip from {video_url}",
                "duration": processed.duration,
                "status": "ready",
                "storage_path": video_url,
                "thumbnail_path": thumb_url,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            
            clip = local_db.create_clip(payload)
            created_clips.append(clip)
            
            self._cleanup_local_files([processed.final_path, processed.thumbnail_path])

        return created_clips

    def delete_clip_assets(self, clip: dict) -> None:
        storage_path = clip.get("storage_path")
        if storage_path:
            self.storage.remove_clip(storage_path)

        thumb_path = clip.get("thumbnail_path")
        if thumb_path:
            self.storage.remove_clip(thumb_path)

    def _can_create_clip(self, profile: dict, stream_id: str) -> bool:
        plan = profile.get("plan_tier", "basic")
        if plan in {"pro", "agency"}:
            return True

        existing = self.supabase.count_stream_clips(profile["user_id"], stream_id)
        return existing < 5

    def _cleanup_local_files(self, paths: list[Path]) -> None:
        for path in paths:
            if path.exists():
                path.unlink(missing_ok=True)
