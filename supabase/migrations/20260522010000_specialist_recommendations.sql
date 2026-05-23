-- ============================================================================
-- specialist_recommendations — closed-loop tracking for every specialist pick.
--
-- Written when a specialist files a new_idea, updated when the trade is closed.
-- Drives per-specialist track records once the outcome-scoring loop wires the
-- engine's TRACK_RECORD map.
-- ============================================================================

create table if not exists specialist_recommendations (
  recommendation_id      uuid primary key default gen_random_uuid(),
  report_id              uuid references reports(id) on delete set null,
  agent_key              text not null,
  specialist             text not null,                       -- persona name
  ticker                 text not null,
  action                 text not null default 'long'
                         check (action in ('long','short','avoid','watch')),
  conviction_1_10        int  check (conviction_1_10 between 1 and 10),
  time_horizon           text,
  thesis_summary         text,

  entry_price            numeric(14,4),
  entry_timestamp        timestamptz not null default now(),
  target_price           numeric(14,4),
  stop_loss              numeric(14,4),
  thesis_assumptions     jsonb,            -- array of strings
  catalyst_expected      text,
  catalyst_date_estimate date,

  closed                 boolean not null default false,
  exit_price             numeric(14,4),
  exit_timestamp         timestamptz,
  realized_return        numeric(8,4),     -- percent
  vs_benchmark_return    numeric(8,4),     -- percent
  hit_target             boolean,
  thesis_validated       boolean,
  post_mortem_notes      text
);

create index if not exists idx_sr_specialist on specialist_recommendations (agent_key, entry_timestamp desc);
create index if not exists idx_sr_ticker     on specialist_recommendations (ticker, entry_timestamp desc);
create index if not exists idx_sr_open       on specialist_recommendations (agent_key, ticker) where closed = false;

alter table specialist_recommendations enable row level security;

do $$ begin
  create policy anon_read_specialist_recommendations
    on specialist_recommendations for select to anon using (true);
exception when duplicate_object then null; end $$;
