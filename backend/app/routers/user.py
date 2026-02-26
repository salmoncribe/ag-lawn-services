from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.deps import get_cipher, get_current_profile, get_current_user, get_supabase_service
from app.schemas import KickConnectPayload, SettingsPayload
from app.services.supabase_service import SupabaseService
from app.utils.security import encrypt_text

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile")
async def get_profile(
    user: dict = Depends(get_current_user),
    profile: dict = Depends(get_current_profile),
):
    return {
        "user": {"id": user["id"], "email": user.get("email")},
        "profile": {
            "plan_tier": profile.get("plan_tier", "basic"),
            "stripe_customer_id": profile.get("stripe_customer_id"),
            "keyword_triggers": profile.get("keyword_triggers") or [],
            "chat_spike_threshold": profile.get("chat_spike_threshold") or 20,
            "watermark_text": profile.get("watermark_text") or "",
            "twitch": {
                "status": _twitch_status(profile),
                "login": profile.get("twitch_user_login"),
            },
            "kick": {
                "status": "connected" if profile.get("kick_token") else "disconnected",
                "channel_name": profile.get("kick_channel_name"),
            },
            "created_at": profile.get("created_at"),
        },
    }


@router.put("/settings")
async def update_settings(
    payload: SettingsPayload,
    user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase_service),
):
    clean_keywords = sorted({kw.strip().lower() for kw in payload.keyword_triggers if kw.strip()})
    updated = supabase.update_profile(
        user["id"],
        {
            "keyword_triggers": clean_keywords,
            "chat_spike_threshold": payload.chat_spike_threshold,
            "watermark_text": payload.watermark_text.strip(),
        },
    )
    return {"profile": updated}


@router.put("/connect/kick")
async def connect_kick(
    payload: KickConnectPayload,
    user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase_service),
    cipher=Depends(get_cipher),
):
    updated = supabase.update_profile(
        user["id"],
        {
            "kick_token": encrypt_text(cipher, payload.api_key),
            "kick_channel_name": payload.channel_name.strip().lower(),
            "kick_connected": True,
        },
    )
    return {"profile": updated}


@router.delete("/connect/kick")
async def disconnect_kick(
    user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase_service),
):
    updated = supabase.update_profile(
        user["id"],
        {
            "kick_token": None,
            "kick_channel_name": None,
            "kick_connected": False,
        },
    )
    return {"profile": updated}


@router.delete("/connect/twitch")
async def disconnect_twitch(
    user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase_service),
):
    updated = supabase.update_profile(
        user["id"],
        {
            "twitch_token": None,
            "twitch_refresh_token": None,
            "twitch_token_expires_at": None,
            "twitch_user_id": None,
            "twitch_user_login": None,
            "twitch_connected": False,
        },
    )
    return {"profile": updated}


def _twitch_status(profile: dict) -> str:
    token = profile.get("twitch_token")
    if not token:
        return "disconnected"

    expires_at = profile.get("twitch_token_expires_at")
    if not expires_at:
        return "connected"

    try:
        expires_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
    except Exception:
        return "connected"
    if expires_dt <= datetime.now(timezone.utc):
        return "expired"
    return "connected"
