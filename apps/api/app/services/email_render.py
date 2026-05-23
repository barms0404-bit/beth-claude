"""Render a Beth report into HTML email body — table-layout, inline styles.

Email-client compatibility:
- Uses <table> layout (Outlook desktop ignores most modern CSS).
- All styling is inline. No <style> blocks.
- Charts are embedded as base64 `data:` URLs. Most modern clients render these
  inline; Outlook desktop may show a download prompt. Step-4 swap is to host
  PNGs in Supabase Storage and reference by URL.
"""

from __future__ import annotations

import base64
from datetime import datetime

from app.schemas import Report, ReportSlot, SpecialistReport, Top50Snapshot

# --- Brand tokens ---------------------------------------------------------
INK = "#000000"
GOLD = "#C9A961"
GOLD_DARK = "#A88B4A"
GOLD_MUTED = "#8A7548"
CREAM = "#F5E6C8"
CARD = "#0A0A0A"
CARD_BORDER = "#1F1A0F"
SUCCESS = "#4ADE80"
DANGER = "#EF4444"

# --- Subject lines (per Brian's spec) -------------------------------------
SUBJECTS: dict[ReportSlot, str] = {
    ReportSlot.market_prep: "AA Research | Morning Prep | {date}",
    ReportSlot.mid_day: "AA Research | Mid-Day Tactical | {date}",
    ReportSlot.market_close: "AA Research | Close & Tomorrow Setup | {date}",
}

SLOT_LABELS: dict[ReportSlot, str] = {
    ReportSlot.market_prep: "Morning Market Prep — 7:30 AM",
    ReportSlot.mid_day: "Mid-Day Tactical — 11:00 AM",
    ReportSlot.market_close: "Market Close — 1:30 PM",
}


def subject_for(report: Report) -> str:
    return SUBJECTS[report.slot].format(date=report.generated_at.strftime("%b %d, %Y"))


# --- Helpers --------------------------------------------------------------
def _esc(text: str) -> str:
    """Minimal HTML escape — we render content from LLM output."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _png_data_url(png: bytes) -> str:
    return f"data:image/png;base64,{base64.b64encode(png).decode('ascii')}"


def _fmt_pct(v: float | None) -> str:
    if v is None:
        return "—"
    sign = "+" if v > 0 else ""
    return f"{sign}{v:.2f}%"


def _tone(v: float | None) -> str:
    if v is None or v == 0:
        return GOLD_MUTED
    return GOLD if v > 0 else DANGER


# --- Sub-sections ---------------------------------------------------------
def _header(report: Report) -> str:
    label = SLOT_LABELS[report.slot]
    stamp = report.generated_at.strftime("%A, %B %d, %Y · %I:%M %p AZ")
    return f"""
<tr><td style="background:{INK};padding:32px 32px 20px 32px;border-bottom:1px solid {GOLD};">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:{GOLD};letter-spacing:0.02em;">
    Armstrong Arikat
  </div>
  <div style="font-family:Inter,Arial,sans-serif;font-size:10px;color:{GOLD_MUTED};letter-spacing:0.3em;text-transform:uppercase;margin-top:2px;">
    Private Wealth Group · Research Terminal
  </div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:{CREAM};margin-top:18px;">
    {_esc(label)}
  </div>
  <div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:{GOLD_MUTED};margin-top:4px;">
    {_esc(stamp)}
  </div>
</td></tr>"""


def _bullets_from(summary: str) -> list[str]:
    """Extract 1-3 leading bullets from Beth's summary, falling back to first paragraphs."""
    lines = [ln.strip(" -*•\t") for ln in summary.splitlines() if ln.strip()]
    if len(lines) >= 3:
        return lines[:3]
    # split paragraphs
    paras = [p.strip() for p in summary.split("\n\n") if p.strip()]
    return paras[:3] if paras else [summary]


def _executive_summary(report: Report) -> str:
    bullets = _bullets_from(report.summary)
    items = "".join(
        f"""<li style="margin:0 0 10px 0;color:{CREAM};line-height:1.55;">{_esc(b)}</li>"""
        for b in bullets
    )
    return _section(
        "Beth's Executive Summary",
        f"""<ul style="margin:0;padding-left:18px;font-family:Inter,Arial,sans-serif;font-size:14px;">{items}</ul>""",
    )


# --- Beth-orchestration-rule helpers --------------------------------------
def _find_specialist(report: Report, agent_key: str) -> SpecialistReport | None:
    for sr in report.specialist_reports:
        if sr.agent_key == agent_key:
            return sr
    return None


def _dividend_lookup(report: Report) -> dict[str, str]:
    """Per-ticker dividend snippet from Margaret Holloway's filing.

    Holloway's mandate puts yield + safety + payout INTO her narrative text;
    we surface that narrative as-is on Top 50 changes (Beth's overlay rule).
    """
    sr = _find_specialist(report, "dividend_aristocrat")
    if sr is None:
        return {}
    lookup: dict[str, str] = {}
    for cn in sr.covered_names_commentary:
        if cn.ticker:
            lookup[cn.ticker.upper()] = cn.narrative
    for idea in sr.new_ideas:
        if idea.ticker and idea.ticker.upper() not in lookup:
            lookup[idea.ticker.upper()] = (
                f"Conviction {idea.conviction_1_10}/10 · {idea.thesis}"
            )
    return lookup


def _lead_specialist_section(report: Report) -> str:
    """Macro-day rule: Fixed Income (or whichever key is set) leads the report."""
    if not report.lead_specialist_key:
        return ""
    sr = _find_specialist(report, report.lead_specialist_key)
    if sr is None:
        return ""
    badge_label = f"Lead — {report.macro_event}" if report.macro_event else "Lead Specialist"
    return _section(badge_label, _specialist_report_html(sr))


def _rates_setup_section(report: Report) -> str:
    """Morning rule: always surface Fixed Income's rates snapshot + equity read.

    Skipped when Fixed Income is already the macro-day lead (no duplication).
    Midday and close reports rely on the default Specialist Filings block.
    """
    if report.lead_specialist_key == "fixed_income":
        return ""
    if report.slot != ReportSlot.market_prep and not report.macro_event:
        return ""
    sr = _find_specialist(report, "fixed_income")
    if sr is None:
        return ""
    return _section("Rates & Cross-Asset Setup", _specialist_report_html(sr))


def _red_team_section(report: Report) -> str:
    """Adversarial critique per high-conviction Top 50 pick."""
    critiques = report.red_team_critiques
    if not critiques:
        return ""

    blocks: list[str] = []
    for c in critiques:
        bear_strong = c.bear_stronger_than_bull
        badge_class = "danger" if bear_strong else "gold-muted"
        badge_label = "BEAR > BULL" if bear_strong else f"conviction {c.conviction:.1f}/10"
        badge_color = DANGER if bear_strong else GOLD_MUTED

        bias_chips = " ".join(
            f"""<span style="display:inline-block;margin:1px 4px 1px 0;padding:2px 6px;background:{CARD_BORDER};color:{GOLD_MUTED};border-radius:3px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;">{_esc(b)}</span>"""
            for b in c.cognitive_biases[:6]
        ) or f"""<span style="color:{GOLD_MUTED};font-size:11px;">none flagged</span>"""

        err_chips = " ".join(
            f"""<span style="display:inline-block;margin:1px 4px 1px 0;padding:2px 6px;background:{CARD_BORDER};color:{GOLD_MUTED};border-radius:3px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;">{_esc(e)}</span>"""
            for e in c.logical_errors[:6]
        ) or f"""<span style="color:{GOLD_MUTED};font-size:11px;">none flagged</span>"""

        assumption_rows = "".join(
            f"""<tr>
              <td style="padding:3px 8px 3px 0;color:{CREAM};vertical-align:top;">{_esc(a.assumption)}</td>
              <td style="padding:3px 0;color:{DANGER if a.fragility >= 7 else (GOLD if a.fragility >= 4 else GOLD_MUTED)};vertical-align:top;white-space:nowrap;font-weight:600;">{a.fragility}/10</td>
            </tr>"""
            for a in c.assumptions[:6]
        ) or f"""<tr><td style="padding:3px 0;color:{GOLD_MUTED};font-size:11px;">none surfaced</td></tr>"""

        blocks.append(
            f"""
<div style="margin:16px 0;padding:14px;border:1px solid {DANGER if bear_strong else CARD_BORDER};border-radius:6px;">
  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-family:Inter,Arial,sans-serif;">
    <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:{GOLD};">{_esc(c.ticker)}</span>
    <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;color:{badge_color};">{_esc(badge_label)}</span>
  </div>
  <div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:{GOLD_MUTED};margin-bottom:10px;">Lead: {_esc(c.lead_specialist)}</div>

  <div style="margin-bottom:10px;font-family:Inter,Arial,sans-serif;font-size:13px;color:{CREAM};line-height:1.55;">
    <span style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD_MUTED};">Steelman bear</span><br/>
    {_esc(c.steelman_bear)}
  </div>

  <div style="margin-bottom:10px;font-family:Inter,Arial,sans-serif;font-size:13px;color:{CREAM};line-height:1.55;">
    <span style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD_MUTED};">Consensus is pricing</span><br/>
    {_esc(c.consensus_pricing)}
  </div>

  <div style="margin-bottom:10px;">
    <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD_MUTED};margin-bottom:4px;">Cognitive biases</div>
    {bias_chips}
  </div>
  <div style="margin-bottom:10px;">
    <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD_MUTED};margin-bottom:4px;">Logical errors</div>
    {err_chips}
  </div>

  <div style="margin-bottom:10px;">
    <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD_MUTED};margin-bottom:4px;">Assumptions (fragility)</div>
    <table style="width:100%;font-family:Inter,Arial,sans-serif;font-size:12px;border-collapse:collapse;">{assumption_rows}</table>
  </div>

  <div style="margin-bottom:10px;font-family:Inter,Arial,sans-serif;font-size:13px;color:{CREAM};line-height:1.55;">
    <span style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD_MUTED};">Position sizing · drawdown · symmetry</span><br/>
    {_esc(c.position_sizing_view)}{" · " if c.position_sizing_view and c.max_drawdown_estimate else ""}{_esc(c.max_drawdown_estimate)}
    {f' · <span style="color:{GOLD if c.risk_reward_symmetry == "asymmetric" else DANGER};text-transform:uppercase;font-size:11px;">{_esc(c.risk_reward_symmetry)}</span>' if c.risk_reward_symmetry else ""}
  </div>

  <div style="margin-bottom:8px;font-family:Inter,Arial,sans-serif;font-size:13px;color:{CREAM};line-height:1.55;">
    <span style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{DANGER};">Kill shot</span><br/>
    {_esc(c.kill_shot)}
  </div>

  <div style="margin-top:8px;padding-top:8px;border-top:1px solid {CARD_BORDER};font-family:Inter,Arial,sans-serif;font-size:13px;color:{GOLD};font-weight:600;">
    {_esc(c.overall_verdict)}
  </div>
</div>"""
        )

    return _section("Red Team Review", "".join(blocks))


def _conflicts_section(report: Report) -> str:
    """Per-ticker specialist disagreements — surface, never hide."""
    conflicts = report.conflicts
    if not conflicts:
        return ""

    blocks: list[str] = []
    for c in conflicts:
        verdict = c.verdict.value if hasattr(c.verdict, "value") else str(c.verdict)
        crux_type = c.crux_type.value if hasattr(c.crux_type, "value") else str(c.crux_type)
        verdict_color = DANGER if verdict in {"lean_bear", "no_position"} else GOLD

        type_chips = " ".join(
            f"""<span style="display:inline-block;margin:1px 4px 1px 0;padding:2px 6px;background:{CARD_BORDER};color:{GOLD_MUTED};border-radius:3px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;">{_esc(t.value if hasattr(t, 'value') else str(t))}</span>"""
            for t in c.conflict_types
        )

        views_rows = "".join(
            f"""<tr>
              <td style="padding:3px 8px 3px 0;color:{GOLD};font-weight:600;vertical-align:top;white-space:nowrap;">{_esc(v.specialist)}</td>
              <td style="padding:3px 8px 3px 0;color:{GOLD if v.stance == 'bullish' else (DANGER if v.stance == 'bearish' else GOLD_MUTED)};text-transform:uppercase;font-size:11px;vertical-align:top;white-space:nowrap;">{_esc(v.stance)}{f' · {v.conviction}/10' if v.conviction else ''}{f' · ${v.base_case_price:.0f}' if v.base_case_price else ''}</td>
              <td style="padding:3px 0;color:{CREAM};vertical-align:top;line-height:1.5;">{_esc((v.thesis or '')[:200])}</td>
            </tr>"""
            for v in c.views
        )

        blocks.append(
            f"""
<div style="margin:14px 0;padding:14px;border:1px solid {CARD_BORDER};border-radius:6px;">
  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-family:Inter,Arial,sans-serif;margin-bottom:6px;">
    <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:{GOLD};">{_esc(c.ticker)}</span>
    <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;color:{verdict_color};">{_esc(verdict.replace('_', ' '))}</span>
  </div>
  <div style="margin-bottom:8px;">{type_chips}</div>

  <div style="margin-bottom:10px;font-family:Inter,Arial,sans-serif;font-size:13px;color:{CREAM};line-height:1.55;">
    <span style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD_MUTED};">Crux ({_esc(crux_type.replace('_', ' '))})</span><br/>
    {_esc(c.crux)}
  </div>

  <div style="margin-bottom:8px;">
    <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD_MUTED};margin-bottom:4px;">Specialist views</div>
    <table style="width:100%;font-family:Inter,Arial,sans-serif;font-size:12px;border-collapse:collapse;">{views_rows}</table>
  </div>

  <div style="margin-top:8px;padding-top:8px;border-top:1px solid {CARD_BORDER};font-family:Inter,Arial,sans-serif;font-size:13px;color:{GOLD};font-weight:600;">
    {_esc(c.recommended_action)}
  </div>
</div>"""
        )

    return _section("Disagreements", "".join(blocks))


def _bear_case_section(report: Report) -> str:
    """Contrarian-check rule: dedicated Value Investor bear case when triggered."""
    bca = report.bear_case_addendum
    if bca is None:
        return ""
    badge = (
        f"""<div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;"""
        f"""color:{GOLD_MUTED};margin-bottom:8px;">Contrarian Check — Value Investor</div>"""
    )
    return _section("Bear Case Addendum", badge + _specialist_report_html(bca))


def _top50_changes(
    snapshot: Top50Snapshot | None,
    dividend_lookup: dict[str, str] | None = None,
) -> str:
    if snapshot is None or not snapshot.entries:
        body = f"""<div style="color:{GOLD_MUTED};font-family:Inter,Arial,sans-serif;font-size:13px;">No prior snapshot available yet.</div>"""
        return _section("Top 50 — Changes", body)

    new_entries = [e for e in snapshot.entries if e.previous_rank is None]
    movers = [e for e in snapshot.entries if e.previous_rank is not None and e.previous_rank != e.rank]
    movers.sort(key=lambda e: abs((e.previous_rank or e.rank) - e.rank), reverse=True)

    parts: list[str] = []
    if new_entries:
        names = ", ".join(_esc(e.ticker) for e in new_entries[:10])
        parts.append(
            f"""<div style="margin-bottom:10px;font-family:Inter,Arial,sans-serif;font-size:13px;color:{CREAM};">
              <span style="color:{GOLD_MUTED};text-transform:uppercase;letter-spacing:0.15em;font-size:10px;">New entries:</span> {names}
            </div>"""
        )
    if movers:
        rows = []
        for e in movers[:8]:
            delta = (e.previous_rank or e.rank) - e.rank
            arrow = "▲" if delta > 0 else "▼"
            color = GOLD if delta > 0 else GOLD_MUTED
            rows.append(
                f"""<tr>
                  <td style="padding:4px 8px 4px 0;color:{GOLD};font-weight:600;">{_esc(e.ticker)}</td>
                  <td style="padding:4px 8px;color:{color};">{arrow} {abs(delta)}</td>
                  <td style="padding:4px 0;color:{GOLD_MUTED};">#{e.previous_rank} → #{e.rank}</td>
                </tr>"""
            )
        parts.append(
            f"""<table style="width:100%;font-family:Inter,Arial,sans-serif;font-size:13px;border-collapse:collapse;">{''.join(rows)}</table>"""
        )
    # Dividend overlay — Holloway's coverage cross-referenced with the Top 50.
    if dividend_lookup:
        relevant: list[tuple[str, str]] = []
        for entry in snapshot.entries:
            key = entry.ticker.upper()
            if key in dividend_lookup:
                relevant.append((entry.ticker, dividend_lookup[key]))
        if relevant:
            rows = "".join(
                f"""<tr>
                  <td style="padding:4px 10px 4px 0;color:{GOLD};font-weight:600;width:64px;vertical-align:top;">{_esc(t)}</td>
                  <td style="padding:4px 0;color:{CREAM};line-height:1.5;">{_esc(n)}</td>
                </tr>"""
                for t, n in relevant[:12]
            )
            parts.append(
                f"""<div style="margin-top:14px;">
                  <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:{GOLD_MUTED};margin-bottom:6px;">Holloway — Income Coverage</div>
                  <table style="width:100%;font-family:Inter,Arial,sans-serif;font-size:12px;border-collapse:collapse;">{rows}</table>
                </div>"""
            )

    if not parts:
        parts.append(
            f"""<div style="color:{GOLD_MUTED};font-family:Inter,Arial,sans-serif;font-size:13px;">No rank changes since the last snapshot.</div>"""
        )
    return _section("Top 50 — Changes", "".join(parts))


def _specialist_report_html(sr: SpecialistReport) -> str:
    covered_rows = "".join(
        f"""<tr>
          <td style="padding:4px 10px 4px 0;color:{GOLD};font-weight:600;">{_esc(cn.ticker)}</td>
          <td style="padding:4px 10px 4px 0;color:{_tone(cn.move_pct)};">{_fmt_pct(cn.move_pct)}</td>
          <td style="padding:4px 10px 4px 0;color:{GOLD_MUTED};text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">{_esc(cn.action)}</td>
          <td style="padding:4px 0;color:{CREAM};">{_esc(cn.narrative)}</td>
        </tr>"""
        for cn in sr.covered_names_commentary[:8]
    )
    new_ideas = "".join(
        f"""<div style="margin:8px 0;padding:10px;border-left:2px solid {GOLD};background:{CARD};">
          <div style="font-family:Inter,Arial,sans-serif;font-size:13px;">
            <span style="color:{GOLD};font-weight:600;">{_esc(idea.ticker)}</span>
            <span style="color:{GOLD_MUTED};margin-left:8px;font-size:11px;">conviction {idea.conviction_1_10}/10 · {_esc(idea.time_horizon)}</span>
          </div>
          <div style="color:{CREAM};font-family:Inter,Arial,sans-serif;font-size:13px;margin-top:4px;line-height:1.55;">{_esc(idea.thesis)}</div>
          <div style="color:{GOLD_MUTED};font-family:Inter,Arial,sans-serif;font-size:11px;margin-top:4px;">Key risk: {_esc(idea.key_risk)}</div>
        </div>"""
        for idea in sr.new_ideas[:5]
    )
    flags = ""
    if sr.risk_flags:
        flags = (
            f"""<div style="margin-top:8px;font-family:Inter,Arial,sans-serif;font-size:12px;color:{DANGER};">"""
            + "Risk flags: "
            + ", ".join(_esc(f) for f in sr.risk_flags)
            + "</div>"
        )

    return f"""
<div style="margin:16px 0;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:{GOLD};">{_esc(sr.specialist)}</div>
  <div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:{GOLD_MUTED};text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">{_esc(sr.agent_key)}</div>
  <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:{CREAM};line-height:1.55;margin-bottom:10px;">{_esc(sr.key_takeaway)}</div>
  {f'<table style="width:100%;font-family:Inter,Arial,sans-serif;font-size:13px;border-collapse:collapse;margin-bottom:10px;">{covered_rows}</table>' if covered_rows else ''}
  {new_ideas}
  {flags}
</div>"""


def _charts_html(charts, png_data: dict[int, bytes]) -> str:
    if not charts:
        return ""
    blocks: list[str] = []
    for i, ch in enumerate(charts):
        png = png_data.get(i)
        image = (
            f"""<img src="{_png_data_url(png)}" width="600" alt="{_esc(ch.title)}" style="display:block;max-width:100%;height:auto;border:1px solid {CARD_BORDER};border-radius:6px;" />"""
            if png
            else f"""<div style="padding:16px;background:{CARD};border:1px dashed {CARD_BORDER};color:{GOLD_MUTED};font-family:Inter,Arial,sans-serif;font-size:12px;">Chart render unavailable.</div>"""
        )
        exp = ch.explanation
        explanation_html = f"""
<div style="margin-top:12px;font-family:Inter,Arial,sans-serif;font-size:13px;color:{CREAM};line-height:1.6;">
  <div style="margin-bottom:8px;">
    <span style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD_MUTED};">Why this chart</span><br/>
    {_esc(exp.why_this_chart)}
  </div>
  <div style="margin-bottom:8px;">
    <span style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD_MUTED};">How to read it</span><br/>
    {_esc(exp.how_to_read)}
  </div>
  <div>
    <span style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:{GOLD};">Key takeaway</span><br/>
    {_esc(exp.key_takeaway)}
  </div>
</div>"""
        blocks.append(
            f"""
<div style="margin:18px 0;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:{GOLD};margin-bottom:6px;">{_esc(ch.title)}</div>
  <div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:{GOLD_MUTED};margin-bottom:10px;">Promoted by {_esc(ch.requested_by)}</div>
  {image}
  {explanation_html}
</div>"""
        )
    return _section("Charts", "".join(blocks))


def _tomorrows_calendar(report: Report) -> str:
    if report.slot != ReportSlot.market_prep:
        return ""
    morning = next(
        (sr for sr in report.specialist_reports if sr.agent_key == "morning_packet"),
        None,
    )
    if morning is None:
        return ""
    return _section(
        "Today's Catalysts",
        f"""<div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:{CREAM};line-height:1.6;">
          {_esc(morning.key_takeaway)}
        </div>""",
    )


def _section(title: str, body_html: str) -> str:
    return f"""
<tr><td style="padding:24px 32px;border-bottom:1px solid {CARD_BORDER};">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:{GOLD};margin-bottom:12px;">{_esc(title)}</div>
  {body_html}
</td></tr>"""


# --- Healthcare three-seat composer --------------------------------------
# Mirrors docs/DISPATCH_PROTOCOLS.md — Biotech / Big Pharma / Tools subsections
# + GLP-1 megacycle synthesis + today's healthcare catalysts.
HEALTHCARE_SEAT_KEYS = ("biotech_smid", "big_pharma", "healthcare_tools")
HEALTHCARE_LABELS = {
    "biotech_smid":     "Biotech (small/mid cap)",
    "big_pharma":       "Big Pharma & Specialty",
    "healthcare_tools": "Tools & Life Sciences",
}


def _healthcare_subsection(label: str, sr: SpecialistReport | None) -> str:
    """One subsection inside the consolidated Healthcare block."""
    if sr is None:
        return f"""
<div style="margin:6px 0 14px 0;">
  <div style="font-family:Inter,Arial,sans-serif;font-size:13px;color:{GOLD};font-weight:600;margin-bottom:4px;">{_esc(label)}</div>
  <div style="font-family:Inter,Arial,sans-serif;font-size:12px;color:{GOLD_MUTED};font-style:italic;">No filing today.</div>
</div>"""

    takeaway = (sr.key_takeaway or "").strip() or "No takeaway filed."
    flags_html = ""
    if sr.risk_flags:
        chips = " ".join(
            f"""<span style="display:inline-block;margin:1px 4px 1px 0;padding:2px 6px;background:{CARD_BORDER};color:{DANGER};border-radius:3px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;">{_esc(rf[:60])}</span>"""
            for rf in sr.risk_flags[:5]
        )
        flags_html = f"""<div style="margin-top:6px;">{chips}</div>"""

    return f"""
<div style="margin:6px 0 14px 0;">
  <div style="font-family:Inter,Arial,sans-serif;font-size:13px;color:{GOLD};font-weight:600;margin-bottom:4px;">{_esc(label)} · <span style="color:{GOLD_MUTED};font-weight:400;">{_esc(sr.specialist)}</span></div>
  <div style="font-family:Inter,Arial,sans-serif;font-size:13px;color:{CREAM};line-height:1.55;">{_esc(takeaway)}</div>
  {flags_html}
</div>"""


def _glp1_synthesis(
    pharma_sr: SpecialistReport | None,
    tools_sr: SpecialistReport | None,
) -> str:
    """Cross-specialist GLP-1 block. Pulls any covered-name commentary on LLY/NVO
    plus risk-flag entries that mention GLP-1 / capacity / Ozempic / Mounjaro /
    Wegovy / Zepbound / tirzepatide / semaglutide."""
    glp1_terms = (
        "glp-1", "glp1", "ozempic", "wegovy", "mounjaro", "zepbound",
        "tirzepatide", "semaglutide", "retatrutide", "orforglipron",
    )

    def _hits(sr: SpecialistReport | None) -> list[str]:
        if sr is None:
            return []
        lines: list[str] = []
        # LLY / NVO direct mentions
        for cn in sr.covered_names_commentary:
            if cn.ticker and cn.ticker.upper() in {"LLY", "NVO"}:
                lines.append(f"<b>{_esc(cn.ticker)}</b> · {_esc(cn.narrative)}")
        # Any covered name commentary mentioning a GLP-1 term
        for cn in sr.covered_names_commentary:
            if cn.ticker and cn.ticker.upper() in {"LLY", "NVO"}:
                continue
            blob = (cn.narrative or "").lower()
            if any(t in blob for t in glp1_terms):
                lines.append(f"<b>{_esc(cn.ticker)}</b> · {_esc(cn.narrative)}")
        # Risk flags mentioning GLP-1 — they're often the cleanest signal
        for rf in sr.risk_flags:
            blob = rf.lower()
            if any(t in blob for t in glp1_terms):
                lines.append(f"<span style='color:{DANGER};'>RISK</span> · {_esc(rf)}")
        return lines

    bullets = _hits(pharma_sr) + _hits(tools_sr)
    if not bullets:
        return ""

    items = "".join(
        f"""<li style="margin:0 0 8px 0;color:{CREAM};line-height:1.55;font-family:Inter,Arial,sans-serif;font-size:13px;">{b}</li>"""
        for b in bullets[:8]
    )
    return f"""
<div style="margin:8px 0 4px 0;padding-top:12px;border-top:1px solid {CARD_BORDER};">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:{GOLD};margin-bottom:8px;">GLP-1 megacycle update</div>
  <ul style="margin:0;padding-left:18px;">{items}</ul>
</div>"""


def _healthcare_catalysts_block(report: Report) -> str:
    """Today's healthcare catalysts — pulled from the three healthcare seats' risk
    flags. Pattern-match for clinical-readout / PDUFA / AdComm / conference language."""
    catalyst_terms = (
        "pdufa", "adcomm", "advisory committee", "phase 1", "phase 2", "phase 3",
        "readout", "data drop", "asco", "esmo", "ash", "aacr", "jpm",
        "ada", "aha", "interim",
    )
    hits: list[str] = []
    for key in HEALTHCARE_SEAT_KEYS:
        sr = _find_specialist(report, key)
        if sr is None:
            continue
        for rf in sr.risk_flags:
            blob = rf.lower()
            if any(t in blob for t in catalyst_terms):
                hits.append(f"<b>{_esc(HEALTHCARE_LABELS[key])}</b> · {_esc(rf)}")
    if not hits:
        return ""
    items = "".join(
        f"""<li style="margin:0 0 6px 0;color:{CREAM};line-height:1.5;font-family:Inter,Arial,sans-serif;font-size:12px;">{b}</li>"""
        for b in hits[:8]
    )
    return f"""
<div style="margin:8px 0 4px 0;padding-top:12px;border-top:1px solid {CARD_BORDER};">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:{GOLD};margin-bottom:8px;">Today&#39;s healthcare catalysts</div>
  <ul style="margin:0;padding-left:18px;">{items}</ul>
</div>"""


def _healthcare_section(report: Report) -> str:
    """Consolidated healthcare block — bails when no healthcare seat contributed."""
    seats = {k: _find_specialist(report, k) for k in HEALTHCARE_SEAT_KEYS}
    if not any(_seat_has_content(sr) for sr in seats.values()):
        return ""

    subsections = "".join(
        _healthcare_subsection(HEALTHCARE_LABELS[k], seats[k])
        for k in HEALTHCARE_SEAT_KEYS
    )
    glp1 = _glp1_synthesis(seats["big_pharma"], seats["healthcare_tools"])
    catalysts = _healthcare_catalysts_block(report)
    return _section("Healthcare", subsections + glp1 + catalysts)


def _seat_has_content(sr: SpecialistReport | None) -> bool:
    if sr is None:
        return False
    if (sr.key_takeaway or "").strip():
        return True
    if sr.covered_names_commentary or sr.new_ideas or sr.risk_flags:
        return True
    return False


def _footer(report: Report) -> str:
    return f"""
<tr><td style="padding:20px 32px;background:{INK};">
  <div style="font-family:Inter,Arial,sans-serif;font-size:10px;color:{GOLD_MUTED};line-height:1.6;">
    {_esc(report.disclaimer)}
    <br/>Generated {report.generated_at.strftime('%Y-%m-%d %H:%M UTC')}.
  </div>
</td></tr>"""


# --- Top-level entry ------------------------------------------------------
def render_report_email(
    *,
    report: Report,
    snapshot: Top50Snapshot | None,
    png_data: dict[int, bytes],
) -> str:
    """Build the complete HTML email body, honoring Beth's orchestration rules.

    Section order:
      header
      lead specialist (macro days: Fixed Income above the exec summary)
      executive summary
      bear case addendum (when triggered by the contrarian rule)
      top 50 changes (with Holloway income overlay)
      healthcare (three sub-sections + GLP-1 + healthcare catalysts; when any
        of biotech_smid / big_pharma / healthcare_tools contributed)
      rates & cross-asset setup (morning reports — Fixed Income dedicated)
      slot lead specialist
      other specialist filings (already-rendered specialists excluded)
      charts
      today's catalysts (morning only)
      footer
    """
    dividend_lookup = _dividend_lookup(report)
    parts: list[str] = [_header(report)]

    lead_html = _lead_specialist_section(report)
    if lead_html:
        parts.append(lead_html)

    parts.append(_executive_summary(report))

    bear_html = _bear_case_section(report)
    if bear_html:
        parts.append(bear_html)

    conflicts_html = _conflicts_section(report)
    if conflicts_html:
        parts.append(conflicts_html)

    red_team_html = _red_team_section(report)
    if red_team_html:
        parts.append(red_team_html)

    parts.append(_top50_changes(snapshot, dividend_lookup))

    # Consolidated Healthcare block — three sub-sections + GLP-1 + catalysts.
    healthcare_html = _healthcare_section(report)
    if healthcare_html:
        parts.append(healthcare_html)

    rates_html = _rates_setup_section(report)
    if rates_html:
        parts.append(rates_html)

    # Don't render the same specialist twice — track what we already shipped.
    rendered_keys: set[str] = set()
    if report.lead_specialist_key:
        rendered_keys.add(report.lead_specialist_key)
    if rates_html:
        rendered_keys.add("fixed_income")
    if healthcare_html:
        rendered_keys.update(HEALTHCARE_SEAT_KEYS)

    slot_lead_keys = {"morning_packet", "midday_tactical", "market_close"}
    leads = [
        sr for sr in report.specialist_reports
        if sr.agent_key in slot_lead_keys and sr.agent_key not in rendered_keys
    ]
    others = [
        sr for sr in report.specialist_reports
        if sr.agent_key not in slot_lead_keys and sr.agent_key not in rendered_keys
    ]
    if leads:
        parts.append(_section("Slot Lead", "".join(_specialist_report_html(sr) for sr in leads)))
    if others:
        parts.append(_section("Specialist Filings", "".join(_specialist_report_html(sr) for sr in others)))

    parts.append(_charts_html(report.charts, png_data))
    parts.append(_tomorrows_calendar(report))
    parts.append(_footer(report))

    return f"""<!doctype html>
<html><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{_esc(subject_for(report))}</title>
</head>
<body style="margin:0;padding:0;background:{INK};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:{INK};">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:{INK};">
        {''.join(parts)}
      </table>
    </td></tr>
  </table>
</body></html>"""
