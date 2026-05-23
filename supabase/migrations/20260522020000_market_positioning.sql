-- ============================================================================
-- Market positioning columns on specialist_recommendations.
--
-- Every recommendation now carries variant perception (consensus/variant/
-- contrarian), specialist-estimated crowding (1-10), evidence strength (1-10),
-- consensus target (12m street PT estimate), and the computed delta vs the
-- team's base-case target.
-- ============================================================================

alter table specialist_recommendations
  add column if not exists variant_perception text
    check (variant_perception in ('consensus', 'variant', 'contrarian')),
  add column if not exists crowding_score int
    check (crowding_score between 1 and 10),
  add column if not exists evidence_strength int
    check (evidence_strength between 1 and 10),
  add column if not exists consensus_target numeric(14, 4),
  add column if not exists consensus_target_vs_team_target_pct numeric(8, 4);

create index if not exists idx_sr_variant
  on specialist_recommendations (variant_perception, evidence_strength desc)
  where closed = false;
