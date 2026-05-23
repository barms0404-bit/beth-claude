"""Pydantic models — API contracts and inter-agent payloads.

Two model families live here:
  - Inter-agent payloads — the canonical specialist contract (see docs/AGENTS.md).
  - API-facing models — mirror apps/web/lib/api.ts; keep the two in sync.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------
# Enums
# --------------------------------------------------------------------------
class ReportSlot(str, Enum):
    market_prep = "market_prep"   # 7:30 AM AZ
    mid_day = "mid_day"           # 11:00 AM AZ
    market_close = "market_close" # 1:30 PM AZ


# --------------------------------------------------------------------------
# Inter-agent payloads — the canonical specialist contract
# --------------------------------------------------------------------------
class CoveredName(BaseModel):
    """Commentary on a name already in the specialist's coverage universe."""

    ticker: str
    move_pct: float | None = None
    narrative: str
    action: str = Field(description="hold | add | trim | buy | sell | watch")


class NewIdea(BaseModel):
    """A name the specialist is surfacing for the Top 50."""

    ticker: str
    thesis: str
    conviction_1_10: int = Field(ge=1, le=10)
    time_horizon: str = Field(description="e.g. '2-6 weeks', '6-12 months'")
    key_risk: str


class ChartRequest(BaseModel):
    """A specialist asks the Chart Specialist sub-agent for one visual."""

    chart_type: str
    data_needed: str
    why_this_chart: str


class SpecialistReport(BaseModel):
    """Structured result of one specialist run — the canonical contract Beth expects."""

    specialist: str            # human persona name, e.g. "Marcus Webb"
    agent_key: str             # stable registry key, e.g. "midday_tactical"
    timestamp: datetime
    key_takeaway: str
    covered_names_commentary: list[CoveredName] = []
    new_ideas: list[NewIdea] = []
    chart_request: ChartRequest | None = None
    risk_flags: list[str] = []
    compliance_notes: list[str] = []


class ChartExplanation(BaseModel):
    """Three-part plain-English caption — required on every ChartSpec."""

    why_this_chart: str        # 1-2 sentences — what investment question it answers
    how_to_read: str           # 2-3 sentences — axes, key markers, good vs bad
    key_takeaway: str          # 1 sentence — the actionable insight


class ChartSpec(BaseModel):
    """Chart Specialist output — two render specs + structured explainer + PNG."""

    chart_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chart_type: str                    # candlestick | line | bar | scatter | heatmap | treemap | sankey | area
    title: str
    recharts_spec: dict = {}           # interactive web version
    plotly_spec: dict = {}             # what kaleido renders for the email PNG
    plotly_python_code: str = ""       # documentation — equivalent Python, never exec'd
    explanation: ChartExplanation
    png_url: str | None = None
    requested_by: str                  # human persona of the requesting analyst (parent)
    agent_key: str                     # registry key of the requesting analyst
    source: str = "Polygon.io, AA Research"
    rendered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
    conviction: int = Field(ge=1, le=10)
    thesis: str
    leadSpecialist: str                # human persona name
    lastUpdated: datetime


class IndexQuote(BaseModel):
    """One Row-1 market-snapshot tile."""

    label: str                          # display label, e.g. "S&P 500"
    symbol: str                         # display symbol, e.g. "SPY"
    price: float | None = None
    changePct: float | None = None


class NewsItem(BaseModel):
    title: str
    url: str
    publisher: str = ""
    publishedAt: datetime | None = None
    summary: str = ""


class ActivityItem(BaseModel):
    """One entry in the specialist activity feed."""

    persona: str
    agentKey: str
    slot: ReportSlot
    keyTakeaway: str
    timestamp: datetime


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
    marketCap: float | None = None
    employees: int | None = None
    homepage: str | None = None
    sector: str | None = None
    listDate: str | None = None
    notes: list[SpecialistNote] = []


class PriceBar(BaseModel):
    date: str        # YYYY-MM-DD
    close: float
    volume: int


class Top50Entry(BaseModel):
    """One row of the live Top 50 ranking — mirrors the top_50_snapshots table."""

    rank: int
    previous_rank: int | None = None     # None => new entry this cycle
    ticker: str
    company_name: str
    price: float | None = None
    day_change_pct: float | None = None
    ytd_change_pct: float | None = None
    composite_score: float
    lead_specialist: str
    contributing_specialists: list[str] = []
    thesis_summary: str
    conviction_avg: float
    time_horizon: str


class Top50Snapshot(BaseModel):
    """A full ranking captured at one point in time."""

    snapshot_time: datetime
    entries: list[Top50Entry] = []


class ArchivedReport(BaseModel):
    """One archived report HTML on disk, surfaced to the dashboard."""

    slot: str             # e.g. 'market_prep'
    date: str             # YYYY-MM-DD folder name
    generated_at: datetime
    url: str              # static-mounted path, e.g. /reports/2026-05-22/market_prep.html


# --------------------------------------------------------------------------
# Primary Source Verification (PSV) — high-conviction recommendations only
# --------------------------------------------------------------------------
class ClaimType(str, Enum):
    earnings = "earnings"            # revenue / EPS / margin claims -> 10-K, 10-Q, 8-K
    guidance = "guidance"            # forward outlook -> press release, transcript
    analyst_rating = "analyst_rating"  # broker upgrade/downgrade
    patent = "patent"                # IP claim -> USPTO
    regulatory = "regulatory"        # FDA/FCC/FTC approval / action
    ma = "ma"                        # M&A -> 8-K, press release
    insider = "insider"              # insider trade -> Form 4
    institutional = "institutional"  # 13F position
    industry = "industry"            # industry stat -> trade association
    other = "other"


class VerificationStatus(str, Enum):
    verified = "verified"                # claim matches primary source quote
    discrepancy = "discrepancy"          # source contradicts the claim
    unverified = "unverified"            # source searched, claim not found
    source_unavailable = "source_unavailable"  # source category not reachable (paywalled / unstructured)
    skipped = "skipped"                  # PSV did not run (e.g. no Anthropic key)


class ClaimVerification(BaseModel):
    """Result of one verification pass against a primary source."""

    claim_text: str
    claim_type: ClaimType
    status: VerificationStatus
    primary_source_url: str | None = None
    exact_quote: str | None = None
    verification_timestamp: datetime
    discrepancies_found: str | None = None
    notes: str = ""


class OverallVerification(str, Enum):
    verified = "verified"               # all claims verified
    caveat_required = "caveat_required" # 1+ claims unverified / discrepant / unavailable
    skipped = "skipped"


class RecommendationVerification(BaseModel):
    """One high-conviction `new_idea` after PSV. Keyed by (agent_key, ticker)."""

    agent_key: str
    persona: str
    ticker: str
    conviction_1_10: int
    thesis: str
    overall: OverallVerification
    claims: list[ClaimVerification] = []
    verified_at: datetime


class ReportSummary(BaseModel):
    id: str
    slot: ReportSlot
    title: str
    generatedAt: datetime


class GenerateReportRequest(BaseModel):
    slot: ReportSlot
    dry_run: bool = False


class Report(BaseModel):
    """Beth's aggregated output for one research window."""

    slot: ReportSlot
    title: str
    summary: str
    recommendations: list[Recommendation] = []
    charts: list[ChartSpec] = []
    specialist_reports: list[SpecialistReport] = []  # raw filings, retained for drill-down
    verifications: list["RecommendationVerification"] = []  # PSV results, conviction>=8 only
    disclaimer: str
    generated_at: datetime
