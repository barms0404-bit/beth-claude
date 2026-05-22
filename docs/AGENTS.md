# Agent Fleet

## BETH — Chief-of-Staff Orchestrator

`apps/api/app/agents/orchestrator.py`. Receives a report-slot trigger, dispatches
the specialist roster concurrently, routes chart requests, aggregates a ranked
Top 50, runs its own synthesis turn (executive summary + conflict adjudication),
and returns a `Report`.

## The 15 Specialists

`apps/api/app/agents/registry.py`. Each is a `Specialist` with a domain mandate.
System prompt = shared firm preamble + mandate + JSON output contract (the shared
parts are prompt-cached).

| Key | Name | Role |
|-----|------|------|
| `morning_packet` | Morning Packet Analyst | Leads the 7:30 AM report |
| `midday_tactical` | Mid-Day Tactical Analyst | Leads the 11:00 AM report |
| `market_close` | Market Close Analyst | Leads the 1:30 PM report |
| `ai_datacenter` | AI Data Center Buildout Specialist | Hyperscaler capex, DC REITs, cooling, power |
| `energy_infra` | Energy Infrastructure Specialist | IPPs, nuclear/SMRs, turbines, grid |
| `training_chip` | Training Chip Specialist | NVDA roadmap, HBM, CoWoS, custom silicon |
| `inference_stack` | Inference & AI Software Stack Specialist | Inference silicon, vLLM, token economics |
| `robotics` | Robotics & Physical AI Specialist | Humanoids, automation, AVs |
| `quantum` | Quantum Computing Specialist | IONQ, RGTI, quantum modalities |
| `tech_generalist` | Technology / Software Generalist | SaaS, cloud, internet platforms |
| `healthcare_biotech` | Healthcare Biotech Specialist | Catalysts, trials, FDA |
| `consumer_internet` | Consumer / Internet Specialist | DTC, e-commerce, digital ads |
| `macro_strategy` | Macro Strategy Analyst | Rates, Fed, factor rotation |
| `quant` | Quantitative Analyst | Factor exposure, screens, momentum |
| `alt_data` | Alt Data Specialist | Web traffic, app downloads, card panels |

Dispatch rule (`roster_for`): the one window analyst whose `lead_slot` matches the
report, plus all 12 non-window specialists.

## Chart Specialist

`apps/api/app/agents/chart_specialist.py`. A sub-agent BETH calls to satisfy each
specialist's `chart_requests`. Produces a Plotly figure spec, a plain-English
explainer (why it matters / how to read it), and — from step 4 — a PNG export.

## Model

All agents use `claude-sonnet-4-6` by default (`ANTHROPIC_MODEL`). The shared
client (`services/anthropic_client.py`) sends system prompts with `cache_control`
so repeated specialist runs read the stable prompt from cache.
