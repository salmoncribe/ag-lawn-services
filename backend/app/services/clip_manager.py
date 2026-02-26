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

    async def handle_highlight(self, profile: dict, highlight: HighlightEvent) -> dict | None:
        dedupe_key = f"{highlight.user_id}:{highlight.platform}:{highlight.stream_id}:{highlight.timestamp_seconds // 5}"
        if dedupe_key in self._seen_keys:
            return None
        self._seen_keys.add(dedupe_key)
        if len(self._seen_keys) > 5000:
            self._seen_keys.clear()

        if highlight.stream_id and not self._can_create_clip(profile, highlight.stream_id):
            return None

        processed = await asyncio.to_thread(self.pipeline.process_highlight, highlight)

        storage_video_path = f"{highlight.user_id}/{processed.clip_id}.mp4"
        storage_thumb_path = f"{highlight.user_id}/{processed.clip_id}.jpg"

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
            "user_id": highlight.user_id,
            "platform": highlight.platform,
            "stream_id": highlight.stream_id,
            "stream_date": datetime.now(timezone.utc).isoformat(),
            "duration": processed.duration,
            "status": "ready",
            "storage_path": storage_video_path,
            "storage_url": video_url,
            "thumbnail_url": thumb_url,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        clip = self.supabase.create_clip(payload)
        self._cleanup_local_files([processed.final_path, processed.thumbnail_path])
        return clip

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
