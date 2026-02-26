from __future__ import annotations

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

from app.config import Settings


class TwitchService:
    AUTH_BASE = "https://id.twitch.tv/oauth2/authorize"
    TOKEN_URL = "https://id.twitch.tv/oauth2/token"
    API_BASE = "https://api.twitch.tv/helix"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def build_oauth_url(self, state: str) -> str:
        params = {
            "client_id": self.settings.twitch_client_id,
            "redirect_uri": self.settings.twitch_redirect_uri,
            "response_type": "code",
            "scope": "user:read:email channel:read:subscriptions chat:read clips:edit",
            "state": state,
        }
        return f"{self.AUTH_BASE}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> dict:
        payload = {
            "client_id": self.settings.twitch_client_id,
            "client_secret": self.settings.twitch_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.settings.twitch_redirect_uri,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(self.TOKEN_URL, data=payload)
            response.raise_for_status()
            data = response.json()
        data["expires_at"] = (
            datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 0))
        ).isoformat()
        return data

    async def refresh_access_token(self, refresh_token: str) -> dict:
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.settings.twitch_client_id,
            "client_secret": self.settings.twitch_client_secret,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(self.TOKEN_URL, data=payload)
            response.raise_for_status()
            data = response.json()
        data["expires_at"] = (
            datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 0))
        ).isoformat()
        return data

    async def get_current_user(self, access_token: str) -> dict:
        headers = self._headers(access_token)
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(f"{self.API_BASE}/users", headers=headers)
            response.raise_for_status()
            payload = response.json()
        data = payload.get("data", [])
        if not data:
            raise ValueError("Unable to fetch Twitch user")
        return data[0]

    async def get_live_stream(self, access_token: str, user_login: str) -> dict | None:
        headers = self._headers(access_token)
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{self.API_BASE}/streams",
                params={"user_login": user_login},
                headers=headers,
            )
            response.raise_for_status()
            payload = response.json()

        data = payload.get("data", [])
        return data[0] if data else None

    async def get_latest_vod(self, access_token: str, user_id: str) -> dict | None:
        headers = self._headers(access_token)
        params = {
            "user_id": user_id,
            "type": "archive",
            "first": 1,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{self.API_BASE}/videos", params=params, headers=headers
            )
            response.raise_for_status()
            payload = response.json()

        data = payload.get("data", [])
        return data[0] if data else None

    def _headers(self, access_token: str) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {access_token}",
            "Client-Id": self.settings.twitch_client_id,
        }
