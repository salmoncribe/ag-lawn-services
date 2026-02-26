from __future__ import annotations

from pathlib import Path

from app.config import Settings
from app.services.supabase_service import SupabaseService


class StorageService:
    def __init__(self, settings: Settings, supabase_service: SupabaseService) -> None:
        self.settings = settings
        self.supabase = supabase_service

    def upload_clip(self, file_path: Path, storage_path: str) -> str:
        content_type = "video/mp4"
        if file_path.suffix.lower() in {".jpg", ".jpeg"}:
            content_type = "image/jpeg"
        if file_path.suffix.lower() == ".png":
            content_type = "image/png"

        with file_path.open("rb") as fh:
            self.supabase.service_client.storage.from_(self.settings.storage_bucket).upload(
                storage_path,
                fh,
                file_options={"content-type": content_type, "upsert": "true"},
            )

        public = self.supabase.service_client.storage.from_(self.settings.storage_bucket).get_public_url(
            storage_path
        )
        if isinstance(public, dict):
            return public.get("publicUrl", "")
        return public

    def remove_clip(self, storage_path: str) -> None:
        self.supabase.service_client.storage.from_(self.settings.storage_bucket).remove([storage_path])
