# Roadmap

The build is sequenced so each step produces something runnable. **Step 1 is done.**

## ✅ Step 1 — Scaffold, schema, orchestration framework (this commit)

- Monorepo: `apps/web` (Next.js 14) + `apps/api` (FastAPI) + `db/`.
- Design system wired into Tailwind — black ground, logo gold, cream text, serif
  headers, 8%-opacity logo watermark.
- Dashboard + ticker detail pages, degrading gracefully when the backend is offline.
- PostgreSQL schema (`db/schema.sql`) + seed (`db/seed.sql`): agents, securities,
  reports, recommendations, specialist notes, chart specs, price snapshots,
  recipients, versioned disclaimers, RLS.
- Agent framework: `Beth` orchestrator, 15-specialist registry, Chart Specialist
  sub-agent, Anthropic client with prompt caching, Polygon market-data adapter.
- FastAPI surface: `/health`, `/api/agents`, `/api/reports/generate`,
  `/api/reports`, `/api/recommendations/top`, `/api/tickers/{symbol}`.

## Step 2 — Persistence wiring

- Supabase adapter (`services/supabase.py`): write reports, runs, recommendations,
  notes, chart specs; resolve company names/descriptions from `securities`.
- Swap the in-memory `_LATEST` store in `main.py` for DB-backed reads.
- Backfill the coverage universe into `securities` (Polygon reference data).

## Step 3 — Market-data brief

- Replace `Beth._default_brief` with a real brief: index snapshots, the economic
  calendar, the overnight earnings tape.
- Per-specialist focused context (e.g. feed the AI DC specialist the relevant tape).

## Step 4 — Charts to PNG + email

- Kaleido PNG export in the Chart Specialist; upload to Supabase Storage.
- Resend HTML email template (React Email) with embedded chart PNGs + disclaimer.
- `services/email.py` send pipeline to `report_recipients`.

## Step 5 — Scheduling

- APScheduler (the Python equivalent of node-cron) running 7:30 AM / 11:00 AM /
  1:30 PM in `America/Phoenix` (UTC-7, no DST). Each fire calls
  `POST /api/reports/generate` for its slot, then the email pipeline.

## Step 6 — Dashboard depth

- Live chart rendering (Recharts inline, Plotly for advanced specs).
- Report archive view, agent-run telemetry panel, conviction history.

## Step 7 — Deploy

- Vercel (`apps/web`), Railway (`apps/api`), Supabase (DB). Wire env vars per
  the two `.env.example` files.

## Cross-cutting

Compliance disclaimer ships on every output from day one (`disclaimers` table +
`Beth.DISCLAIMER` + the web footer). Recommendation content and distribution must
clear Armstrong Arikat compliance review before reaching any client.
