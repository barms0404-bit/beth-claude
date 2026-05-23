"""FastAPI entrypoint for the Armstrong Arikat Research Terminal backend.

This is the Step-1 orchestration shell. Reports are held in an in-memory store so
the full BETH -> specialists -> charts pipeline is demonstrable before Supabase
persistence is wired (see docs/ROADMAP.md, step 2 wiring).
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.agents.orchestrator import Beth
from app.agents.registry import SPECIALISTS
from app.config import get_settings
from app.engine.scheduler import start_scheduler, stop_scheduler
from app.engine.top50 import engine
from app.schemas import (
    ActivityItem,
    ArchivedReport,
    GenerateReportRequest,
    IndexQuote,
    NewsItem,
    PriceBar,
    Recommendation,
    RecommendationVerification,
    Report,
    ReportSlot,
    ReportSummary,
    SpecialistNote,
    TickerDetail,
    Top50Snapshot,
)
from app.middleware.auth import auth_middleware, verify_ws_token
from app.middleware.rate_limit import limiter
from app.routes import webhooks as webhook_routes
from app.services import market_data
from app.services.charts import charts_cache_dir
from app.services.email_send import archive_root, list_archive, send_report
from app.services.polygon_ws import PolygonStream
from app.services.price_relay import PriceRelay
from app.services.sentry import init_sentry

logging.basicConfig(level=logging.INFO)

settings = get_settings()
init_sentry()


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
price_relay = PriceRelay()


async def _on_polygon_trade(msg: dict) -> None:
    """Forward one Polygon trade tick to every connected /ws/prices client."""
    sym = msg.get("sym")
    price = market_data.round2(msg.get("p"))
    if sym and price is not None:
        await price_relay.broadcast(str(sym).upper(), price, msg.get("t"))


polygon_ws: PolygonStream | None = (
    PolygonStream(
        url=settings.polygon_ws_url,
        api_key=settings.polygon_api_key,
        on_trade=_on_polygon_trade,
    )
    if settings.polygon_api_key
    else None
)


async def _handle_top50_update(snapshot: Top50Snapshot) -> None:
    """Engine.on_update — fan out to /ws/top-50 clients AND retune Polygon subs."""
    await manager.broadcast(snapshot)
    if polygon_ws is not None:
        try:
            await polygon_ws.set_subscriptions(e.ticker for e in snapshot.entries)
        except Exception as exc:
            logging.getLogger("main").warning("polygon_ws resubscribe failed: %s", exc)


@asynccontextmanager
async def lifespan(_: FastAPI):
    engine.on_update = _handle_top50_update
    if polygon_ws is not None:
        polygon_ws.start()
    start_scheduler()
    yield
    stop_scheduler()
    if polygon_ws is not None:
        await polygon_ws.stop()


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

# Rate limiter — applied to every route, default limit from settings.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Auth middleware — no-op when REQUIRE_AUTH=false. Public paths in PUBLIC_PATH_PREFIXES.
app.middleware("http")(auth_middleware)

# Resend webhook (Svix-signed; auth via signature, bypasses bearer-token check).
app.include_router(webhook_routes.router)

beth = Beth()

# In-memory report store, keyed by slot. Replaced by Supabase in a later step.
_LATEST: dict[ReportSlot, Report] = {}

# Mount the archived-report HTMLs at /reports for the dashboard's archive links.
app.mount("/reports", StaticFiles(directory=str(archive_root())), name="reports")
# Mount rendered chart PNGs at /charts/{chart_id}.png.
app.mount("/charts", StaticFiles(directory=str(charts_cache_dir())), name="charts")


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "environment": settings.environment,
        "anthropic_configured": settings.has_anthropic,
        "polygon_configured": bool(settings.polygon_api_key),
        "resend_configured": bool(settings.resend_api_key),
        "sentry_configured": bool(settings.sentry_dsn),
        "auth_enforced": settings.require_auth,
        "reports_cached": [s.value for s in _LATEST],
        "top50_size": len(engine.current().entries) if engine.current() else 0,
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


@app.post("/api/reports/run/{slot}")
async def run_and_send_report(slot: ReportSlot) -> dict:
    """Generate a report, archive it, and email it via Resend. Used by the scheduler
    via the equivalent in-process path; this endpoint is the manual trigger."""
    if not settings.has_anthropic:
        raise HTTPException(503, "ANTHROPIC_API_KEY not configured — see apps/api/.env.example")
    report = await beth.generate_report(slot)
    _LATEST[slot] = report
    return await send_report(report)


@app.get("/api/reports/archive", response_model=list[ArchivedReport])
async def reports_archive() -> list[ArchivedReport]:
    """Recent archived HTML reports on disk — the dashboard archive widget."""
    return [ArchivedReport(**item) for item in list_archive(limit=30)]


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


@app.websocket("/ws/prices")
async def ws_prices(ws: WebSocket, _claims: dict = Depends(verify_ws_token)) -> None:
    """Live Polygon trade ticks for the current Top 50 subscription set."""
    await price_relay.connect(ws)
    try:
        while True:
            await ws.receive_text()  # client keep-alive pings; payload ignored
    except WebSocketDisconnect:
        price_relay.disconnect(ws)
    except Exception:
        price_relay.disconnect(ws)


@app.websocket("/ws/top-50")
async def ws_top_50(ws: WebSocket, _claims: dict = Depends(verify_ws_token)) -> None:
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


@app.get(
    "/api/verifications/{ticker}",
    response_model=list[RecommendationVerification],
)
async def ticker_verifications(ticker: str) -> list[RecommendationVerification]:
    """Every cached PSV result for one ticker, newest first."""
    sym = ticker.upper()
    matches: list[RecommendationVerification] = []
    for report in _LATEST.values():
        for v in report.verifications:
            if v.ticker == sym:
                matches.append(v)
    matches.sort(key=lambda v: v.verified_at, reverse=True)
    return matches


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
