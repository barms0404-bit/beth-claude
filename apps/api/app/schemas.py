"""Pydantic models — API contracts and inter-agent payloads.

The API-facing models mirror apps/web/lib/api.ts; keep the two in sync.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------
# Enums
# --------------------------------------------------------------------------
class ReportSlot(str, Enum):
    market_prep = "market_prep"   # 7:30 AM
    mid_day = "mid_day"           # 11:00 AM
    market_close = "market_close" # 1:30 PM


class Stance(str, Enum):
    bullish = "bullish"
    neutral = "neutral"
    bearish = "bearish"


# --------------------------------------------------------------------------
# Inter-agent payloads — what a specialist returns to BETH
# --------------------------------------------------------------------------
class RecommendationDraft(BaseModel):
    """A single name a specialist wants on the Top 50."""

    symbol: str
    thesis: str
    conviction: Stance = Stance.bullish
    score: float = Field(ge=0, le=100, description="Specialist conviction, 0-100.")


class ChartRequest(BaseModel):
    """A specialist asks the Chart Specialist for a visual."""

    symbol: str | None = None
    title: str
    intent: str = Field(description="What the chart should show and why it matters.")


class SpecialistOutput(BaseModel):
    """Structured result of one specialist run."""

    agent_key: str
    headline: str
    commentary: str
    recommendations: list[RecommendationDraft] = []
    chart_requests: list[ChartRequest] = []
    stance: Stance = Stance.neutral


class ChartSpec(BaseModel):
    """Chart Specialist output — renderable spec + explainer + optional PNG."""

    title: str
    library: str = "plotly"            # 'plotly' | 'recharts'
    spec_json: dict = {}
    explanation: str
    png_url: str | None = None
    symbol: str | None = None
    agent_key: str


# --------------------------------------------------------------------------
# API-facing models (mirror apps/web/lib/api.ts)
# --------------------------------------------------------------------------
class Recommendation(BaseModel):
    rank: int
    symbol: str
    name: str
    price: float | None = None
    dailyPct: float | None = None
    ytdPct: float | None = None
    thesis: str
    leadSpecialist: str


class SpecialistNote(BaseModel):
    agentKey: str
    agentName: str
    commentary: str


class TickerDetail(BaseModel):
    symbol: str
    name: str
    description: str
    price: float | None = None
    dailyPct: float | None = None
    ytdPct: float | None = None
    notes: list[SpecialistNote] = []


class ReportSummary(BaseModel):
    id: str
    slot: ReportSlot
    title: str
    generatedAt: datetime


class GenerateReportRequest(BaseModel):
    slot: ReportSlot
    dry_run: bool = False


class Report(BaseModel):
    """BETH's aggregated output for one research window."""

    slot: ReportSlot
    title: str
    summary: str
    recommendations: list[Recommendation] = []
    charts: list[ChartSpec] = []
    disclaimer: str
    generated_at: datetime
