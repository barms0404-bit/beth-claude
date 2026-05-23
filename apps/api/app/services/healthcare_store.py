"""JSONL-backed dev store for the Healthcare Command Center tables.

Matches the audit_log pattern: file-backed JSONL holds the line until Supabase
is wired through `services.db`. Row shape is identical to the migration so a
swap to a real DB read is mechanical.

Read paths return data sorted into the natural display order for each
dashboard (next-up calendars ascending by date; latest GLP-1 snapshot first;
pipeline by descending PoS; LOE by ascending estimated_loe_date).

Write paths upsert by `id` (or `snapshot_date` for the GLP-1 singleton).

Files live under `apps/api/.local/healthcare/` (gitignored alongside .audit/).
"""

from __future__ import annotations

import json
import threading
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from app.schemas import (
    ClinicalCatalyst,
    GLP1Snapshot,
    HealthcareLanding,
    PDUFAEntry,
    PatentCliffEntry,
    PipelineAsset,
)

# --------------------------------------------------------------------------
# File layout
# --------------------------------------------------------------------------
_ROOT = Path(__file__).resolve().parents[2] / ".local" / "healthcare"
_ROOT.mkdir(parents=True, exist_ok=True)

_FILES = {
    "clinical_catalyst": _ROOT / "clinical_catalyst_calendar.jsonl",
    "pdufa":             _ROOT / "pdufa_calendar.jsonl",
    "glp1":              _ROOT / "glp1_megacycle_data.jsonl",
    "pipeline":          _ROOT / "pipeline_assets.jsonl",
    "patent_cliff":      _ROOT / "patent_cliff_tracker.jsonl",
}
_LOCK = threading.Lock()


# --------------------------------------------------------------------------
# IO helpers
# --------------------------------------------------------------------------
def _read_all(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue  # corrupt line — skip silently for dev store
    return rows


def _write_all(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, default=_json_default) + "\n")
    tmp.replace(path)


def _json_default(o: Any) -> Any:
    if isinstance(o, (datetime, date)):
        return o.isoformat()
    if isinstance(o, uuid.UUID):
        return str(o)
    raise TypeError(f"Unserializable: {type(o)}")


def _now() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------
# Clinical catalyst calendar
# --------------------------------------------------------------------------
def list_clinical_catalysts(
    *, status: str | None = "upcoming", limit: int = 200
) -> list[ClinicalCatalyst]:
    rows = _read_all(_FILES["clinical_catalyst"])
    if status:
        rows = [r for r in rows if r.get("status") == status]
    rows.sort(key=lambda r: (r.get("catalyst_date") or "9999-12-31"))
    return [ClinicalCatalyst.model_validate(r) for r in rows[:limit]]


def upsert_clinical_catalyst(entry: ClinicalCatalyst) -> ClinicalCatalyst:
    with _LOCK:
        rows = _read_all(_FILES["clinical_catalyst"])
        if entry.id is None:
            entry = entry.model_copy(update={"id": uuid.uuid4(), "created_at": _now()})
        entry = entry.model_copy(update={"updated_at": _now()})
        rows = [r for r in rows if r.get("id") != str(entry.id)]
        rows.append(entry.model_dump(mode="json"))
        _write_all(_FILES["clinical_catalyst"], rows)
    return entry


# --------------------------------------------------------------------------
# PDUFA calendar
# --------------------------------------------------------------------------
def list_pdufas(*, status: str | None = "upcoming", limit: int = 200) -> list[PDUFAEntry]:
    rows = _read_all(_FILES["pdufa"])
    if status:
        rows = [r for r in rows if r.get("status") == status]
    rows.sort(key=lambda r: (r.get("pdufa_date") or "9999-12-31"))
    return [PDUFAEntry.model_validate(r) for r in rows[:limit]]


def upsert_pdufa(entry: PDUFAEntry) -> PDUFAEntry:
    with _LOCK:
        rows = _read_all(_FILES["pdufa"])
        if entry.id is None:
            entry = entry.model_copy(update={"id": uuid.uuid4(), "created_at": _now()})
        entry = entry.model_copy(update={"updated_at": _now()})
        rows = [r for r in rows if r.get("id") != str(entry.id)]
        rows.append(entry.model_dump(mode="json"))
        _write_all(_FILES["pdufa"], rows)
    return entry


# --------------------------------------------------------------------------
# GLP-1 megacycle snapshots (one row per snapshot_date)
# --------------------------------------------------------------------------
def latest_glp1() -> GLP1Snapshot | None:
    rows = _read_all(_FILES["glp1"])
    if not rows:
        return None
    rows.sort(key=lambda r: (r.get("snapshot_date") or ""), reverse=True)
    return GLP1Snapshot.model_validate(rows[0])


def list_glp1(limit: int = 52) -> list[GLP1Snapshot]:
    rows = _read_all(_FILES["glp1"])
    rows.sort(key=lambda r: (r.get("snapshot_date") or ""), reverse=True)
    return [GLP1Snapshot.model_validate(r) for r in rows[:limit]]


def upsert_glp1(entry: GLP1Snapshot) -> GLP1Snapshot:
    with _LOCK:
        rows = _read_all(_FILES["glp1"])
        snap_iso = (
            entry.snapshot_date.isoformat()
            if isinstance(entry.snapshot_date, (datetime, date))
            else str(entry.snapshot_date)
        )
        rows = [r for r in rows if (r.get("snapshot_date") or "") != snap_iso]
        if entry.id is None:
            entry = entry.model_copy(update={"id": uuid.uuid4(), "created_at": _now()})
        rows.append(entry.model_dump(mode="json"))
        _write_all(_FILES["glp1"], rows)
    return entry


# --------------------------------------------------------------------------
# Pipeline assets
# --------------------------------------------------------------------------
def list_pipeline(
    *,
    ticker: str | None = None,
    specialist_owner: str | None = None,
    phase: str | None = None,
    min_pos: float | None = None,
    limit: int = 200,
) -> list[PipelineAsset]:
    rows = _read_all(_FILES["pipeline"])
    if ticker:
        rows = [r for r in rows if (r.get("ticker") or "").upper() == ticker.upper()]
    if specialist_owner:
        rows = [r for r in rows if r.get("specialist_owner") == specialist_owner]
    if phase:
        rows = [r for r in rows if r.get("current_phase") == phase]
    if min_pos is not None:
        rows = [r for r in rows if (r.get("probability_of_success") or 0) >= min_pos]
    rows.sort(key=lambda r: (r.get("probability_of_success") or 0), reverse=True)
    return [PipelineAsset.model_validate(r) for r in rows[:limit]]


def upsert_pipeline(entry: PipelineAsset) -> PipelineAsset:
    with _LOCK:
        rows = _read_all(_FILES["pipeline"])
        if entry.id is None:
            entry = entry.model_copy(update={"id": uuid.uuid4()})
        entry = entry.model_copy(update={"last_updated": _now()})
        rows = [r for r in rows if r.get("id") != str(entry.id)]
        rows.append(entry.model_dump(mode="json"))
        _write_all(_FILES["pipeline"], rows)
    return entry


# --------------------------------------------------------------------------
# Patent cliff tracker
# --------------------------------------------------------------------------
def list_patent_cliffs(
    *, ticker: str | None = None, limit: int = 200
) -> list[PatentCliffEntry]:
    rows = _read_all(_FILES["patent_cliff"])
    if ticker:
        rows = [r for r in rows if (r.get("ticker") or "").upper() == ticker.upper()]
    rows.sort(key=lambda r: (r.get("estimated_loe_date") or "9999-12-31"))
    return [PatentCliffEntry.model_validate(r) for r in rows[:limit]]


def upsert_patent_cliff(entry: PatentCliffEntry) -> PatentCliffEntry:
    with _LOCK:
        rows = _read_all(_FILES["patent_cliff"])
        if entry.id is None:
            entry = entry.model_copy(update={"id": uuid.uuid4(), "created_at": _now()})
        entry = entry.model_copy(update={"updated_at": _now()})
        rows = [r for r in rows if r.get("id") != str(entry.id)]
        rows.append(entry.model_dump(mode="json"))
        _write_all(_FILES["patent_cliff"], rows)
    return entry


# --------------------------------------------------------------------------
# Landing composite (one call -> all five datasets, capped)
# --------------------------------------------------------------------------
def landing(*, top_n: int = 10) -> HealthcareLanding:
    return HealthcareLanding(
        next_catalysts=list_clinical_catalysts(limit=top_n),
        next_pdufas=list_pdufas(limit=top_n),
        latest_glp1=latest_glp1(),
        high_pos_pipeline=list_pipeline(min_pos=0.50, limit=top_n),
        near_loe_drugs=list_patent_cliffs(limit=top_n),
    )
