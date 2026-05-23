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

    # FRED (Federal Reserve Economic Data) — treasury yields, spreads, macro
    fred_api_key: str = ""

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

    # --- Production deploy concerns ---
    environment: str = "development"      # 'development' | 'staging' | 'production'

    # Sentry — error tracking
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 0.1

    # Supabase Auth — JWT verification
    require_auth: bool = False            # gate every protected endpoint when true
    supabase_jwt_secret: str = ""         # HS256 secret from Supabase project settings

    # Resend webhooks — bounce/complaint signature verification (Svix)
    resend_webhook_secret: str = ""

    # Public REST rate limit (slowapi). e.g. "60/minute".
    rate_limit_default: str = "60/minute"

    # Macro event calendar — comma-separated YYYY-MM-DD lists, ET-local dates.
    # Beth's orchestration rule: on FOMC / CPI / NFP days, Fixed Income leads
    # the report. NFP is detected algorithmically (first Friday); these two
    # need annual updates from Brian.
    fomc_dates: str = ""
    cpi_dates: str = ""

    # Citation Enforcement Agent — strip uncited factual claims from specialist
    # output when true. Keep false until specialists emit citation tags
    # (requires tool-use in the specialist pipeline, not yet wired).
    citation_strict_mode: bool = False

    # Temporal discipline — both the specialist's mental ruler (prompt) and the
    # Validator's actual rejection threshold for market-hours data freshness.
    stale_threshold_minutes: int = 5
    coverage_gap_days: int = 7

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def has_anthropic(self) -> bool:
        return bool(self.anthropic_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
