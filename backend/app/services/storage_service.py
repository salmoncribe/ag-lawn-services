import shutil
from pathlib import Path

from app.config import Settings
from app.services.local_db_service import LocalDBService


class StorageService:
    def __init__(self, settings: Settings, local_db_service: LocalDBService) -> None:
        self.settings = settings
        self.local_db = local_db_service
        self.public_dir = Path("data") / "public_clips"
        self.public_dir.mkdir(parents=True, exist_ok=True)

    def upload_clip(self, file_path: Path, storage_path: str) -> str:
        # Create full destination path on disk
        dest_path = self.public_dir / storage_path
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy the file instead of uploading it
        shutil.copy2(file_path, dest_path)
        
        # Return a path that the FastAPI static files middleware can serve
        # If the backend URL ends with a slash, we avoid double slashes
        base = self.settings.base_url.rstrip('/')
        return f"{base}/public_clips/{storage_path}"

    def remove_clip(self, storage_path: str) -> None:
        dest_path = self.public_dir / storage_path
        if dest_path.exists():
            dest_path.unlink()
