# Supabase

Database lives here. Two layouts to know:

```
supabase/
├── config.toml              CLI config (local + link)
├── migrations/
│   └── 20260522000000_init.sql    canonical schema
└── seed.sql                 seed data (agents, disclaimers, recipients)
```

## Cloud setup

1. Create a project at https://supabase.com/dashboard.
2. From the local `claude beth/` root:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push          # applies every file in migrations/ in order
   supabase db execute --file supabase/seed.sql
   ```
3. Copy the **Service Role key** into `apps/api/.env` as `SUPABASE_SERVICE_ROLE_KEY` and the **anon key** into `apps/web/.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The **JWT Secret** (Project Settings → API → JWT Settings) goes into `apps/api/.env` as `SUPABASE_JWT_SECRET`.
4. Enable daily backups: Project Settings → Database → Backups → Daily (Pro plan).

## Adding a migration

```bash
supabase migration new add_audit_log
# edit supabase/migrations/<new-file>.sql
supabase db push
```

Row-Level Security is already enabled on every table in `20260522000000_init.sql`. The anon role has read-only access to public tables; the FastAPI backend uses the service-role key and bypasses RLS.
