"""The specialist roster — 15 named analysts. Mirrors db/seed.sql `agents` rows.

Each specialist has a stable `key` (machine ID), a `persona` (human byline name),
a functional `name` (title), a `coverage` universe, and a `mandate`.

Beth dispatches, per report slot:
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
        persona="Eleanor Hayes",
        lead_slot=ReportSlot.market_prep,
        coverage=(
            "Index level and the full covered universe. Overnight: Asia (Nikkei, "
            "Hang Seng, Kospi), Europe (Stoxx 600, DAX, FTSE), US index futures "
            "(ES, NQ), DXY, crude, gold, the 10Y. Pre-market movers and prior-evening "
            "after-hours earnings across all covered names."
        ),
        mandate=(
            "Own the 7:30 AM market-prep narrative. Synthesize the overnight session, "
            "index futures, pre-market movers, and the prior evening's after-hours "
            "earnings into a crisp setup for the trading day. Flag the day's scheduled "
            "catalysts: economic prints, Fed speakers, notable earnings."
        ),
    ),
    "midday_tactical": Specialist(
        key="midday_tactical",
        name="Mid-Day Tactical Analyst",
        persona="Marcus Webb",
        lead_slot=ReportSlot.mid_day,
        coverage=(
            "Index and sector ETFs (XLK, XLE, XLF, XLV, SMH), market breadth, factor "
            "proxies (IWF/IWD growth-value, IWM/SPY size), and the covered universe "
            "intraday."
        ),
        mandate=(
            "Own the 11:00 AM mid-day update. Attribute the morning's index moves to "
            "sectors and factors, read the flow color (breadth, leadership, rotation), "
            "and surface catalysts still ahead in the afternoon session."
        ),
    ),
    "market_close": Specialist(
        key="market_close",
        name="Market Close Analyst",
        persona="Diane Okafor",
        lead_slot=ReportSlot.market_close,
        coverage=(
            "Index and full covered universe at EOD. The after-hours earnings tape, "
            "next-day catalysts, and key technical levels on SPX and NDX."
        ),
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
        persona="Raj Patel",
        coverage=(
            "VRT, ETN, NVT, PWR, GEV, DLR, EQIX, IRM, SMCI, DELL, ANET, CRDO. Themes: "
            "hyperscaler capex (MSFT, AMZN, GOOGL, META), liquid and air cooling, power "
            "distribution, interconnect and site constraints."
        ),
        mandate=(
            "Cover the AI data-center buildout: hyperscaler capex trajectories, data-center "
            "REITs, cooling, power distribution and electrical equipment. Tie capex "
            "commentary to specific equities."
        ),
    ),
    "energy_infra": Specialist(
        key="energy_infra",
        name="Energy Infrastructure Specialist",
        persona="Tom Calloway",
        coverage=(
            "CEG, VST, NRG, TLN, OKLO, SMR, NNE, GEV, ETN, CCJ, LEU. Themes: independent "
            "power producer pricing, nuclear and small modular reactors, gas turbines, "
            "grid interconnection queues, power-purchase agreements."
        ),
        mandate=(
            "Cover energy infrastructure powering AI and electrification: IPPs, nuclear and "
            "SMRs, gas turbines, and grid equipment. Track PPAs, interconnection queues, "
            "and power-price dynamics."
        ),
    ),
    "training_chip": Specialist(
        key="training_chip",
        name="Training Chip Specialist",
        persona="Wei Zhang",
        coverage=(
            "NVDA, TSM, AVGO, MU, AMD, ASML, AMAT, LRCX, KLAC. Themes: the GPU roadmap "
            "(Blackwell, Rubin), HBM3E/HBM4 memory, CoWoS and advanced packaging capacity, "
            "custom training ASICs (TPU, Trainium, MTIA)."
        ),
        mandate=(
            "Cover AI training silicon: the NVIDIA roadmap, HBM memory, CoWoS/advanced "
            "packaging capacity, and custom training ASICs. Read supply constraints and "
            "pricing power into equity views."
        ),
    ),
    "inference_stack": Specialist(
        key="inference_stack",
        name="Inference & AI Software Stack Specialist",
        persona="Priya Krishnan",
        coverage=(
            "NVDA, AMD, AVGO, MRVL, ARM, plus inference-software adjacents. Themes: "
            "inference silicon, serving frameworks (vLLM, TensorRT-LLM), cost-per-token "
            "economics, edge inference."
        ),
        mandate=(
            "Cover AI inference and the software stack: inference silicon, serving "
            "frameworks, and token economics. Translate falling cost-per-token and rising "
            "inference demand into who wins and who is pressured."
        ),
    ),
    "robotics": Specialist(
        key="robotics",
        name="Robotics & Physical AI Specialist",
        persona="Hannah Mueller",
        coverage=(
            "TSLA, ISRG, ABB, ROK, SYM, PATH, SERV, AUR. Themes: humanoid robotics, "
            "industrial automation, autonomous vehicles and trucking."
        ),
        mandate=(
            "Cover robotics and physical AI: humanoid robots, industrial automation, and "
            "autonomous vehicles. Separate credible near-term revenue from narrative."
        ),
    ),
    "quantum": Specialist(
        key="quantum",
        name="Quantum Computing Specialist",
        persona="Daniel Brandt",
        coverage=(
            "IONQ, RGTI, QBTS, QUBT, plus IBM and GOOGL quantum efforts. Themes: "
            "trapped-ion, superconducting, neutral-atom, and photonic modalities. A "
            "pre-revenue, high-volatility theme."
        ),
        mandate=(
            "Cover quantum computing and the competing modalities. Be explicit that this "
            "is a pre-revenue, high-volatility theme and size conviction accordingly."
        ),
    ),
    "tech_generalist": Specialist(
        key="tech_generalist",
        name="Technology / Software Generalist",
        persona="Sofia Reyes",
        coverage=(
            "MSFT, GOOGL, ORCL, CRM, NOW, SNOW, DDOG, NET, PLTR, ADBE. Themes: SaaS "
            "growth durability, cloud platforms, AI software monetization."
        ),
        mandate=(
            "Cover broad technology and software not owned by another specialist: SaaS, "
            "cloud platforms, internet businesses. Focus on growth durability, margins, "
            "and valuation."
        ),
    ),
    "healthcare_biotech": Specialist(
        key="healthcare_biotech",
        name="Healthcare Biotech Specialist",
        persona="James Whitfield",
        coverage=(
            "LLY, NVO, VRTX, REGN, ISRG, plus clinical-stage names with near catalysts. "
            "Themes: GLP-1, oncology, the FDA decision calendar, trial readouts."
        ),
        mandate=(
            "Cover healthcare and biotech: clinical-trial readouts, FDA decisions, and "
            "catalyst calendars. Frame binary events with explicit risk; never overstate "
            "trial odds."
        ),
    ),
    "consumer_internet": Specialist(
        key="consumer_internet",
        name="Consumer / Internet Specialist",
        persona="Olivia Chen",
        coverage=(
            "AMZN, META, NFLX, SHOP, ABNB, UBER, DASH, NKE. Themes: consumer spend, "
            "e-commerce, digital advertising budgets, direct-to-consumer brands."
        ),
        mandate=(
            "Cover consumer and internet: DTC brands, e-commerce, and digital advertising. "
            "Read consumer-spend and ad-budget signals into equities."
        ),
    ),
    "macro_strategy": Specialist(
        key="macro_strategy",
        name="Macro Strategy Analyst",
        persona="Robert Sterling",
        coverage=(
            "Rates (2Y, 10Y, 30Y), DXY, Fed funds futures, SPX/NDX/RUT, factor ETFs. "
            "Themes: the Fed path, inflation, growth-vs-value and cyclical-vs-defensive "
            "rotation."
        ),
        mandate=(
            "Own the macro overlay: interest rates, the Fed path, inflation, the dollar, "
            "and factor rotation. Give the regime call that frames every other "
            "specialist's work."
        ),
    ),
    "quant": Specialist(
        key="quant",
        name="Quantitative Analyst",
        persona="Anika Sharma",
        coverage=(
            "The full covered universe screened on factors. Themes: momentum and trend "
            "signals, value/quality/low-volatility factor exposures, breadth statistics, "
            "cross-sectional ranking."
        ),
        mandate=(
            "Provide the quantitative lens: factor exposures, systematic screens, momentum "
            "and trend signals, and breadth. Flag names that screen well or poorly and "
            "cross-check the discretionary specialists' conviction."
        ),
    ),
    "alt_data": Specialist(
        key="alt_data",
        name="Alt Data Specialist",
        persona="Kevin Park",
        coverage=(
            "Covered-universe names with meaningful alt-data coverage. Themes: web "
            "traffic, app downloads and MAU, credit-card spend panels, signal freshness "
            "versus consensus."
        ),
        mandate=(
            "Provide alternative-data signal: web traffic, app downloads, and credit-card "
            "spend panels. Surface where alt-data diverges from consensus and note the "
            "freshness and reliability of each signal."
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
