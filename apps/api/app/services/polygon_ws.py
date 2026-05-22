"""Polygon real-time stream client — wss://socket.polygon.io/stocks.

Connects, authenticates, subscribes to a dynamic set of `T.<TICKER>` trade
channels (the engine refreshes the set every time the Top 50 ranking changes),
and forwards each trade to a callback. Reconnects with exponential backoff;
authentication failure exits cleanly so a wrong-tier key does not loop forever.

Polygon's Stocks Advanced tier ($199/mo) is required for live trades. A Starter
key will auth-fail; the client logs and stops, REST stays unaffected.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Awaitable, Callable, Iterable

import websockets
from websockets.exceptions import ConnectionClosed

logger = logging.getLogger("polygon_ws")

OnTrade = Callable[[dict], Awaitable[None]]


class PolygonStream:
    """One async task owns the socket; callers mutate the subscription set."""

    def __init__(self, url: str, api_key: str, on_trade: OnTrade) -> None:
        self.url = url
        self.api_key = api_key
        self.on_trade = on_trade

        self._desired: set[str] = set()
        self._subscribed: set[str] = set()
        self._ws: websockets.WebSocketClientProtocol | None = None
        self._task: asyncio.Task | None = None
        self._stopping = False
        self._auth_dead = False  # set when auth_failed — do not retry

    # -- lifecycle ----------------------------------------------------------
    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run(), name="polygon_ws")

    async def stop(self) -> None:
        self._stopping = True
        if self._ws is not None:
            try:
                await self._ws.close()
            except Exception:
                pass
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except (asyncio.CancelledError, Exception):
                pass

    # -- subscription set ---------------------------------------------------
    async def set_subscriptions(self, tickers: Iterable[str]) -> None:
        self._desired = {t.upper() for t in tickers}
        if self._ws is not None and not self._ws.closed:
            await self._reconcile()

    async def _reconcile(self) -> None:
        """Diff desired vs subscribed and send minimal sub/unsub frames."""
        assert self._ws is not None
        to_add = self._desired - self._subscribed
        to_remove = self._subscribed - self._desired
        if to_add:
            await self._ws.send(
                json.dumps({"action": "subscribe", "params": ",".join(f"T.{t}" for t in to_add)})
            )
        if to_remove:
            await self._ws.send(
                json.dumps({"action": "unsubscribe", "params": ",".join(f"T.{t}" for t in to_remove)})
            )
        self._subscribed = set(self._desired)

    # -- main loop ----------------------------------------------------------
    async def _run(self) -> None:
        backoff = 1.0
        while not self._stopping and not self._auth_dead:
            try:
                async with websockets.connect(self.url, ping_interval=20) as ws:
                    self._ws = ws
                    if not await self._authenticate(ws):
                        # Hard exit — tier / key issue, no point retrying.
                        return
                    logger.info("Polygon WS connected + authenticated.")
                    self._subscribed = set()
                    backoff = 1.0
                    await self._reconcile()
                    await self._consume(ws)
            except asyncio.CancelledError:
                return
            except Exception as exc:
                logger.warning("Polygon WS dropped: %s — reconnecting in %.1fs", exc, backoff)
            finally:
                self._ws = None

            if self._stopping or self._auth_dead:
                return
            try:
                await asyncio.sleep(backoff)
            except asyncio.CancelledError:
                return
            backoff = min(backoff * 2, 60.0)

    async def _authenticate(self, ws) -> bool:
        await ws.send(json.dumps({"action": "auth", "params": self.api_key}))
        # Polygon sends a status array — wait until we see auth_success or auth_failed.
        async for raw in ws:
            messages = self._coerce(raw)
            for m in messages:
                if m.get("ev") != "status":
                    continue
                status = m.get("status")
                if status == "auth_success":
                    return True
                if status == "auth_failed":
                    logger.error(
                        "Polygon WS auth_failed: %s — likely the key lacks the "
                        "Stocks Advanced tier required for the real-time stream.",
                        m.get("message", ""),
                    )
                    self._auth_dead = True
                    return False
        return False

    async def _consume(self, ws) -> None:
        try:
            async for raw in ws:
                for m in self._coerce(raw):
                    if m.get("ev") == "T":
                        try:
                            await self.on_trade(m)
                        except Exception as exc:
                            logger.debug("on_trade handler error: %s", exc)
        except ConnectionClosed:
            return

    @staticmethod
    def _coerce(raw: str | bytes) -> list[dict]:
        try:
            data = json.loads(raw)
        except Exception:
            return []
        return data if isinstance(data, list) else [data]
