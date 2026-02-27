from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_current_profile, get_current_user, get_supabase_service
from app.schemas import SettingsPayload
from app.services.local_db_service import LocalDBService

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile")
async def get_profile(
    user: dict = Depends(get_current_user),
    profile: dict = Depends(get_current_profile),
):
    return {
        "user": {"id": user["id"], "email": user.get("email")},
        "profile": {
            "credit_balance": profile.get("credit_balance", 0),
            "stripe_customer_id": profile.get("stripe_customer_id"),
            "keyword_triggers": profile.get("keyword_triggers") or [],
            "chat_spike_threshold": profile.get("chat_spike_threshold") or 20,
            "watermark_text": profile.get("watermark_text") or "",
            "created_at": profile.get("created_at"),
        },
    }


@router.put("/settings")
async def update_settings(
    payload: SettingsPayload,
    user: dict = Depends(get_current_user),
    local_db: LocalDBService = Depends(get_supabase_service),
):
    clean_keywords = sorted({kw.strip().lower() for kw in payload.keyword_triggers if kw.strip()})
    updated = local_db.update_profile(
        user["id"],
        {
            "keyword_triggers": clean_keywords,
            "chat_spike_threshold": payload.chat_spike_threshold,
            "watermark_text": payload.watermark_text.strip(),
        },
    )
    return {"profile": updated}
