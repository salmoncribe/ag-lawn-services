from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse

from app.deps import get_cipher, get_current_user, get_supabase_service, get_twitch_service
from app.schemas import AuthPayload
from app.services.supabase_service import SupabaseService
from app.services.twitch_service import TwitchService
from app.utils.security import decrypt_text, encrypt_text

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
async def signup(payload: AuthPayload, supabase: SupabaseService = Depends(get_supabase_service)):
    data = supabase.sign_up(payload.email, payload.password)
    user = data.get("user")
    if user:
        supabase.ensure_profile(user["id"], payload.email)
    return data


@router.post("/login")
async def login(payload: AuthPayload, supabase: SupabaseService = Depends(get_supabase_service)):
    data = supabase.sign_in(payload.email, payload.password)
    user = data.get("user")
    if user:
        supabase.ensure_profile(user["id"], payload.email)
    return data


@router.post("/logout")
async def logout() -> dict:
    return {"ok": True}


@router.get("/twitch/start")
async def twitch_start(
    user: dict = Depends(get_current_user),
    twitch: TwitchService = Depends(get_twitch_service),
    cipher=Depends(get_cipher),
):
    state = encrypt_text(cipher, user["id"])
    return {"url": twitch.build_oauth_url(state)}


@router.get("/twitch/callback")
async def twitch_callback(
    code: str = Query(...),
    state: str = Query(...),
    twitch: TwitchService = Depends(get_twitch_service),
    supabase: SupabaseService = Depends(get_supabase_service),
    cipher=Depends(get_cipher),
):  
    try:
        user_id = decrypt_text(cipher, state)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid state")
    profile = supabase.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=400, detail="Invalid state")

    tokens = await twitch.exchange_code(code)
    twitch_user = await twitch.get_current_user(tokens["access_token"])

    updates = {
        "twitch_token": encrypt_text(cipher, tokens["access_token"]),
        "twitch_refresh_token": encrypt_text(cipher, tokens.get("refresh_token", "")),
        "twitch_token_expires_at": tokens.get("expires_at"),
        "twitch_user_id": twitch_user.get("id"),
        "twitch_user_login": twitch_user.get("login"),
        "twitch_connected": True,
    }
    supabase.update_profile(user_id, updates)

    return RedirectResponse(url="/dashboard.html?twitch=connected", status_code=302)
