from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from supabase import Client, create_client

from app.config import Settings


class SupabaseService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.anon_client: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
        self.service_client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    def sign_up(self, email: str, password: str) -> dict[str, Any]:
        response = self.anon_client.auth.sign_up({"email": email, "password": password})
        return {
            "user": response.user.model_dump() if response.user else None,
            "session": response.session.model_dump() if response.session else None,
        }

    def sign_in(self, email: str, password: str) -> dict[str, Any]:
        response = self.anon_client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
        return {
            "user": response.user.model_dump() if response.user else None,
            "session": response.session.model_dump() if response.session else None,
        }

    def get_user_from_token(self, token: str) -> dict[str, Any]:
        user_response = self.service_client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise ValueError("Invalid auth token")
        return user_response.user.model_dump()

    def ensure_profile(self, user_id: str, email: str) -> dict[str, Any]:
        existing = self.get_profile(user_id)
        if existing:
            return existing

        payload = {
            "user_id": user_id,
            "email": email,
            "plan_tier": "basic",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        response = self.service_client.table("profiles").insert(payload).execute()
        return response.data[0] if response.data else payload

    def get_profile(self, user_id: str) -> dict[str, Any] | None:
        response = (
            self.service_client.table("profiles")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def update_profile(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        response = (
            self.service_client.table("profiles")
            .update(updates)
            .eq("user_id", user_id)
            .execute()
        )
        if not response.data:
            raise ValueError("Profile not found")
        return response.data[0]

    def list_monitorable_profiles(self) -> list[dict[str, Any]]:
        response = (
            self.service_client.table("profiles")
            .select("*")
            .or_("twitch_token.not.is.null,kick_token.not.is.null")
            .execute()
        )
        return response.data or []

    def list_clips(self, user_id: str, page: int, page_size: int) -> tuple[list[dict[str, Any]], int]:
        start = (page - 1) * page_size
        end = start + page_size - 1

        response = (
            self.service_client.table("clips")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(start, end)
            .execute()
        )
        items = response.data or []
        total = response.count or 0
        return items, total

    def create_clip(self, clip_payload: dict[str, Any]) -> dict[str, Any]:
        response = self.service_client.table("clips").insert(clip_payload).execute()
        if not response.data:
            raise ValueError("Unable to create clip")
        return response.data[0]

    def count_stream_clips(self, user_id: str, stream_id: str) -> int:
        response = (
            self.service_client.table("clips")
            .select("clip_id", count="exact")
            .eq("user_id", user_id)
            .eq("stream_id", stream_id)
            .execute()
        )
        return response.count or 0

    def get_clip(self, user_id: str, clip_id: str) -> dict[str, Any] | None:
        response = (
            self.service_client.table("clips")
            .select("*")
            .eq("user_id", user_id)
            .eq("clip_id", clip_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def delete_clip(self, user_id: str, clip_id: str) -> None:
        self.service_client.table("clips").delete().eq("user_id", user_id).eq(
            "clip_id", clip_id
        ).execute()

    def update_clip(self, clip_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        response = (
            self.service_client.table("clips")
            .update(updates)
            .eq("clip_id", clip_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def mark_old_clips_for_deletion(self, retention_days: int) -> list[dict[str, Any]]:
        response = self.service_client.rpc(
            "get_expired_clips", {"retention_days": retention_days}
        ).execute()
        return response.data or []

    def update_plan_by_customer(self, stripe_customer_id: str, plan_tier: str) -> None:
        (
            self.service_client.table("profiles")
            .update(
                {
                    "plan_tier": plan_tier,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("stripe_customer_id", stripe_customer_id)
            .execute()
        )

    def set_customer_id(self, user_id: str, customer_id: str) -> None:
        (
            self.service_client.table("profiles")
            .update(
                {
                    "stripe_customer_id": customer_id,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("user_id", user_id)
            .execute()
        )
