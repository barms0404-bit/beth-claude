"""slowapi rate limiter — default limit from `RATE_LIMIT_DEFAULT` env var.

Apply per-endpoint as ``@limiter.limit("...")`` for tighter limits on hot paths;
the default applies to every route otherwise.
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings

_settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[_settings.rate_limit_default],
)
