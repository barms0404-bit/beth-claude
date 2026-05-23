"""Healthcare Command Center routes.

Mounted at /api/healthcare/* from main.py. All routes are read-only GETs — writes
happen via specialist filings (Beth's orchestrator writes inferred catalysts
back into the store during dispatch — wiring is downstream of this router).

The store (services.healthcare_store) is JSONL-backed in dev; the route layer
sees only the typed Pydantic models, so swap-to-Supabase is mechanical.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas import (
    ClinicalCatalyst,
    GLP1Snapshot,
    HealthcareLanding,
    PDUFAEntry,
    PatentCliffEntry,
    PipelineAsset,
)
from app.services import healthcare_store

router = APIRouter(prefix="/api/healthcare", tags=["healthcare"])


# ---- Landing -------------------------------------------------------------
@router.get("", response_model=HealthcareLanding)
@router.get("/", response_model=HealthcareLanding, include_in_schema=False)
async def healthcare_landing(top_n: int = Query(10, ge=1, le=50)) -> HealthcareLanding:
    """Composite payload for the /healthcare landing dashboard."""
    return healthcare_store.landing(top_n=top_n)


# ---- Clinical catalyst calendar -----------------------------------------
@router.get("/clinical-catalysts", response_model=list[ClinicalCatalyst])
async def clinical_catalysts(
    status: str | None = Query("upcoming"),
    limit: int = Query(200, ge=1, le=1000),
) -> list[ClinicalCatalyst]:
    return healthcare_store.list_clinical_catalysts(status=status, limit=limit)


# ---- PDUFA calendar -----------------------------------------------------
@router.get("/pdufas", response_model=list[PDUFAEntry])
async def pdufas(
    status: str | None = Query("upcoming"),
    limit: int = Query(200, ge=1, le=1000),
) -> list[PDUFAEntry]:
    return healthcare_store.list_pdufas(status=status, limit=limit)


# ---- GLP-1 megacycle ----------------------------------------------------
@router.get("/glp1/latest", response_model=GLP1Snapshot | None)
async def glp1_latest() -> GLP1Snapshot | None:
    return healthcare_store.latest_glp1()


@router.get("/glp1/history", response_model=list[GLP1Snapshot])
async def glp1_history(limit: int = Query(52, ge=1, le=520)) -> list[GLP1Snapshot]:
    return healthcare_store.list_glp1(limit=limit)


# ---- Pipeline assets ----------------------------------------------------
@router.get("/pipeline", response_model=list[PipelineAsset])
async def pipeline(
    ticker: str | None = None,
    specialist_owner: str | None = Query(
        None, description="biotech_smid | big_pharma | healthcare_tools"
    ),
    phase: str | None = None,
    min_pos: float | None = Query(None, ge=0.0, le=1.0),
    limit: int = Query(200, ge=1, le=1000),
) -> list[PipelineAsset]:
    return healthcare_store.list_pipeline(
        ticker=ticker,
        specialist_owner=specialist_owner,
        phase=phase,
        min_pos=min_pos,
        limit=limit,
    )


# ---- Patent cliff tracker -----------------------------------------------
@router.get("/patent-cliffs", response_model=list[PatentCliffEntry])
async def patent_cliffs(
    ticker: str | None = None,
    limit: int = Query(200, ge=1, le=1000),
) -> list[PatentCliffEntry]:
    return healthcare_store.list_patent_cliffs(ticker=ticker, limit=limit)
