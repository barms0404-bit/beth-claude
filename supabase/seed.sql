-- ============================================================================
-- Armstrong Arikat Research Terminal — seed data. Run after db/schema.sql.
-- Idempotent: re-running updates rows in place.
-- ============================================================================

-- --- Orchestrator + chart sub-agent --------------------------------------
insert into agents (key, name, persona, kind, role, sort_order) values
  ('beth',  'Chief of Staff', 'Beth', 'orchestrator',
   'Dispatches specialists, aggregates findings, resolves conflicts, formats reports.', 0),
  ('chart', 'Chart Specialist', 'Chart Specialist', 'chart',
   'Generates Recharts/Plotly specs with plain-English explainers and PNG exports.', 99)
on conflict (key) do update
  set name = excluded.name, persona = excluded.persona,
      role = excluded.role, sort_order = excluded.sort_order;

-- --- 23 specialist analysts (key, name, persona) -------------------------
insert into agents (key, name, persona, kind, role, sort_order) values
  ('morning_packet',     'Morning Packet Analyst',                'Eleanor Hayes',   'specialist',
   'Overnight wrap, pre-market movers, earnings recap.', 1),
  ('midday_tactical',    'Mid-Day Tactical Analyst',              'Marcus Webb',     'specialist',
   'Intraday attribution, flow color, afternoon catalysts.', 2),
  ('market_close',       'Market Close Analyst',                  'Diane Okafor',    'specialist',
   'Daily P&L, after-hours earnings, next-day setup.', 3),
  ('ai_datacenter',      'AI Data Center Buildout Specialist',    'Raj Patel',       'specialist',
   'Hyperscaler capex, DC REITs, cooling, power distribution.', 4),
  ('energy_infra',       'Energy Infrastructure Specialist',      'Tom Calloway',    'specialist',
   'IPPs, nuclear/SMRs, gas turbines, grid equipment.', 5),
  ('training_chip',      'Training Chip Specialist',              'Wei Zhang',       'specialist',
   'NVDA roadmap, HBM, CoWoS, custom training silicon.', 6),
  ('inference_stack',    'Inference & AI Software Stack Specialist','Priya Krishnan','specialist',
   'Inference silicon, vLLM, token economics.', 7),
  ('robotics',           'Robotics & Physical AI Specialist',     'Hannah Mueller',  'specialist',
   'Humanoids, industrial automation, autonomous vehicles.', 8),
  ('quantum',            'Quantum Computing Specialist',          'Daniel Brandt',   'specialist',
   'IONQ, RGTI, competing quantum approaches.', 9),
  ('tech_generalist',    'Technology / Software Generalist',      'Sofia Reyes',     'specialist',
   'SaaS, cloud, internet platforms.', 10),
  ('consumer_internet',  'Consumer / Internet Specialist',        'Olivia Chen',     'specialist',
   'DTC, e-commerce, digital advertising.', 12),
  ('macro_strategy',     'Macro Strategy Analyst',                'Robert Sterling', 'specialist',
   'Rates, the Fed, factor rotation.', 13),
  ('quant',              'Quantitative Analyst',                  'Anika Sharma',    'specialist',
   'Factor exposure, screens, momentum.', 14),
  ('chief_economist',       'Chief Economist',                       'Nathaniel Beech',   'specialist',
   'Global economic narrative — growth/inflation 2x2, Fed reaction function, liquidity + business cycle. Feeds Beth''s regime classification.', 15),
  ('china_economist',       'China Economist',                       'Vivian Liao',       'specialist',
   'China macro + policy + property + tech ecosystem with skeptical lens. End-market impact matrix on U.S. names with China exposure.', 16),
  ('inflation_specialist',  'Inflation Specialist',                  'Catherine Voss',    'specialist',
   'Inflation decomp + shelter lag model + supercore framework + regime classifier. Precise to the basis point.', 17),
  ('geopolitical_strategist','Geopolitical Strategist',              'Andrew Pemberton',  'specialist',
   'Geopolitical risk for the growth equity book — Taiwan/China/semis supply chain, Russia/Ukraine, Middle East, elections, sanctions.', 18),
  ('fixed_income',          'Fixed Income Specialist',               'Edward Vance',      'specialist',
   'Rates, curve, credit spreads, Fed mechanics — translated into growth-equity implications.', 19),
  ('value_investor',        'Value Investor Specialist',             'Henry Whitlock',    'specialist',
   'Intrinsic-value hunter, margin of safety, special situations, AI bubble bear case.', 20),
  ('dividend_aristocrat',   'Dividend Aristocrat & Income Specialist','Margaret Holloway','specialist',
   'Aristocrats/Kings, dividend safety + growth scoring, total-return-via-compounding income.', 21),
  ('biotech_smid',          'Biotech & Small Cap Biotech Specialist','Dr. Rachel Sinclair','specialist',
   'Deep small-mid-cap biotech — PoS modeling, rNPV per asset, clinical-trial evaluation, conference dives, M&A targets.', 22),
  ('big_pharma',            'Big Pharma & Specialty Pharma Specialist','Dr. Patricia Lansing','specialist',
   'Large-cap commercial pharma — GLP-1 megacycle, patent-cliff/LOE modeling, capital allocation, M&A framework, pipeline NPV.', 23),
  ('healthcare_tools',      'Healthcare Tools, CDMOs & Life Sciences Specialist','Dr. Ian Faulkner','specialist',
   'Picks-and-shovels of healthcare — tools, CDMOs, AI drug discovery, diagnostics. Bridges AI thesis to healthcare via drug discovery + GLP-1 manufacturing buildout.', 24),
  ('alt_data',              'Alt Data Specialist',                   'Kevin Park',        'specialist',
   'Web traffic, app downloads, credit-card panels.', 25)
on conflict (key) do update
  set name = excluded.name, persona = excluded.persona,
      role = excluded.role, sort_order = excluded.sort_order;

-- --- Retire deprecated seats --------------------------------------------
-- healthcare_biotech (Whitfield) was restructured into three specialized
-- seats: biotech_smid, big_pharma, healthcare_tools. Idempotent — safe to
-- re-run; no-op once removed.
delete from agents where key = 'healthcare_biotech';

-- --- Compliance disclaimer (v1) ------------------------------------------
insert into disclaimers (version, body, active) values
  ('2026.1',
   'This material is produced by Armstrong Arikat Private Wealth Group for ' ||
   'internal research purposes only. It is not investment advice, an offer, or a ' ||
   'solicitation to buy or sell any security. Opinions are generated by an ' ||
   'automated multi-agent research system and are subject to compliance review. ' ||
   'Past performance does not guarantee future results.',
   true)
on conflict (version) do update set body = excluded.body, active = excluded.active;

-- --- Report distribution list --------------------------------------------
insert into report_recipients (email, name, active) values
  ('brian@cccballers.com', 'Brian', true)
on conflict (email) do update set active = excluded.active;
