"""Browser-side fanout for live price ticks.

Each trade message from `PolygonStream` is broadcast as a compact JSON frame to
all connected /ws/prices clients. Pattern mirrors the /ws/top-50 ConnectionManager.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger("price_relay")


class PriceRelay:
    """Tracks /ws/prices clients and broadcasts price ticks to all of them."""

    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self._clients.discard(ws)

    async def broadcast(self, ticker: str, price: float, ts: int | None = None) -> None:
        if not self._clients:
            return
        payload: dict[str, Any] = {"ticker": ticker, "price": price}
        if ts is not None:
            payload["ts"] = ts
        dead: list[WebSocket] = []
        for ws in self._clients:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._clients.discard(ws)
