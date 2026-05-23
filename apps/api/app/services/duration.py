"""Sector -> equity duration-sensitivity mapping.

Duration sensitivity for an EQUITY isn't a precise rates duration — it's a
shorthand for how rate-sensitive the multiple is:

  high    long-duration cash flows / asset-replacement multiples
          (software, biotech, REITs, utilities, semiconductors)
  medium  cyclical earnings, moderate rate dependence
          (banks, industrials, autos, consumer discretionary)
  low     short cash cycles, defensive, less rate-sensitive
          (energy/materials/staples, tobacco, food, telcos)

Matching is case-insensitive substring on Polygon's `sic_description`. First
keyword match wins; unmatched sectors return None.
"""

from __future__ import annotations

_KEYWORDS: tuple[tuple[str, str], ...] = (
    # high — long-duration multiples, rate-sensitive
    ("software", "high"),
    ("semiconductor", "high"),
    ("computer", "high"),
    ("data process", "high"),
    ("biotechnology", "high"),
    ("pharmaceutical preparation", "high"),
    ("biological products", "high"),
    ("medical equipment", "high"),
    ("real estate", "high"),
    ("reit", "high"),
    ("utilities", "high"),
    ("electric service", "high"),
    ("renewable", "high"),
    # medium — cyclical, moderate rate dependence
    ("national commercial bank", "medium"),
    ("state commercial bank", "medium"),
    ("savings institution", "medium"),
    ("security broker", "medium"),
    ("insurance", "medium"),
    ("investment", "medium"),
    ("industrial machinery", "medium"),
    ("electrical industrial", "medium"),
    ("motor vehicles", "medium"),
    ("auto", "medium"),
    ("construction", "medium"),
    ("retail", "medium"),
    ("services-prepackaged software", "high"),
    ("internet", "medium"),
    ("transportation", "medium"),
    ("airline", "medium"),
    # low — short cash cycles, defensive
    ("petroleum", "low"),
    ("crude petroleum", "low"),
    ("natural gas", "low"),
    ("oil and gas", "low"),
    ("mining", "low"),
    ("metal mining", "low"),
    ("food", "low"),
    ("beverages", "low"),
    ("beverage", "low"),
    ("tobacco", "low"),
    ("household products", "low"),
    ("cosmetics", "low"),
    ("personal care", "low"),
    ("telephone communications", "low"),
    ("communications services", "low"),
)


def duration_for(sic_description: str | None) -> str | None:
    """Return 'high' | 'medium' | 'low' | None for a Polygon sic_description."""
    if not sic_description:
        return None
    haystack = sic_description.lower()
    for keyword, label in _KEYWORDS:
        if keyword in haystack:
            return label
    return None
