"""FastAPI entrypoint for the Armstrong Arikat Research Terminal backend.

This is the Step-1 orchestration shell. Reports are held in an in-memory store so
the full BETH -> specialists -> charts pipeline is demonstrable before Supabase
persistence is wired (see docs/ROADMAP.md, step 2 wiring).
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.agents.orchestrator import Beth
from app.agents.registry import SPECIALISTS
from app.config import get_settings
from app.engine.scheduler import start_scheduler, stop_scheduler
from app.engine.top50 import engine
from app.schemas import (
    ActivityItem,
    GenerateReportRequest,
    IndexQuote,
    NewsItem,
    PriceBar,
    Recommendation,
    Report,
    ReportSlot,
    ReportSummary,
    SpecialistNote,
    TickerDetail,
    Top50Snapshot,
)
from app.services import market_data

logging.basicConfig(level=logging.INFO)

settings = get_settings()


class ConnectionManager:
    """Tracks /ws/top-50 clients and broadcasts ranking snapshots to all of them."""

    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self._clients.discard(ws)

    async def broadcast(self, snapshot: Top50Snapshot) -> None:
        payload = snapshot.model_dump(mode="json")
        dead: list[WebSocket] = []
        for ws in self._clients:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._clients.discard(ws)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Push every engine re-rank to connected WebSocket clients.
    engine.on_update = manager.broadcast
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="Armstrong Arikat Research Terminal",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

beth = Beth()

# In-memory report store, keyed by slot. Replaced by Supabase in a later step.
_LATEST: dict[ReportSlot, Report] = {}


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "anthropic_configured": settings.has_anthropic,
        "polygon_configured": bool(settings.polygon_api_key),
        "reports_cached": [s.value for s in _LATEST],
    }


@app.get("/api/agents")
async def list_agents() -> list[dict]:
    return [
        {
            "key": s.key,
            "persona": s.persona,
            "title": s.name,
            "leadSlot": s.lead_slot.value if s.lead_slot else None,
        }
        for s in SPECIALISTS.values()
    ]


@app.post("/api/reports/generate", response_model=Report)
async def generate_report(req: GenerateReportRequest) -> Report:
    """Trigger BETH to orchestrate a report for the given slot."""
    if not settings.has_anthropic:
        raise HTTPException(503, "ANTHROPIC_API_KEY not configured — see apps/api/.env.example")
    report = await beth.generate_report(req.slot)
    if not req.dry_run:
        _LATEST[req.slot] = report
    return report


@app.get("/api/reports", response_model=list[ReportSummary])
async def list_reports() -> list[ReportSummary]:
    return [
        ReportSummary(
            id=slot.value,
            slot=slot,
            title=report.title,
            generatedAt=report.generated_at,
        )
        for slot, report in _LATEST.items()
    ]


@app.get("/api/reports/latest", response_model=Report | None)
async def latest_report() -> Report | None:
    """The freshest cached report — feeds the dashboard's Row-3 preview."""
    if not _LATEST:
        return None
    return max(_LATEST.values(), key=lambda r: r.generated_at)


@app.get("/api/recommendations/top", response_model=list[Recommendation])
async def top_recommendations() -> list[Recommendation]:
    """Most recent report's Top 50 snapshot. See /api/top-50 for the live engine."""
    if not _LATEST:
        return []
    freshest = max(_LATEST.values(), key=lambda r: r.generated_at)
    return freshest.recommendations


@app.get("/api/top-50", response_model=Top50Snapshot)
async def top_50() -> Top50Snapshot:
    """The live Top 50 ranking from the recommendation engine."""
    snapshot = engine.current()
    if snapshot is None:
        return Top50Snapshot(snapshot_time=datetime.now(timezone.utc), entries=[])
    return snapshot


@app.post("/api/top-50/refresh", response_model=Top50Snapshot)
async def refresh_top_50() -> Top50Snapshot:
    """Manually poll specialists and re-rank — the scheduler does this every 15 min."""
    if not settings.has_anthropic:
        raise HTTPException(503, "ANTHROPIC_API_KEY not configured — see apps/api/.env.example")
    return await beth.refresh_top50()


@app.websocket("/ws/top-50")
async def ws_top_50(ws: WebSocket) -> None:
    """Pushes a full Top50Snapshot to the client whenever the ranking changes."""
    await manager.connect(ws)
    try:
        current = engine.current()
        if current is not None:
            await ws.send_json(current.model_dump(mode="json"))
        while True:
            await ws.receive_text()  # client keep-alive pings; payload ignored
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:
        manager.disconnect(ws)


@app.get("/api/market/snapshot", response_model=list[IndexQuote])
async def market_snapshot() -> list[IndexQuote]:
    """Row-1 dashboard tiles — SPY/QQQ/RSP/IWM/VIX/10Y/DXY/BTC."""
    snap = await market_data.get_dashboard_snapshot()
    return [
        IndexQuote(label=q.label, symbol=q.symbol, price=q.price, changePct=q.change_pct)
        for q in snap
    ]


@app.get("/api/activity", response_model=list[ActivityItem])
async def activity_feed() -> list[ActivityItem]:
    """Specialist activity feed — who filed what, newest first."""
    items: list[ActivityItem] = []
    for slot, report in _LATEST.items():
        for sr in report.specialist_reports:
            items.append(
                ActivityItem(
                    persona=sr.specialist,
                    agentKey=sr.agent_key,
                    slot=slot,
                    keyTakeaway=sr.key_takeaway,
                    timestamp=sr.timestamp,
                )
            )
    items.sort(key=lambda a: a.timestamp, reverse=True)
    return items


@app.get("/api/tickers/{symbol}/news", response_model=list[NewsItem])
async def ticker_news(symbol: str) -> list[NewsItem]:
    """Recent Polygon news for one symbol."""
    raw = await market_data.get_news(symbol.upper(), limit=12)
    return [
        NewsItem(
            title=n.get("title", ""),
            url=n.get("article_url", ""),
            publisher=(n.get("publisher") or {}).get("name", ""),
            publishedAt=n.get("published_utc"),
            summary=n.get("description", "") or "",
        )
        for n in raw
        if n.get("title")
    ]


@app.get("/api/tickers/{symbol}/history", response_model=list[PriceBar])
async def ticker_history(symbol: str, days: int = 120) -> list[PriceBar]:
    """Daily close + volume bars for the stock-detail price chart."""
    bars = await market_data.get_history(symbol.upper(), days=days)
    return [PriceBar(date=b["date"], close=b["close"], volume=b["volume"]) for b in bars]


@app.get("/api/tickers/{symbol}", response_model=TickerDetail)
async def ticker_detail(symbol: str) -> TickerDetail:
    """Aggregate every cached specialist view of one symbol, plus a live quote."""
    symbol = symbol.upper()
    notes: list[SpecialistNote] = []
    for report in _LATEST.values():
        for sr in report.specialist_reports:
            for cn in sr.covered_names_commentary:
                if cn.ticker.upper() == symbol:
                    notes.append(
                        SpecialistNote(
                            agentKey=sr.agent_key,
                            agentName=sr.specialist,
                            commentary=f"[{cn.action}] {cn.narrative}",
                        )
                    )
            for idea in sr.new_ideas:
                if idea.ticker.upper() == symbol:
                    notes.append(
                        SpecialistNote(
                            agentKey=sr.agent_key,
                            agentName=sr.specialist,
                            commentary=(
                                f"[New idea · conviction {idea.conviction_1_10}/10 · "
                                f"{idea.time_horizon}] {idea.thesis} "
                                f"Key risk: {idea.key_risk}"
                            ),
                        )
                    )

    quote = await market_data.get_quote(symbol)
    details = await market_data.get_ticker_details(symbol)
    return TickerDetail(
        symbol=symbol,
        name=details.get("name") or symbol,
        description=details.get("description")
        or "No company profile available from Polygon for this ticker.",
        price=quote.price,
        dailyPct=quote.daily_pct,
        ytdPct=quote.ytd_pct,
        marketCap=details.get("market_cap"),
        employees=details.get("total_employees"),
        homepage=details.get("homepage_url"),
        sector=details.get("sic_description"),
        listDate=details.get("list_date"),
        notes=notes,
    )
