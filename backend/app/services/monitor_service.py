from __future__ import annotations

import asyncio
import logging
import random
import re
import time
from collections import deque
from datetime import datetime, timezone

import websockets
from cryptography.fernet import Fernet

from app.services.clip_manager import ClipManager
from app.services.kick_service import KickService
from app.services.supabase_service import SupabaseService
from app.services.twitch_service import TwitchService
from app.services.video_pipeline import HighlightEvent
from app.utils.security import decrypt_text

logger = logging.getLogger(__name__)
PRIVMSG_PATTERN = re.compile(r"^:[^ ]+ PRIVMSG #[^ ]+ :(.+)$")


class StreamMonitorService:
    def __init__(
        self,
        supabase_service: SupabaseService,
        twitch_service: TwitchService,
        kick_service: KickService,
        clip_manager: ClipManager,
        cipher: Fernet,
    ) -> None:
        self.supabase = supabase_service
        self.twitch = twitch_service
        self.kick = kick_service
        self.clip_manager = clip_manager
        self.cipher = cipher

        self._twitch_tasks: dict[str, asyncio.Task] = {}
        self._kick_tasks: dict[str, asyncio.Task] = {}
        self._last_trigger_at: dict[str, float] = {}

    async def poll_once(self) -> None:
        profiles = self.supabase.list_monitorable_profiles()

        for profile in profiles:
            await self._poll_twitch_profile(profile)
            await self._poll_kick_profile(profile)

        await self._cleanup_finished_tasks()

    async def _poll_twitch_profile(self, profile: dict) -> None:
        user_id = profile["user_id"]
        encrypted_token = profile.get("twitch_token")
        if not encrypted_token:
            await self._cancel_if_running(self._twitch_tasks, user_id)
            return

        token = decrypt_text(self.cipher, encrypted_token)
        if not token:
            await self._cancel_if_running(self._twitch_tasks, user_id)
            return

        login = profile.get("twitch_user_login")
        if not login:
            return

        try:
            stream = await self.twitch.get_live_stream(token, login)
        except Exception as exc:
            logger.warning("Twitch poll failed for %s: %s", login, exc)
            return

        if not stream:
            await self._cancel_if_running(self._twitch_tasks, user_id)
            return

        if user_id in self._twitch_tasks and not self._twitch_tasks[user_id].done():
            return

        task = asyncio.create_task(self._monitor_twitch_chat(profile, stream, token))
        self._twitch_tasks[user_id] = task

    async def _poll_kick_profile(self, profile: dict) -> None:
        user_id = profile["user_id"]
        encrypted_key = profile.get("kick_token")
        channel_name = profile.get("kick_channel_name")
        if not encrypted_key or not channel_name:
            await self._cancel_if_running(self._kick_tasks, user_id)
            return

        key = decrypt_text(self.cipher, encrypted_key)
        if not key:
            await self._cancel_if_running(self._kick_tasks, user_id)
            return

        try:
            is_live, channel = await self.kick.is_live(channel_name, key)
        except Exception as exc:
            logger.warning("Kick poll failed for %s: %s", channel_name, exc)
            return

        if not is_live:
            await self._cancel_if_running(self._kick_tasks, user_id)
            return

        if user_id in self._kick_tasks and not self._kick_tasks[user_id].done():
            return

        task = asyncio.create_task(self._monitor_kick_stream(profile, channel or {}))
        self._kick_tasks[user_id] = task

    async def _monitor_twitch_chat(self, profile: dict, stream: dict, access_token: str) -> None:
        channel = profile["twitch_user_login"].lower()
        nick = profile["twitch_user_login"].lower()
        user_id = profile["user_id"]

        spike_threshold = int(profile.get("chat_spike_threshold") or 20)
        keywords = [
            kw.strip().lower()
            for kw in (profile.get("keyword_triggers") or ["clip", "insane", "no way"])
            if kw.strip()
        ]
        watermark = profile.get("watermark_text") or channel

        message_times: deque[float] = deque(maxlen=1000)
        stream_id = stream.get("id")
        started_at = self._parse_datetime(stream.get("started_at"))

        while True:
            try:
                async with websockets.connect("wss://irc-ws.chat.twitch.tv:443") as ws:
                    await ws.send(f"PASS oauth:{access_token}")
                    await ws.send(f"NICK {nick}")
                    await ws.send(f"JOIN #{channel}")

                    while True:
                        raw = await ws.recv()
                        if isinstance(raw, bytes):
                            raw = raw.decode("utf-8", errors="ignore")

                        for line in raw.split("\r\n"):
                            if not line:
                                continue
                            if line.startswith("PING"):
                                await ws.send("PONG :tmi.twitch.tv")
                                continue

                            msg = self._extract_privmsg(line)
                            if not msg:
                                continue

                            now = time.time()
                            message_times.append(now)
                            while message_times and now - message_times[0] > 10:
                                message_times.popleft()

                            is_spike = len(message_times) >= spike_threshold
                            has_keyword = any(keyword in msg.lower() for keyword in keywords)
                            if not (is_spike or has_keyword):
                                continue

                            trigger_key = f"twitch:{user_id}:{stream_id}"
                            if now - self._last_trigger_at.get(trigger_key, 0) < 45:
                                continue

                            self._last_trigger_at[trigger_key] = now
                            timestamp_seconds = max(
                                10,
                                int((datetime.now(timezone.utc) - started_at).total_seconds()),
                            )

                            vod = await self.twitch.get_latest_vod(access_token, profile.get("twitch_user_id", ""))
                            vod_url = (vod or {}).get("url")
                            if not vod_url:
                                continue

                            event = HighlightEvent(
                                user_id=user_id,
                                platform="twitch",
                                vod_url=vod_url,
                                timestamp_seconds=timestamp_seconds,
                                username=channel,
                                watermark_text=watermark,
                                stream_id=stream_id,
                            )
                            await self.clip_manager.handle_highlight(profile, event)

            except asyncio.CancelledError:
                return
            except Exception as exc:
                logger.warning("Twitch chat monitor error for %s: %s", channel, exc)
                await asyncio.sleep(5 + random.randint(0, 5))

    async def _monitor_kick_stream(self, profile: dict, channel: dict) -> None:
        user_id = profile["user_id"]
        channel_name = profile.get("kick_channel_name") or ""
        watermark = profile.get("watermark_text") or channel_name
        stream_id = str((channel.get("livestream") or {}).get("id") or "")
        key = decrypt_text(self.cipher, profile.get("kick_token"))
        if not key:
            return

        viewer_samples: deque[int] = deque(maxlen=8)

        while True:
            try:
                is_live, fresh = await self.kick.is_live(channel_name, key)
                if not is_live:
                    return

                livestream = (fresh or {}).get("livestream") or {}
                viewers = int(livestream.get("viewer_count") or 0)
                viewer_samples.append(viewers)

                # Kick API access is limited; viewer spikes are used as a fallback highlight signal.
                if len(viewer_samples) >= 3:
                    baseline = sum(list(viewer_samples)[:-1]) / max(1, len(viewer_samples) - 1)
                    if viewers > baseline + 20:
                        trigger_key = f"kick:{user_id}:{stream_id}"
                        now = time.time()
                        if now - self._last_trigger_at.get(trigger_key, 0) > 90:
                            self._last_trigger_at[trigger_key] = now
                            vod_url = livestream.get("source") or livestream.get("url")
                            if vod_url:
                                event = HighlightEvent(
                                    user_id=user_id,
                                    platform="kick",
                                    vod_url=vod_url,
                                    timestamp_seconds=30,
                                    username=channel_name,
                                    watermark_text=watermark,
                                    stream_id=stream_id,
                                )
                                await self.clip_manager.handle_highlight(profile, event)

                await asyncio.sleep(20)

            except asyncio.CancelledError:
                return
            except Exception as exc:
                logger.warning("Kick monitor error for %s: %s", channel_name, exc)
                await asyncio.sleep(15)

    async def shutdown(self) -> None:
        for task in [*self._twitch_tasks.values(), *self._kick_tasks.values()]:
            task.cancel()
        await self._cleanup_finished_tasks()

    async def _cancel_if_running(self, task_map: dict[str, asyncio.Task], user_id: str) -> None:
        task = task_map.get(user_id)
        if task and not task.done():
            task.cancel()

    async def _cleanup_finished_tasks(self) -> None:
        for task_map in (self._twitch_tasks, self._kick_tasks):
            done = [user_id for user_id, task in task_map.items() if task.done()]
            for user_id in done:
                task_map.pop(user_id, None)

    @staticmethod
    def _extract_privmsg(line: str) -> str | None:
        match = PRIVMSG_PATTERN.match(line)
        if not match:
            return None
        return match.group(1)

    @staticmethod
    def _parse_datetime(value: str | None) -> datetime:
        if not value:
            return datetime.now(timezone.utc)
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
