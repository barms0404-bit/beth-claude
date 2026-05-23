"""Sector-conditional disclaimer addenda.

The base compliance disclaimer lives in the `disclaimers` table and is loaded
once per report. Sector-specific addenda are appended at compose time when the
relevant specialist seats have contributed material to the report.

Source of truth for which addenda apply: this module's `addendum_for(outputs)`.
Orchestrator integration point: `_synthesize` (or wherever `Report.disclaimer`
is set) — call `addendum_for(specialist_reports)` and concatenate to the base
disclaimer with a blank line separator.
"""

from __future__ import annotations

from typing import Iterable

from app.schemas import SpecialistReport

HEALTHCARE_ADDENDUM = (
    "Healthcare recommendations involve clinical and regulatory risk. Drug "
    "development is inherently uncertain. Specific drug, device, and biotech "
    "recommendations are subject to binary clinical and regulatory events. Past "
    "performance of any pharmaceutical program does not guarantee future results."
)

HEALTHCARE_SEAT_KEYS: frozenset[str] = frozenset(
    {"biotech_smid", "big_pharma", "healthcare_tools"}
)


def _seat_contributed(report: SpecialistReport) -> bool:
    """A seat 'contributed' if it produced any actionable surface — a takeaway,
    a name comment, an idea, a risk flag, or a chart request. Empty / no-news
    placeholders don't trigger the addendum."""
    if (report.key_takeaway or "").strip():
        return True
    if report.covered_names_commentary:
        return True
    if report.new_ideas:
        return True
    if report.risk_flags:
        return True
    if report.chart_request is not None:
        return True
    return False


def addendum_for(outputs: Iterable[SpecialistReport]) -> str:
    """Return the concatenated addenda string for the given specialist outputs.

    Empty string when no sector-conditional addendum applies. Multiple addenda
    are separated by a blank line so they render cleanly when appended to the
    base disclaimer.
    """
    parts: list[str] = []

    # Healthcare — any of the three specialized seats triggers the addendum.
    for report in outputs:
        if report.agent_key in HEALTHCARE_SEAT_KEYS and _seat_contributed(report):
            parts.append(HEALTHCARE_ADDENDUM)
            break  # one healthcare addendum, not three

    return "\n\n".join(parts)


def append_addenda(base_disclaimer: str, outputs: Iterable[SpecialistReport]) -> str:
    """Convenience: base disclaimer + any applicable addenda, blank-line separated."""
    extra = addendum_for(outputs)
    if not extra:
        return base_disclaimer
    return f"{base_disclaimer}\n\n{extra}"
