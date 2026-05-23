# Deploy Runbook — Armstrong Arikat Research Terminal

Ordered, copy-paste steps. **Do them in order.** Steps marked **(prereq)** are
account/DNS work; the code is already deploy-ready.

---

## 0 · Prerequisites (one-time accounts)

- [ ] GitHub account
- [ ] Vercel account (free tier OK)
- [ ] Railway account ($5/mo plan — keeps the WebSocket alive 24/7)
- [ ] Supabase account (free for staging; **Pro $25/mo for daily backups in prod**)
- [ ] Resend account
- [ ] Sentry account (one project each for `web` and `api`)
- [ ] Uptime monitor account (Better Uptime, Pingdom, or UptimeRobot)
- [ ] DNS access for `armstrongarikat.com`
- [ ] Polygon **Stocks Advanced** subscription ($199/mo) for live WebSocket trades
- [ ] Anthropic API key with budget

---

## 1 · Push to GitHub

```bash
cd "C:\Users\barms\OneDrive\claude beth"
gh repo create armstrong-arikat --private --source=. --remote=origin
git push -u origin master
```

Or via the GitHub UI: create empty private repo, then `git remote add origin <url>` + `git push -u origin master`.

---

## 2 · Supabase

1. **Create project** at https://supabase.com/dashboard → pick a region close to Railway's region (US-East works for both).
2. **Apply schema** — from the project root:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   supabase db execute --file supabase/seed.sql
   ```
   *Or* via SQL Editor (run in this order):
   1. `supabase/migrations/20260522000000_init.sql` (base schema + RLS)
   2. `supabase/migrations/20260522010000_specialist_recommendations.sql`
   3. `supabase/migrations/20260522020000_market_positioning.sql`
   4. `supabase/migrations/20260522030000_audit_log.sql`
   5. `supabase/migrations/20260523000000_healthcare_command_center.sql` (5 healthcare tables)
   6. `supabase/seed.sql` (25 specialists, idempotent — also retires the legacy `healthcare_biotech` row)
3. **Collect three keys** from Project Settings → API:
   - `SUPABASE_URL` → both `apps/api/.env` and `apps/web/.env`
   - `SUPABASE_SERVICE_ROLE_KEY` → `apps/api/.env` (backend only — never client)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `apps/web/.env`
   - `SUPABASE_JWT_SECRET` (Settings → API → JWT Settings) → `apps/api/.env`
4. **Daily backups** — Project Settings → Database → Backups → enable Daily.

---

## 3 · Backend on Railway

1. https://railway.app → New Project → Deploy from GitHub repo → pick `armstrong-arikat`.
2. **Root directory:** `apps/api`. Railway auto-detects the Dockerfile.
3. **Set environment variables** (Project → Variables):

   | Variable | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | sk-ant-... |
   | `ANTHROPIC_MODEL` | claude-sonnet-4-6 |
   | `POLYGON_API_KEY` | (Stocks Advanced key) |
   | `POLYGON_WS_URL` | wss://socket.polygon.io/stocks |
   | `SUPABASE_URL` | from step 2 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 2 |
   | `SUPABASE_JWT_SECRET` | from step 2 |
   | `RESEND_API_KEY` | (step 5) |
   | `RESEND_WEBHOOK_SECRET` | (step 5) |
   | `REPORT_FROM_EMAIL` | research@armstrongarikat.com |
   | `REPORT_TO_EMAIL` | brian@cccballers.com |
   | `SCHEDULE_TIMEZONE` | America/Phoenix |
   | `ALLOWED_ORIGINS` | https://research.armstrongarikat.com |
   | `ENVIRONMENT` | production |
   | `SENTRY_DSN` | (step 6, `api` project) |
   | `REQUIRE_AUTH` | **`false` for now** — flip to `true` once the login UI lands |
   | `RATE_LIMIT_DEFAULT` | 60/minute |

4. Railway generates a public URL like `https://armstrong-arikat-api.up.railway.app`. Hit `/health` — verify all `*_configured` flags read true.

> The in-process APScheduler runs the 7:30 / 11:00 / 13:30 AZ crons and the 15-min Top 50 poll. There is **no separate Railway cron worker** — that would split state and break the WebSocket subscription model.

---

## 4 · Frontend on Vercel

1. https://vercel.com → Add New → Project → import the GitHub repo.
2. **Root directory:** `apps/web`. Framework: Next.js (auto-detected).
3. **Environment variables:**

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_BASE_URL` | Railway URL from step 3 |
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 2 |
   | `NEXT_PUBLIC_ENVIRONMENT` | production |
   | `NEXT_PUBLIC_SENTRY_DSN` | (step 6, `web` project) |
   | `SENTRY_DSN` | (same DSN; server-side reads) |
   | `SENTRY_AUTH_TOKEN` | (optional — enables source-map upload) |
   | `SENTRY_ORG` | armstrong-arikat |
   | `SENTRY_PROJECT` | research-terminal-web |

4. Deploy. Vercel gives you a `*.vercel.app` URL.
5. **Custom domain** — Project Settings → Domains → add `research.armstrongarikat.com`. Add the CNAME record at your DNS:
   ```
   research.armstrongarikat.com  CNAME  cname.vercel-dns.com
   ```

---

## 5 · Resend — email + webhooks

1. Resend dashboard → Domains → add `armstrongarikat.com`.
2. **Add the 4 DNS records** Resend shows (SPF, DKIM x2, MX-or-return-path). Wait for verification (a few minutes).
3. Create an API key → set `RESEND_API_KEY` on Railway.
4. **Webhooks** — Resend dashboard → Webhooks → add endpoint:
   - URL: `https://<your-railway-url>/webhooks/resend`
   - Events: `email.bounced`, `email.complained`, `email.delivered`, `email.opened`
   - Resend generates a signing secret (`whsec_...`) → set `RESEND_WEBHOOK_SECRET` on Railway.
5. Send a test from Resend → confirm it arrives at `brian@cccballers.com` and the webhook log shows `delivered`.

---

## 6 · Sentry

1. Two new projects: `research-terminal-web` (Next.js) and `research-terminal-api` (FastAPI).
2. Copy each DSN into the matching env var (Vercel and Railway).
3. Trigger a deliberate error from each to confirm capture — Sentry shows it within ~30 seconds.

---

## 7 · Uptime monitoring

1. Better Uptime / Pingdom / UptimeRobot → add monitor:
   - URL: `https://<railway-url>/health`
   - Interval: 1 min
   - Assert: HTTP 200, body contains `"status":"ok"`
2. Add a second monitor on `https://research.armstrongarikat.com`.
3. Configure alert routing — email + SMS to Brian.
4. **Report-failure alert** — Sentry already captures cron exceptions. Add a Sentry alert rule: "If event count for `tag:cron != 0` and `level:error` exceeds 0 in 1 hour → notify Brian."

---

## 8 · Smoke test

```bash
python scripts/smoke.py --base https://<your-railway-url>
# When you trust your Anthropic budget:
python scripts/smoke.py --base https://<your-railway-url> --include-cron
```

The script hits every endpoint, validates JSON shape, and (with `--include-cron`) POSTs to each report-run endpoint. Exit code is non-zero on any failure — CI-friendly.

**Manual healthcare smoke** (5 healthcare endpoints + 8 frontend routes):
```bash
curl https://<railway>/api/agents | grep -c '"key"'     # expect 25
curl https://<railway>/api/healthcare                   # composite landing
curl https://<railway>/api/healthcare/clinical-catalysts
curl https://<railway>/api/healthcare/pdufas
curl https://<railway>/api/healthcare/glp1/latest
curl https://<railway>/api/healthcare/pipeline
curl https://<railway>/api/healthcare/patent-cliffs
# Frontend (after Vercel deploy):
# /healthcare /healthcare/biotech /healthcare/big-pharma /healthcare/tools
# /healthcare/glp1 /healthcare/ai-drug-discovery
# /healthcare/clinical-calendar /healthcare/fda-calendar
```
All five healthcare GETs return empty arrays on a fresh DB — that is the expected state until specialists populate the tables via their filings or a manual seed.

---

## 9 · Flip auth on (later)

When the `/login` UI lands:

1. Create your Supabase user (Authentication → Users → Add User).
2. Uncomment the enforcement block in `apps/web/middleware.ts`.
3. On Railway, set `REQUIRE_AUTH=true`.
4. Redeploy both.

The FastAPI middleware (`apps/api/app/middleware/auth.py`) will reject any request without a valid Supabase JWT. The `/health`, `/webhooks/*`, and `/reports/*` (static) paths stay public.

---

## 10 · Env var cheat sheet

**Railway (backend) — 17 vars**

```
ANTHROPIC_API_KEY ANTHROPIC_MODEL
POLYGON_API_KEY POLYGON_WS_URL
SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_JWT_SECRET
RESEND_API_KEY RESEND_WEBHOOK_SECRET REPORT_FROM_EMAIL REPORT_TO_EMAIL
SCHEDULE_TIMEZONE ALLOWED_ORIGINS
ENVIRONMENT SENTRY_DSN REQUIRE_AUTH RATE_LIMIT_DEFAULT
```

**Vercel (frontend) — up to 9 vars**

```
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_ENVIRONMENT
NEXT_PUBLIC_SENTRY_DSN SENTRY_DSN
SENTRY_AUTH_TOKEN SENTRY_ORG SENTRY_PROJECT
```

---

## Final compliance reminder

Generated research is informational, not personalized investment advice.
Every report and email already carries the firm disclaimer. **Do not remove it.**
All distribution and material recommendations must clear Armstrong Arikat
compliance review before reaching any client.
