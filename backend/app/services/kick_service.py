from __future__ import annotations

import httpx


class KickService:
    API_BASE = "https://kick.com/api/v2"

    async def get_channel(self, channel_name: str, api_key: str | None = None) -> dict | None:
        headers = {"Accept": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{self.API_BASE}/channels/{channel_name}",
                headers=headers,
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()

    async def is_live(self, channel_name: str, api_key: str | None = None) -> tuple[bool, dict | None]:
        channel = await self.get_channel(channel_name, api_key)
        if not channel:
            return False, None

        livestream = channel.get("livestream")
        return bool(livestream and livestream.get("is_live", True)), channel
