-- ============================================================================
-- audit_log — one row per LLM invocation across the fleet.
--
-- Written by services.audit_log.log_invocation after every call_agent reply.
-- File-backed JSONL holds the line until Supabase persistence wires; row shape
-- is identical here.
-- ============================================================================

create table if not exists audit_log (
  log_id              uuid primary key default gen_random_uuid(),
  timestamp           timestamptz not null default now(),
  agent_name          text not null,
  input_context       jsonb,
  output_response     text,
  tool_calls_made     jsonb,
  tools_results       jsonb,
  model_version       text,
  temperature         numeric(4, 2),
  confidence_scores   jsonb,
  citations           text[],
  downstream_consumers text[],
  prompt_tokens       int,
  output_tokens       int,
  cache_read_tokens   int
);

create index if not exists idx_audit_log_agent_time
  on audit_log (agent_name, timestamp desc);
create index if not exists idx_audit_log_time
  on audit_log (timestamp desc);

alter table audit_log enable row level security;

-- audit_log is backend-only: no anon read policy. Service role bypasses RLS.
