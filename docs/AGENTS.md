# Agent Fleet

Every agent has a stable `key` (machine ID — never changes) and a `persona`
(human analyst name — the byline). Reports are internal to the PM; named
bylines are for that internal audience only.

## BETH — Chief-of-Staff Orchestrator

`apps/api/app/agents/orchestrator.py`. Receives a report-slot trigger, dispatches
the specialist roster concurrently, routes chart requests, aggregates a
conviction-ranked Top 50 from specialist `new_ideas`, runs its own synthesis turn
(executive summary + conflict adjudication + escalated risk flags), and returns a
`Report`.

## The 23 Specialists

`apps/api/app/agents/registry.py`. Each is a `Specialist` with a `persona`, a
functional title, a `coverage` universe, and a `mandate`. System prompt = shared
firm preamble + identity + coverage + mandate + daily cadence + JSON output
contract (the shared fragments are prompt-cached).

| Key | Persona | Title | Coverage |
|-----|---------|-------|----------|
| `morning_packet` | Eleanor Hayes | Morning Packet Analyst | Leads the 7:30 AM report |
| `midday_tactical` | Marcus Webb | Mid-Day Tactical Analyst | Leads the 11:00 AM report |
| `market_close` | Diane Okafor | Market Close Analyst | Leads the 1:30 PM report |
| `ai_datacenter` | Raj Patel | AI Data Center Buildout Specialist | Hyperscaler capex, DC REITs, cooling, power |
| `energy_infra` | Tom Calloway | Energy Infrastructure Specialist | IPPs, nuclear/SMRs, turbines, grid |
| `training_chip` | Wei Zhang | Training Chip Specialist | NVDA roadmap, HBM, CoWoS, custom silicon |
| `inference_stack` | Priya Krishnan | Inference & AI Software Stack Specialist | Inference silicon, vLLM, token economics |
| `robotics` | Hannah Mueller | Robotics & Physical AI Specialist | Humanoids, automation, AVs |
| `quantum` | Daniel Brandt | Quantum Computing Specialist | IONQ, RGTI, quantum modalities |
| `tech_generalist` | Sofia Reyes | Technology / Software Generalist | SaaS, cloud, internet platforms |
| `healthcare_biotech` | James Whitfield | Healthcare Biotech Specialist | Catalysts, trials, FDA |
| `consumer_internet` | Olivia Chen | Consumer / Internet Specialist | DTC, e-commerce, digital ads |
| `macro_strategy` | Robert Sterling | Macro Strategy Analyst | Rates, Fed, factor rotation |
| `quant` | Anika Sharma | Quantitative Analyst | Factor exposure, screens, momentum |
| `chief_economist` | Nathaniel Beech | Chief Economist | Growth-inflation 2x2, Fed reaction function, liquidity + business cycle, global growth |
| `china_economist` | Vivian Liao | China Economist | China macro + policy + property + tech ecosystem; end-market impact matrix on U.S. names |
| `inflation_specialist` | Catherine Voss | Inflation Specialist | Decomp + shelter lag + supercore + regime classifier; precise to the basis point |
| `geopolitical_strategist` | Andrew Pemberton | Geopolitical Strategist | Taiwan/China/semis supply chain, Russia/Ukraine, Middle East, elections, sanctions |
| `fixed_income` | Edward Vance | Fixed Income Specialist | Rates, curve, credit, Fed — with growth-equity implication |
| `value_investor` | Henry Whitlock | Value Investor Specialist | Intrinsic value, margin of safety, special situations, AI bubble bear case |
| `dividend_aristocrat` | Margaret Holloway | Dividend Aristocrat & Income Specialist | Aristocrats/Kings, dividend safety + growth, REITs/BDCs |
| `biotech_smid` | Dr. Rachel Sinclair | Biotech & Small Cap Biotech Specialist | PoS modeling, rNPV per asset, clinical trial design, conference dives — small-mid-cap |
| `alt_data` | Kevin Park | Alt Data Specialist | Web traffic, app downloads, card panels |

Dispatch rule (`roster_for`): the one window analyst whose `lead_slot` matches the
report, plus all 20 non-window specialists.

## Canonical specialist contract

Every specialist returns a `SpecialistReport` (`apps/api/app/schemas.py`):

```
specialist · agent_key · timestamp · key_takeaway
covered_names_commentary[]  {ticker, move_pct, narrative, action}
new_ideas[]                 {ticker, thesis, conviction_1_10, time_horizon, key_risk}
chart_request               {chart_type, data_needed, why_this_chart}  (nullable)
risk_flags[] · compliance_notes[]
```

## Chart Specialist

`apps/api/app/agents/chart_specialist.py`. A sub-agent Beth calls to satisfy a
specialist's `chart_request`. Produces a `ChartSpec`: a `recharts_spec` (interactive
web), a `plotly_spec` (HD PNG export for email), and a 2-3 paragraph
`chart_explanation` (why it matters / how to read it). PNG export lands in step 4.

## Model

All agents use `claude-sonnet-4-6` by default (`ANTHROPIC_MODEL`). The shared
client (`services/anthropic_client.py`) sends system prompts with `cache_control`
so repeated specialist runs read the stable prompt from cache.
