from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.deps import get_cleanup_service, get_monitor_service
from app.routers import auth, billing, clips, user


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    monitor_service = get_monitor_service()
    cleanup_service = get_cleanup_service()

    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(
        monitor_service.poll_once,
        trigger=IntervalTrigger(seconds=settings.worker_poll_seconds),
        id="monitor-poll",
        max_instances=1,
        coalesce=True,
    )
    scheduler.add_job(
        cleanup_service.cleanup_expired_clips,
        kwargs={"retention_days": settings.clip_retention_days},
        trigger=CronTrigger(hour=3, minute=0),
        id="clip-cleanup",
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()

    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        await monitor_service.shutdown()


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


app.include_router(auth.router)
app.include_router(user.router)
app.include_router(clips.router)
app.include_router(billing.router)

static_path = Path(__file__).resolve().parent.parent / "static"
app.mount("/", StaticFiles(directory=static_path, html=True), name="static")
