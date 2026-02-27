from __future__ import annotations
import logging

from app.services.clip_manager import ClipManager

logger = logging.getLogger(__name__)

class StreamMonitorService:
    def __init__(self, *args, **kwargs) -> None:
        pass

    async def poll_once(self) -> None:
        pass

    async def shutdown(self) -> None:
        pass
