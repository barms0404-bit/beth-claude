# Armstrong Arikat Private Wealth Group — Research Terminal

A multi-agent equity research platform. BETH (chief-of-staff orchestrator) dispatches
15 specialist analyst agents, aggregates their output, and produces three automated
research reports daily plus an interactive web dashboard.

> **Compliance note:** This software generates research content. All recommendations,
> distribution, and disclosures must be reviewed and approved through Armstrong Arikat's
> compliance process before reaching any client. A compliance disclaimer is appended to
> every generated output by default — do not remove it.

## Architecture

```
claude beth/
├── apps/
│   ├── web/        Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
│   └── api/        Python FastAPI + Anthropic SDK — BETH orchestrator + 15 specialists
├── db/             PostgreSQL (Supabase) schema + seed
└── docs/           Architecture notes, agent roster, roadmap
```

| Layer        | Tech                                    | Hosting   |
|--------------|-----------------------------------------|-----------|
| Frontend     | Next.js 14, TypeScript, Tailwind, shadcn | Vercel    |
| Backend      | FastAPI, Anthropic SDK, node-cron-style scheduler | Railway |
| Database     | PostgreSQL                              | Supabase  |
| Market data  | Polygon.io (real-time stocks tier)      | —         |
| Email        | Resend                                  | —         |

## Reports (Arizona time, UTC-7, no DST)

| Time     | Report          | Lead specialist          |
|----------|-----------------|--------------------------|
| 7:30 AM  | Market Prep     | Morning Packet Analyst   |
| 11:00 AM | Mid-Day         | Mid-Day Tactical Analyst |
| 1:30 PM  | Market Close    | Market Close Analyst     |

Delivered to `brian@cccballers.com`.

## Local setup

Prerequisites — **install these first** (not currently on this machine):
- Node.js 20+  (https://nodejs.org)
- Python 3.11+ (https://python.org — uncheck "App execution alias" or add to PATH)

```bash
# frontend
cd apps/web
npm install
cp .env.example .env.local      # fill in values
npm run dev                     # http://localhost:3000

# backend
cd apps/api
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env          # fill in values
uvicorn app.main:app --reload   # http://localhost:8000

# database
# Run db/schema.sql then db/seed.sql in the Supabase SQL editor.
```

## Roadmap

See `docs/ROADMAP.md`. This commit is **Step 1**: project scaffold, database schema,
and agent orchestration framework. Subsequent steps wire market data, the report
pipeline, scheduling, email, and the full dashboard UI.
