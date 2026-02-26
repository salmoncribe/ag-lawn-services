from __future__ import annotations

from typing import Any

from pydantic import BaseModel, EmailStr, Field


class AuthPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class KickConnectPayload(BaseModel):
    api_key: str = Field(min_length=10)
    channel_name: str = Field(min_length=2)


class SettingsPayload(BaseModel):
    keyword_triggers: list[str] = Field(default_factory=list)
    chat_spike_threshold: int = Field(default=20, ge=5, le=200)
    watermark_text: str = Field(default="", max_length=40)


class CheckoutPayload(BaseModel):
    plan_tier: str


class UserProfileResponse(BaseModel):
    profile: dict[str, Any]


class ClipsResponse(BaseModel):
    items: list[dict[str, Any]]
    page: int
    page_size: int
    total: int
