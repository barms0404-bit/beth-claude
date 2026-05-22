"""The specialist roster. Mandates here mirror db/seed.sql `agents` rows.

BETH dispatches, per report slot:
  - the one report-window analyst whose `lead_slot` matches, plus
  - every sector / macro / quant / alt-data specialist (lead_slot is None).
"""

from __future__ import annotations

from app.agents.base import Specialist
from app.schemas import ReportSlot

SPECIALISTS: dict[str, Specialist] = {
    # --- Report-window analysts (one leads each daily report) --------------
    "morning_packet": Specialist(
        key="morning_packet",
        name="Morning Packet Analyst",
        lead_slot=ReportSlot.market_prep,
        mandate=(
            "Own the 7:30 AM market-prep narrative. Synthesize the overnight session "
            "(Asia/Europe), index futures, pre-market movers, and the prior evening's "
            "after-hours earnings into a crisp setup for the trading day. Flag the day's "
            "scheduled catalysts: economic prints, Fed speakers, notable earnings."
        ),
    ),
    "midday_tactical": Specialist(
        key="midday_tactical",
        name="Mid-Day Tactical Analyst",
        lead_slot=ReportSlot.mid_day,
        mandate=(
            "Own the 11:00 AM mid-day update. Attribute the morning's index moves to "
            "sectors and factors, read the flow color (breadth, leadership, rotation), "
            "and surface catalysts still ahead in the afternoon session."
        ),
    ),
    "market_close": Specialist(
        key="market_close",
        name="Market Close Analyst",
        lead_slot=ReportSlot.market_close,
        mandate=(
            "Own the 1:30 PM close report. Summarize the day's P&L drivers and breadth, "
            "preview after-hours earnings due tonight, and lay out the setup and key "
            "levels/catalysts for the next session."
        ),
    ),
    # --- Sector & thematic specialists (contribute to every report) -------
    "ai_datacenter": Specialist(
        key="ai_datacenter",
        name="AI Data Center Buildout Specialist",
        mandate=(
            "Cover the AI data-center buildout: hyperscaler capex trajectories, data-center "
            "REITs, liquid/air cooling, power distribution and electrical equipment, and "
            "site/interconnect constraints. Tie capex commentary to specific equities."
        ),
    ),
    "energy_infra": Specialist(
        key="energy_infra",
        name="Energy Infrastructure Specialist",
        mandate=(
            "Cover energy infrastructure powering AI and electrification: independent power "
            "producers, nuclear and small modular reactors (SMRs), gas turbines, and grid "
            "equipment. Track PPAs, interconnection queues, and power-price dynamics."
        ),
    ),
    "training_chip": Specialist(
        key="training_chip",
        name="Training Chip Specialist",
        mandate=(
            "Cover AI training silicon: the NVIDIA roadmap, HBM memory, CoWoS/advanced "
            "packaging capacity, and custom training ASICs from hyperscalers. Read supply "
            "constraints and pricing power into equity views."
        ),
    ),
    "inference_stack": Specialist(
        key="inference_stack",
        name="Inference & AI Software Stack Specialist",
        mandate=(
            "Cover AI inference and the software stack: inference silicon, serving frameworks "
            "(e.g. vLLM), and token economics. Translate falling cost-per-token and rising "
            "inference demand into who wins and who is pressured."
        ),
    ),
    "robotics": Specialist(
        key="robotics",
        name="Robotics & Physical AI Specialist",
        mandate=(
            "Cover robotics and physical AI: humanoid robots, industrial automation, and "
            "autonomous vehicles. Separate credible near-term revenue from narrative."
        ),
    ),
    "quantum": Specialist(
        key="quantum",
        name="Quantum Computing Specialist",
        mandate=(
            "Cover quantum computing (e.g. IONQ, RGTI) and the competing modalities "
            "(trapped-ion, superconducting, photonic, neutral-atom). Be explicit that this "
            "is a pre-revenue, high-volatility theme and size conviction accordingly."
        ),
    ),
    "tech_generalist": Specialist(
        key="tech_generalist",
        name="Technology / Software Generalist",
        mandate=(
            "Cover broad technology and software: SaaS, cloud platforms, and internet "
            "businesses not owned by another specialist. Focus on growth durability, "
            "margins, and valuation."
        ),
    ),
    "healthcare_biotech": Specialist(
        key="healthcare_biotech",
        name="Healthcare Biotech Specialist",
        mandate=(
            "Cover healthcare and biotech: clinical-trial readouts, FDA decisions, and "
            "catalyst calendars. Frame binary events with explicit risk; never overstate "
            "trial odds."
        ),
    ),
    "consumer_internet": Specialist(
        key="consumer_internet",
        name="Consumer / Internet Specialist",
        mandate=(
            "Cover consumer and internet: direct-to-consumer brands, e-commerce, and "
            "digital advertising. Read consumer-spend and ad-budget signals into equities."
        ),
    ),
    "macro_strategy": Specialist(
        key="macro_strategy",
        name="Macro Strategy Analyst",
        mandate=(
            "Own the macro overlay: interest rates, the Fed path, inflation, the dollar, "
            "and factor rotation (growth vs value, large vs small, cyclical vs defensive). "
            "Give the regime call that frames every other specialist's work."
        ),
    ),
    "quant": Specialist(
        key="quant",
        name="Quantitative Analyst",
        mandate=(
            "Provide the quantitative lens: factor exposures, systematic screens, momentum "
            "and trend signals, and breadth statistics. Flag names that screen well or poorly "
            "and cross-check the discretionary specialists' conviction."
        ),
    ),
    "alt_data": Specialist(
        key="alt_data",
        name="Alt Data Specialist",
        mandate=(
            "Provide alternative-data signal: web traffic, app downloads, and credit-card "
            "spend panels. Surface where alt-data diverges from consensus expectations and "
            "note the freshness and reliability of each signal."
        ),
    ),
}


def lead_for(slot: ReportSlot) -> Specialist:
    """The report-window analyst that leads the given slot."""
    for spec in SPECIALISTS.values():
        if spec.lead_slot == slot:
            return spec
    raise KeyError(f"No lead specialist registered for slot {slot}")


def contributors() -> list[Specialist]:
    """Every sector / macro / quant / alt-data specialist (non-window analysts)."""
    return [s for s in SPECIALISTS.values() if s.lead_slot is None]


def roster_for(slot: ReportSlot) -> list[Specialist]:
    """Full dispatch list for a report: the slot lead first, then contributors."""
    return [lead_for(slot), *contributors()]
