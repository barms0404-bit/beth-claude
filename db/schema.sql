-- ============================================================================
-- Armstrong Arikat Private Wealth Group — Research Terminal
-- PostgreSQL schema (Supabase). Run this first, then db/seed.sql.
-- ============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type report_slot   as enum ('market_prep', 'mid_day', 'market_close');
  create type run_status    as enum ('pending', 'running', 'succeeded', 'failed');
  create type report_status as enum ('draft', 'generating', 'ready', 'sent', 'failed');
  create type agent_kind    as enum ('orchestrator', 'specialist', 'chart');
  create type sentiment     as enum ('bullish', 'neutral', 'bearish');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- agents — BETH, the 15 specialists, and the chart sub-agent
-- ---------------------------------------------------------------------------
create table if not exists agents (
  key           text primary key,                 -- e.g. 'beth', 'morning_packet'
  name          text not null,
  kind          agent_kind not null,
  role          text not null,                    -- one-line mandate
  model         text not null default 'claude-sonnet-4-6',
  active        boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- securities — the coverage universe
-- ---------------------------------------------------------------------------
create table if not exists securities (
  symbol        text primary key,
  name          text not null,
  description   text,
  sector        text,
  industry      text,
  is_active     boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- price_snapshots — point-in-time market data from Polygon.io
-- ---------------------------------------------------------------------------
create table if not exists price_snapshots (
  id            uuid primary key default gen_random_uuid(),
  symbol        text not null references securities(symbol) on delete cascade,
  captured_at   timestamptz not null default now(),
  price         numeric(14,4),
  daily_pct     numeric(8,4),
  ytd_pct       numeric(8,4),
  volume        bigint,
  source        text not null default 'polygon'
);
create index if not exists idx_price_symbol_time
  on price_snapshots (symbol, captured_at desc);

-- ---------------------------------------------------------------------------
-- reports — one row per generated research report
-- ---------------------------------------------------------------------------
create table if not exists reports (
  id            uuid primary key default gen_random_uuid(),
  slot          report_slot not null,
  title         text not null,
  status        report_status not null default 'draft',
  summary       text,                              -- BETH's executive summary
  body_html     text,                              -- rendered email/web body
  disclaimer_id uuid,
  generated_at  timestamptz not null default now(),
  sent_at       timestamptz
);
create index if not exists idx_reports_slot_time on reports (slot, generated_at desc);

-- ---------------------------------------------------------------------------
-- agent_runs — telemetry for every agent invocation
-- ---------------------------------------------------------------------------
create table if not exists agent_runs (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid references reports(id) on delete cascade,
  agent_key     text not null references agents(key),
  status        run_status not null default 'pending',
  prompt_tokens int,
  output_tokens int,
  cache_read_tokens int,
  cost_usd      numeric(10,5),
  error         text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index if not exists idx_runs_report on agent_runs (report_id);

-- ---------------------------------------------------------------------------
-- recommendations — the Top 50 conviction list per report
-- ---------------------------------------------------------------------------
create table if not exists recommendations (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid not null references reports(id) on delete cascade,
  symbol          text not null references securities(symbol),
  rank            int not null check (rank between 1 and 50),
  thesis          text not null,
  lead_agent_key  text not null references agents(key),
  conviction      sentiment not null default 'bullish',
  created_at      timestamptz not null default now(),
  unique (report_id, rank),
  unique (report_id, symbol)
);
create index if not exists idx_recs_report on recommendations (report_id, rank);

-- ---------------------------------------------------------------------------
-- specialist_notes — per-ticker commentary from each specialist
-- ---------------------------------------------------------------------------
create table if not exists specialist_notes (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid references reports(id) on delete cascade,
  symbol        text not null references securities(symbol),
  agent_key     text not null references agents(key),
  commentary    text not null,
  stance        sentiment not null default 'neutral',
  created_at    timestamptz not null default now()
);
create index if not exists idx_notes_symbol on specialist_notes (symbol, created_at desc);

-- ---------------------------------------------------------------------------
-- chart_specs — Plotly/Recharts JSON + plain-English explainer + PNG
-- ---------------------------------------------------------------------------
create table if not exists chart_specs (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid references reports(id) on delete cascade,
  agent_key     text not null references agents(key),
  symbol        text references securities(symbol),
  title         text not null,
  library       text not null default 'plotly',   -- 'plotly' | 'recharts'
  spec_json     jsonb not null,                   -- chart definition
  explanation   text not null,                    -- why it matters / how to read it
  png_url       text,                             -- exported image for emails
  created_at    timestamptz not null default now()
);
create index if not exists idx_charts_report on chart_specs (report_id);

-- ---------------------------------------------------------------------------
-- report_recipients — automated email distribution list
-- ---------------------------------------------------------------------------
create table if not exists report_recipients (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- disclaimers — versioned compliance text appended to every output
-- ---------------------------------------------------------------------------
create table if not exists disclaimers (
  id             uuid primary key default gen_random_uuid(),
  version        text not null unique,
  body           text not null,
  effective_from timestamptz not null default now(),
  active         boolean not null default true
);

alter table reports
  add constraint fk_reports_disclaimer
  foreign key (disclaimer_id) references disclaimers(id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   The FastAPI backend uses the Supabase service-role key (bypasses RLS).
--   The Next.js frontend uses the anon key — grant it read-only on public data.
-- ---------------------------------------------------------------------------
alter table securities        enable row level security;
alter table price_snapshots   enable row level security;
alter table reports           enable row level security;
alter table recommendations   enable row level security;
alter table specialist_notes  enable row level security;
alter table chart_specs       enable row level security;
alter table disclaimers       enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'securities','price_snapshots','reports','recommendations',
    'specialist_notes','chart_specs','disclaimers'
  ] loop
    execute format(
      'create policy %I on %I for select to anon using (true);',
      'anon_read_' || t, t
    );
  end loop;
exception when duplicate_object then null;
end $$;

-- agents, agent_runs, report_recipients are backend-only — RLS left enabled
-- with no anon policy, so the anon key cannot read them.
alter table agents             enable row level security;
alter table agent_runs         enable row level security;
alter table report_recipients  enable row level security;
