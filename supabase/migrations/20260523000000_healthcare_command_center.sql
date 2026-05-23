-- ============================================================================
-- Healthcare Command Center — five tables backing the /healthcare dashboards.
--
-- Owned by the three healthcare seats:
--   biotech_smid (Sinclair)         -> clinical_catalyst_calendar, pipeline_assets
--   big_pharma (Lansing)            -> pdufa_calendar, pipeline_assets,
--                                      patent_cliff_tracker, glp1_megacycle_data
--   healthcare_tools (Faulkner)     -> glp1_megacycle_data (supply-side)
--
-- All tables back GET endpoints under /api/healthcare/*. Mutations happen via
-- specialist filings (Beth's orchestrator writes inferred catalysts back into
-- these tables during dispatch — wiring is downstream of this migration).
-- ============================================================================

-- --- Clinical catalyst calendar ------------------------------------------
create table if not exists clinical_catalyst_calendar (
  id                          uuid primary key default gen_random_uuid(),
  ticker                      text not null,
  company_name                text,
  drug_name                   text not null,
  indication                  text,
  catalyst_type               text check (catalyst_type in (
                                'phase_1_data','phase_2_data','phase_3_data',
                                'interim_analysis','pdufa','adcomm','filing',
                                'approval','launch','conference')),
  catalyst_date               date,
  catalyst_date_estimate_range text,
  probability_of_success      numeric(3,2),
  our_view                    text,
  expected_stock_move_pct     numeric(6,2),
  asymmetry_score             text check (asymmetry_score in ('favorable','neutral','unfavorable')),
  position_recommendation     text,
  related_companies           text[],
  status                      text check (status in ('upcoming','occurred','postponed')) default 'upcoming',
  result                      text,
  result_stock_move_pct       numeric(6,2),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_clinical_catalyst_ticker on clinical_catalyst_calendar(ticker);
create index if not exists idx_clinical_catalyst_date   on clinical_catalyst_calendar(catalyst_date);
create index if not exists idx_clinical_catalyst_status on clinical_catalyst_calendar(status);

alter table clinical_catalyst_calendar enable row level security;
drop policy if exists clinical_catalyst_anon_read on clinical_catalyst_calendar;
create policy clinical_catalyst_anon_read on clinical_catalyst_calendar
  for select using (true);


-- --- PDUFA calendar -------------------------------------------------------
create table if not exists pdufa_calendar (
  id                          uuid primary key default gen_random_uuid(),
  ticker                      text not null,
  drug_name                   text not null,
  indication                  text,
  pdufa_date                  date not null,
  review_type                 text check (review_type in ('standard','priority','breakthrough','accelerated')),
  advisory_committee_meeting  boolean not null default false,
  adcomm_date                 date,
  approval_probability        numeric(3,2),
  our_view                    text,
  commercial_potential_peak_sales_estimate numeric,
  status                      text check (status in ('upcoming','approved','crl','withdrawn','delayed')) default 'upcoming',
  outcome                     text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_pdufa_date   on pdufa_calendar(pdufa_date);
create index if not exists idx_pdufa_ticker on pdufa_calendar(ticker);

alter table pdufa_calendar enable row level security;
drop policy if exists pdufa_anon_read on pdufa_calendar;
create policy pdufa_anon_read on pdufa_calendar for select using (true);


-- --- GLP-1 megacycle snapshot (one row per snapshot_date) ----------------
create table if not exists glp1_megacycle_data (
  id                              uuid primary key default gen_random_uuid(),
  snapshot_date                   date not null,
  lly_revenue_qoq                 numeric,
  nvo_revenue_qoq                 numeric,
  lly_market_share                numeric(5,4),
  nvo_market_share                numeric(5,4),
  weekly_prescriptions_us         integer,
  weekly_new_starts               integer,
  manufacturing_capacity_estimate text,
  pricing_trend_commentary        text,
  insurance_coverage_pct          numeric(5,4),
  recent_indication_expansions    text[],
  competitive_pipeline_updates    text,
  cross_sector_impact_observations text,
  created_at                      timestamptz not null default now()
);

create unique index if not exists idx_glp1_snapshot_unique on glp1_megacycle_data(snapshot_date);
create index if not exists idx_glp1_snapshot on glp1_megacycle_data(snapshot_date desc);

alter table glp1_megacycle_data enable row level security;
drop policy if exists glp1_anon_read on glp1_megacycle_data;
create policy glp1_anon_read on glp1_megacycle_data for select using (true);


-- --- Pipeline assets ------------------------------------------------------
create table if not exists pipeline_assets (
  id                       uuid primary key default gen_random_uuid(),
  ticker                   text not null,
  asset_name               text not null,
  mechanism                text,
  indication               text,
  therapeutic_area         text,
  current_phase            text check (current_phase in (
                              'preclinical','phase_1','phase_2','phase_3','filed','approved')),
  probability_of_success   numeric(3,2),
  peak_sales_estimate      numeric,
  next_catalyst            text,
  next_catalyst_date       date,
  rnpv_estimate            numeric,
  specialist_owner         text check (specialist_owner in ('biotech_smid','big_pharma','healthcare_tools')),
  last_updated             timestamptz not null default now()
);

create index if not exists idx_pipeline_ticker on pipeline_assets(ticker);
create index if not exists idx_pipeline_phase  on pipeline_assets(current_phase);

alter table pipeline_assets enable row level security;
drop policy if exists pipeline_anon_read on pipeline_assets;
create policy pipeline_anon_read on pipeline_assets for select using (true);


-- --- Patent cliff tracker -------------------------------------------------
create table if not exists patent_cliff_tracker (
  id                              uuid primary key default gen_random_uuid(),
  ticker                          text not null,
  drug_name                       text not null,
  current_annual_revenue          numeric,
  composition_patent_expiration   date,
  estimated_loe_date              date,
  biosimilar_or_generic           text check (biosimilar_or_generic in ('biosimilar','generic','both')),
  expected_first_competitor_date  date,
  modeled_revenue_year_1          numeric,
  modeled_revenue_year_2          numeric,
  modeled_revenue_year_3          numeric,
  mitigation_strategy             text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists idx_patent_cliff_ticker on patent_cliff_tracker(ticker);
create index if not exists idx_patent_cliff_date   on patent_cliff_tracker(estimated_loe_date);

alter table patent_cliff_tracker enable row level security;
drop policy if exists patent_cliff_anon_read on patent_cliff_tracker;
create policy patent_cliff_anon_read on patent_cliff_tracker for select using (true);


-- --- updated_at touch trigger (shared) -----------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clinical_catalyst_touch on clinical_catalyst_calendar;
create trigger trg_clinical_catalyst_touch before update on clinical_catalyst_calendar
  for each row execute function touch_updated_at();

drop trigger if exists trg_pdufa_touch on pdufa_calendar;
create trigger trg_pdufa_touch before update on pdufa_calendar
  for each row execute function touch_updated_at();

drop trigger if exists trg_patent_cliff_touch on patent_cliff_tracker;
create trigger trg_patent_cliff_touch before update on patent_cliff_tracker
  for each row execute function touch_updated_at();
