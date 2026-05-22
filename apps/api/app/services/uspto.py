"""USPTO PatentsView adapter — STUB.

The PSV verifier currently returns ``source_unavailable`` for patent claims.
Wire a real adapter here against https://search.patentsview.org/api/v1/patent/
when the verifier needs to handle IP claims.
"""

from __future__ import annotations


async def search_patents(query: str, assignee: str | None = None) -> list[dict]:
    """Real implementation lands when verifier needs USPTO. Returns [] for now."""
    return []
