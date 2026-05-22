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


def _top50_changes(snapshot: Top50Snapshot | None) -> str:
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
        blocks.append(
            f"""
<div style="margin:18px 0;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:{GOLD};margin-bottom:6px;">{_esc(ch.title)}</div>
  <div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:{GOLD_MUTED};margin-bottom:10px;">Promoted by {_esc(ch.requested_by)}</div>
  {image}
  <div style="font-family:Inter,Arial,sans-serif;font-size:13px;color:{CREAM};line-height:1.6;margin-top:10px;">{_esc(ch.chart_explanation)}</div>
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
    """Build the complete HTML email body."""
    parts = [
        _header(report),
        _executive_summary(report),
        _top50_changes(snapshot),
    ]
    # Slot-lead specialist gets a dedicated block; the rest stack underneath.
    lead_keys = {"morning_packet", "midday_tactical", "market_close"}
    leads = [sr for sr in report.specialist_reports if sr.agent_key in lead_keys]
    others = [sr for sr in report.specialist_reports if sr.agent_key not in lead_keys]
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
