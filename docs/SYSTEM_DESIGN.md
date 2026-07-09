# System Design — QR Analytics SaaS

**Status:** Draft v1
**Date:** 2026-07-07
**Author:** Дима (with Claude)

## 1. Requirements

### Functional
- Companies (tenants) sign up and get one or more QR codes (the same physical QR codes/plates issued by the main "SaaS QR" business).
- Every scan of a tenant's QR is logged: timestamp, device, browser, OS, approximate location, referrer.
- Dashboard shows per-tenant analytics: total scans, scans over time, device/browser breakdown, top-performing QR codes, recent scan feed.
- **Attribution use case (the actual business reason for this tool):** because QR codes are shared infrastructure across companies, the platform must answer "which company's QR code brought this scan/customer" — i.e., scan events are always tied to a `tenant_id` + `qr_code_id`, never anonymous.
- Export CSV/PDF reports.
- Admin (Дима) view across all tenants — usage, top performers, health.

### Non-functional
- Solo developer, portfolio-grade but should run as a genuinely usable internal tool for the main QR business.
- Low/no cost at current scale (dozens of tenants, thousands of scans/month) — must not require a team to operate.
- Redirect latency matters: a customer scanning a physical QR code should not perceive lag before landing on the destination page.
- Data correctness matters more than raw scale — this is an attribution/billing-adjacent number, not vanity metrics.

### Constraints
- Next.js 15 (App Router) fullstack — one deployable, one repo (decided, see ADR-001).
- Must reuse the QR codes already issued by the main project rather than minting a parallel, disconnected system.

## 2. High-Level Design

```
                        ┌─────────────────────────────┐
                        │        Next.js App          │
                        │  (Vercel, Node+Edge runtime) │
                        │                              │
  Physical QR  ───scan──▶  /r/[code]  (redirect route) │
                        │      │                       │
                        │      ├─ log scan_event ───┐  │
                        │      └─ 302 → target URL   │  │
                        │                             │ │
  Dashboard user ──────▶│  App Router pages           │ │
                        │  /dashboard, /qr, /analytics │ │
                        │      │                       │ │
                        │      └─ API routes (CRUD,    │ │
                        │         aggregation, export)  │ │
                        └──────────────┬────────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │   Supabase (Postgres)    │
                          │  - Auth                  │
                          │  - Storage (QR logos)    │
                          │  - Realtime (live scans) │
                          └───────────────────────────┘
```

Two request paths matter and should be thought of separately:

1. **Scan path** (`/r/[code]`) — public, unauthenticated, must be fast, write-heavy, single-purpose.
2. **Dashboard path** (`/dashboard/*`, `/api/*`) — authenticated, read-heavy, tenant-scoped.

## 3. Data Model

```
tenants (companies)
  id, name, slug, plan, created_at

users
  id, tenant_id (nullable for platform admins), email, role (owner|member|admin), created_at

qr_codes
  id, tenant_id, label, target_url, short_code (unique, encoded in the physical QR),
  logo_url (nullable), tags[], status (active|paused|archived), created_at

scan_events
  id, qr_code_id, tenant_id (denormalized for fast filtering), scanned_at,
  ip_hash (SHA-256, not raw IP — see SECURITY.md), country, city (nullable),
  device_type, browser, os, referrer, is_bot (bool)

analytics_daily (rollup table, populated by scheduled job)
  tenant_id, qr_code_id, day, scan_count, unique_visitor_estimate,
  top_device, top_country
```

Design notes:
- `tenant_id` is denormalized onto `scan_events` even though it's derivable via `qr_code_id` — every tenant-scoped query filters on it directly, and it's the column Postgres Row-Level Security policies key off (see ADR-003).
- Raw IPs are never stored — only a salted hash, plus coarse geo resolved at write time. This is a deliberate privacy/GDPR call, detailed in SECURITY.md.
- `analytics_daily` exists so the dashboard never runs `GROUP BY` over the full `scan_events` history as it grows into the hundreds of thousands of rows.

## 4. API Design

REST-ish, under `/api`:

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/*` | — | handled by Supabase Auth / `@supabase/ssr` |
| `/api/qr` | GET, POST | list / create QR codes for the current tenant |
| `/api/qr/:id` | GET, PATCH, DELETE | manage a single QR code |
| `/api/qr/bulk` | POST | CSV batch import |
| `/api/analytics/summary` | GET | KPI cards (total scans, trend, top QR) |
| `/api/analytics/timeseries` | GET | scans-by-day for charts, `?range=7d\|30d\|90d` |
| `/api/analytics/breakdown` | GET | device/browser/country distribution |
| `/api/export` | GET | CSV/PDF generation, streamed |
| `/r/[code]` | GET | **public** redirect + scan logging (not under `/api`, short URL for the physical code) |
| `/api/admin/*` | GET | platform-wide views, requires `role=admin` |

All `/api/*` routes (except `/r/[code]`) resolve `tenant_id` from the authenticated session — never trust a `tenantId` passed in the request body/query for data access.

## 5. Scan Path — Deep Dive

This is the one part of the system with a real latency budget, so it gets its own walkthrough:

1. Customer scans physical QR → hits `GET /r/{short_code}`.
2. Route looks up `qr_codes` by `short_code` (indexed, single-row lookup).
3. Response is issued as a `302` to `target_url` **immediately**.
4. Scan logging (parsing user-agent, hashing IP, resolving geo, inserting the row) happens in a `waitUntil()` callback so it doesn't block the redirect — the customer never waits on analytics.
5. Geo resolution uses Vercel's request geolocation headers (`x-vercel-ip-country`, `x-vercel-ip-city`) when available, avoiding a third-party API call/cost.
6. A lightweight bot filter (known crawler user-agents) sets `is_bot=true` instead of dropping the row — bots get excluded from dashboards by default but the data isn't destroyed.

Failure mode to design for: if the logging write fails, the redirect must still have already happened. Never gate the redirect on the write succeeding.

## 6. Aggregation & Real-Time

- **"Today" numbers**: computed live from `scan_events` (small enough — a day of a tenant's traffic is at most low thousands of rows).
- **Historical charts (7d/30d/90d)**: read from `analytics_daily`, populated by a nightly job (Vercel Cron → API route, or Supabase `pg_cron`) that rolls up the previous day.
- **"Live scan feed"**: Supabase Realtime subscription on `scan_events` filtered by `tenant_id`, pushed to the dashboard via websocket — this is what gives the "real-time" feel without building custom websocket infra.

## 7. Trade-off Analysis

| Decision | Chose | Instead of | Why |
|---|---|---|---|
| Fullstack framework | Next.js on Vercel | Vite SPA + Express | One deploy target, one language for routing/API/auth session handling; see ADR-001 |
| Database/platform | Supabase (Postgres) | Neon + separate auth/storage, or raw self-hosted Postgres | Bundles Postgres + Auth + Storage + Realtime — fewer moving parts for a solo dev; see ADR-002 |
| Multi-tenancy | Shared schema + `tenant_id` + RLS | DB-per-tenant, schema-per-tenant | Cheapest and simplest at this scale; RLS gives isolation without operational overhead; see ADR-003 |
| Scan logging | Redirect-then-log (`waitUntil`) | Log-then-redirect | Redirect latency is user-facing, log latency isn't |
| Aggregation | Nightly rollup table | Query raw events every time | Keeps dashboard fast as `scan_events` grows |

## 8. What to Revisit as It Grows

- If a tenant starts generating >~100k scans/month, move rollups from nightly to hourly, and consider partitioning `scan_events` by month.
- If tenant count grows past what one team can trust with shared-schema RLS comfort, revisit schema-per-tenant (ADR-003 documents the trigger condition).
- If export volume grows, move CSV/PDF generation to a background job + notification instead of a synchronous request.
- Bot filtering is naive (user-agent string matching) — revisit if scan-count inflation/abuse becomes a real concern for billing-adjacent numbers.
