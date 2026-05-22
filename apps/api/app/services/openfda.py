"""openFDA adapter — STUB.

The PSV verifier currently returns ``source_unavailable`` for regulatory claims.
Wire a real adapter here against https://api.fda.gov/ for drug approvals,
recalls, and adverse events when the verifier needs to handle FDA claims.
"""

from __future__ import annotations


async def search_drug_approvals(query: str) -> list[dict]:
    """Real implementation lands when verifier needs FDA. Returns [] for now."""
    return []
