"""Environment-backed configuration. Values come from apps/api/.env (see .env.example)."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    # Polygon.io
    polygon_api_key: str = ""
    polygon_ws_url: str = "wss://socket.polygon.io/stocks"

    # Supabase (service-role key — backend only)
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Resend email
    resend_api_key: str = ""
    report_from_email: str = "research@armstrongarikat.com"
    report_to_email: str = "brian@cccballers.com"

    # Scheduling — Arizona never observes DST
    schedule_timezone: str = "America/Phoenix"

    # CORS
    allowed_origins: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def has_anthropic(self) -> bool:
        return bool(self.anthropic_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
