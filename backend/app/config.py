from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ClipperAI"
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    base_url: str = "http://localhost:8000"

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    encryption_key: str = ""

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_basic: str = ""
    stripe_price_pro: str = ""
    stripe_price_agency: str = ""
    stripe_success_url: str = "http://localhost:8000/dashboard.html?checkout=success"
    stripe_cancel_url: str = "http://localhost:8000/pricing.html?checkout=cancel"

    twitch_client_id: str = ""
    twitch_client_secret: str = ""
    twitch_redirect_uri: str = "http://localhost:8000/auth/twitch/callback"

    worker_poll_seconds: int = 60
    clip_retention_days: int = 30
    clip_output_dir: Path = Field(default=Path("data/clips"))
    temp_dir: Path = Field(default=Path("data/tmp"))
    storage_bucket: str = "clips"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.clip_output_dir.mkdir(parents=True, exist_ok=True)
    settings.temp_dir.mkdir(parents=True, exist_ok=True)
    return settings
