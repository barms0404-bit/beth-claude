"""FastAPI entrypoint for the Armstrong Arikat Research Terminal backend.

This is the Step-1 orchestration shell. Reports are held in an in-memory store so
the full BETH -> specialists -> charts pipeline is demonstrable before Supabase
persistence is wired (see docs/ROADMAP.md, step 2 wiring).
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.agents.orchestrator import Beth
from app.agents.registry import SPECIALISTS
from app.config import get_settings
from app.schemas import (
    GenerateReportRequest,
    Recommendation,
    Report,
    ReportSlot,
    ReportSummary,
    SpecialistNote,
    TickerDetail,
)
from app.services import market_data

logging.basicConfig(level=logging.INFO)

settings = get_settings()
app = FastAPI(title="Armstrong Arikat Research Terminal", version="0.1.0")
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
        {"key": s.key, "name": s.name, "leadSlot": s.lead_slot.value if s.lead_slot else None}
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


@app.get("/api/recommendations/top", response_model=list[Recommendation])
async def top_recommendations() -> list[Recommendation]:
    """Most recent report's Top 50. Picks the freshest slot if several are cached."""
    if not _LATEST:
        return []
    freshest = max(_LATEST.values(), key=lambda r: r.generated_at)
    return freshest.recommendations


@app.get("/api/tickers/{symbol}", response_model=TickerDetail)
async def ticker_detail(symbol: str) -> TickerDetail:
    """Aggregate every cached specialist view of one symbol, plus a live quote."""
    symbol = symbol.upper()
    notes: list[SpecialistNote] = []
    for report in _LATEST.values():
        for rec in report.recommendations:
            if rec.symbol == symbol:
                notes.append(
                    SpecialistNote(
                        agentKey=rec.leadSpecialist,
                        agentName=SPECIALISTS.get(rec.leadSpecialist).name
                        if rec.leadSpecialist in SPECIALISTS
                        else rec.leadSpecialist,
                        commentary=rec.thesis,
                    )
                )

    quote = await market_data.get_quote(symbol)
    return TickerDetail(
        symbol=symbol,
        name=symbol,  # TODO(step 2 wiring): resolve company name from `securities`
        description=(
            "Company profile not yet wired. Connect the `securities` table or a "
            "Polygon reference-data call to populate this field."
        ),
        price=quote.price,
        dailyPct=quote.daily_pct,
        ytdPct=quote.ytd_pct,
        notes=notes,
    )
