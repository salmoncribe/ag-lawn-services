from __future__ import annotations

from functools import lru_cache

from fastapi import Depends, Header, HTTPException, status

from app.config import Settings, get_settings
from app.services.cleanup_service import CleanupService
from app.services.clip_manager import ClipManager
from app.services.kick_service import KickService
from app.services.monitor_service import StreamMonitorService
from app.services.storage_service import StorageService
from app.services.stripe_service import StripeService
from app.services.supabase_service import SupabaseService
from app.services.twitch_service import TwitchService
from app.services.video_pipeline import VideoPipelineService
from app.utils.security import build_fernet


@lru_cache
def get_supabase_service() -> SupabaseService:
    settings = get_settings()
    return SupabaseService(settings)


@lru_cache
def get_cipher():
    settings = get_settings()
    if not settings.encryption_key:
        raise RuntimeError("Missing ENCRYPTION_KEY")
    return build_fernet(settings.encryption_key)


@lru_cache
def get_stripe_service() -> StripeService:
    settings = get_settings()
    return StripeService(settings)


@lru_cache
def get_twitch_service() -> TwitchService:
    settings = get_settings()
    return TwitchService(settings)


@lru_cache
def get_kick_service() -> KickService:
    return KickService()


@lru_cache
def get_video_pipeline() -> VideoPipelineService:
    settings = get_settings()
    return VideoPipelineService(settings)


@lru_cache
def get_storage_service() -> StorageService:
    settings = get_settings()
    supabase = get_supabase_service()
    return StorageService(settings, supabase)


@lru_cache
def get_clip_manager() -> ClipManager:
    return ClipManager(
        supabase_service=get_supabase_service(),
        storage_service=get_storage_service(),
        video_pipeline=get_video_pipeline(),
    )


@lru_cache
def get_cleanup_service() -> CleanupService:
    return CleanupService(get_supabase_service(), get_storage_service())


@lru_cache
def get_monitor_service() -> StreamMonitorService:
    return StreamMonitorService(
        supabase_service=get_supabase_service(),
        twitch_service=get_twitch_service(),
        kick_service=get_kick_service(),
        clip_manager=get_clip_manager(),
        cipher=get_cipher(),
    )


def get_settings_dep() -> Settings:
    return get_settings()


async def get_current_user(
    authorization: str | None = Header(default=None),
    supabase: SupabaseService = Depends(get_supabase_service),
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth token")

    token = authorization.replace("Bearer ", "", 1)
    try:
        user = supabase.get_user_from_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid auth token",
        ) from exc

    if not user.get("id"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_profile(
    user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase_service),
) -> dict:
    profile = supabase.get_profile(user["id"])
    if not profile:
        email = user.get("email") or user.get("user_metadata", {}).get("email", "")
        profile = supabase.ensure_profile(user["id"], email)
    return profile
