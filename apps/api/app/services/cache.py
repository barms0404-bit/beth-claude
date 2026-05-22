"""Async TTL cache with a market-aware TTL.

Used by `services/market_data.py` to cache Polygon REST responses: short TTL
during NYSE regular hours (data moves), long TTL off-hours (data is static).
"""

from __future__ import annotations

import asyncio
import functools
import time
from typing import Any, Awaitable, Callable, TypeVar

T = TypeVar("T")


def async_ttl_cache(
    ttl_open: float, ttl_closed: float | None = None
) -> Callable[[Callable[..., Awaitable[T]]], Callable[..., Awaitable[T]]]:
    """Cache an async function's result by argument tuple.

    `ttl_open`   — TTL in seconds during NYSE regular hours.
    `ttl_closed` — TTL off-hours. Defaults to `ttl_open` if omitted.
    """
    if ttl_closed is None:
        ttl_closed = ttl_open

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        cache: dict[Any, tuple[float, T]] = {}
        lock = asyncio.Lock()

        @functools.wraps(func)
        async def wrapped(*args: Any, **kwargs: Any) -> T:
            # Imported lazily to avoid a circular import at module load.
            from app.engine.top50 import market_open

            ttl = ttl_open if market_open() else ttl_closed
            key = (args, tuple(sorted(kwargs.items())))
            now = time.time()

            hit = cache.get(key)
            if hit and hit[0] > now:
                return hit[1]

            async with lock:
                hit = cache.get(key)
                if hit and hit[0] > now:
                    return hit[1]
                result = await func(*args, **kwargs)
                cache[key] = (now + ttl, result)
                return result

        wrapped.cache_clear = cache.clear  # type: ignore[attr-defined]
        return wrapped

    return decorator
