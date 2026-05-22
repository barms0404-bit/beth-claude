"""Sentry SDK initialiser. No-op when SENTRY_DSN is unset."""

from __future__ import annotations

import logging

import sentry_sdk
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from sentry_sdk.integrations.fastapi import FastApiIntegration

from app.config import get_settings

logger = logging.getLogger("sentry")


def init_sentry() -> bool:
    """Initialise Sentry if a DSN is configured. Safe to call multiple times."""
    settings = get_settings()
    if not settings.sentry_dsn:
        logger.info("SENTRY_DSN unset — error tracking disabled.")
        return False
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        integrations=[FastApiIntegration(), AsyncioIntegration()],
        send_default_pii=False,
    )
    logger.info("Sentry initialised — environment=%s", settings.environment)
    return True
