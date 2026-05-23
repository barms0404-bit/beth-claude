# Deploy quick-reference

Companion to `DEPLOY.md`. Files in this folder:

- **`railway-env.txt`** — paste into Railway → Variables → Raw Editor
- **`vercel-env.txt`** — paste into Vercel → Project Settings → Environment Variables
- **`smoke.sh`** — bash script to smoke-test Railway after deploy (`bash deploy/smoke.sh https://your-railway-url`)

## Where each `<REPLACE_*>` value comes from

| Token | Source |
|-------|--------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com → API Keys → Create Key |
| `SUPABASE_URL` / `SUPABASE_*` | Supabase dashboard → Settings → API (after creating project) |
| `SUPABASE_JWT_SECRET` | Supabase dashboard → Settings → API → JWT Settings |
| `RESEND_API_KEY` | https://resend.com/api-keys (after creating account) |
| `RESEND_WEBHOOK_SECRET` | Resend dashboard → Webhooks → Add Endpoint → reveals secret |
| `SENTRY_DSN` | Sentry → Project Settings → Client Keys (DSN) — one per project (`api`, `web`) |
| `<railway-url>` | Railway → Settings → Networking → Generate Domain |
| `<vercel-url>` | Vercel → Project → Settings → Domains (default `*.vercel.app`) |

## First-report flow once all 4 platforms are live

```bash
# 1. Verify Railway is healthy
curl https://YOUR-railway-url/health
# Expect: {"status":"ok", "anthropic_configured":true, "polygon_configured":true, ...}

# 2. Verify 25 specialists are seeded
curl https://YOUR-railway-url/api/agents | python -c "import json,sys; print(len(json.load(sys.stdin)))"
# Expect: 25 (or 27 including orchestrator + chart)

# 3. Smoke the healthcare endpoints (all return empty arrays on fresh DB)
bash deploy/smoke.sh https://YOUR-railway-url

# 4. Trigger the report (cost: ~$2-4 Anthropic, ~5 min wall-clock)
curl -X POST https://YOUR-railway-url/api/reports/run/mid_day

# 5. The rendered HTML lands here:
# https://YOUR-railway-url/reports/mid_day-<timestamp>.html
```
