# QR Analytics — attribution dashboard for craft businesses

**Live demo:** https://qr-analytics-seven.vercel.app

A multi-tenant analytics layer for QR codes: track which company's QR code was
scanned, by whom (device/location, not identity), and attribute the scan back
to that company. Built as a companion tool to a physical QR-code plate
business — it reuses the same codes rather than minting new ones.

Full design rationale lives in [`docs/`](./docs):
- [`docs/SYSTEM_DESIGN.md`](./docs/SYSTEM_DESIGN.md) — requirements, data model, API, scan/redirect flow, aggregation
- [`docs/ADR-001-nextjs-fullstack.md`](./docs/ADR-001-nextjs-fullstack.md) through `ADR-004` — key tech decisions
- [`docs/SECURITY.md`](./docs/SECURITY.md) — tenant isolation, PII handling, abuse mitigation

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres +
Auth + Storage + Realtime) · Prisma · Recharts

## Getting started

### 1. Create a Supabase project

Free tier is fine at this scale. From the project's **Settings → API** page,
grab the URL, anon key, and service role key. From **Settings → Database**,
grab the pooled (pgbouncer) connection string.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL` from step 1. Generate random
values for `IP_HASH_SALT` and `CRON_SECRET`.

Alternatively, run `docker compose up -d` for a local Postgres instance and
point `DATABASE_URL` at it while you build out Supabase separately — you'll
still need a Supabase project for Auth/Storage/Realtime eventually (see
`docs/ADR-002-database-hosting.md`).

### 3. Install dependencies and push the schema

```bash
npm install
npx prisma db push
```

`npm install` also runs `prisma generate` automatically (via `postinstall`).

### 4. Row-Level Security (required before going live)

The Prisma schema defines tables but does **not** write RLS policies — those
must be added directly in Supabase (SQL editor or migrations) per
`docs/ADR-003-multi-tenancy.md`. At minimum, every tenant-owned table
(`qr_codes`, `scan_events`, `analytics_daily`) needs a policy like:

```sql
alter table qr_codes enable row level security;
create policy tenant_isolation on qr_codes
  using (tenant_id = (auth.jwt() ->> 'tenant_id'));
```

This is the single most important step before handling real customer data —
see the checklist in `docs/SECURITY.md` section 1.

### 5. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`, sign up, create a QR code, and hit
`http://localhost:3000/r/{shortCode}` to simulate a scan.

## Project structure

```
app/
  (auth)/          login, signup, server actions
  dashboard/        overview, QR manager, analytics, settings
  api/              qr CRUD + bulk import, analytics endpoints, export, cron
  r/[code]/         public redirect + scan-logging route
components/
  ui/               small Tailwind-based primitives (button, card, input...)
  dashboard/        sidebar, charts, tables
  auth/             login/signup forms
lib/
  data/             tenant-scoped Prisma queries (analytics.ts, qr.ts)
  supabase/         browser/server/middleware Supabase clients
  tenant.ts         session + tenant resolution (source of truth for access control)
  scan-utils.ts     IP hashing, UA parsing, bot detection
prisma/schema.prisma
docs/                architecture decision records + system design + security notes
```

## Deploying

Deploy to Vercel (matches ADR-001/002). Set the same environment variables
from `.env.local` in the Vercel project settings, then enable the cron job
defined in `vercel.json` (nightly `analytics_daily` rollup — see
`docs/SYSTEM_DESIGN.md` section 6).

Docker is also supported (`Dockerfile`, multi-stage, `output: "standalone"`)
for running outside Vercel if that's ever needed.

## What's not built yet

- RLS policies (step 4 above) — schema exists, policies must be added per-table
- Email verification gating (Supabase Auth handles the mechanics, but the app
  doesn't yet block QR creation until a verified email — see ADR-004)
- QR code image generation/download (currently only the redirect link is
  generated; `qrcode.react` is installed and ready to wire into the QR
  manager for a visual/downloadable code)
- Logo branding upload (Supabase Storage bucket referenced in `logoUrl` but
  no upload UI yet)
- Rate limiting on `/r/[code]` (flagged as a hard requirement if scan counts
  ever affect billing — see `docs/SECURITY.md` open questions)
