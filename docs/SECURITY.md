# Security Considerations — QR Analytics SaaS

**Status:** Draft v1
**Date:** 2026-07-07

Threat model for this project: low-value target for sophisticated attackers, but it does hold third-party companies' business data (their scan/attribution numbers) and end-customer traces (IP-derived location, device). The main risks are tenant data leaking across companies, scan-count manipulation (this number may affect billing/attribution decisions in the main business), and casual scraping of the public redirect endpoint.

## 1. Tenant Isolation

- Every tenant-owned table carries `tenant_id`; every query is scoped by it at the application layer **and** by Postgres RLS (ADR-003) as a backstop.
- API routes resolve `tenant_id` exclusively from the authenticated session (`auth.jwt()` claim) — a `tenantId` field arriving in a request body or query string is never trusted for access control, only for display.
- Before shipping, add an automated test that logs in as tenant A and attempts to read/write tenant B's `qr_codes` and `scan_events` via the API — this must fail even if a route handler has a bug, because RLS should reject it at the database level.

## 2. PII & Scan Data

- **Never store raw IP addresses.** Store a salted SHA-256 hash (`ip_hash`) for dedup/abuse-detection purposes, plus the coarse geo (`country`, `city`) resolved once at write time. The raw IP is discarded after that resolution.
- This is a deliberate GDPR-minded default: country/city-level location plus device/browser is enough for the analytics use case; exact IP is not needed and is the more sensitive artifact to retain.
- Publish a short, honest privacy note on any public-facing page a scan lands on (or in the dashboard for tenants to reuse) — end customers scanning a physical QR code should be able to find out that scans are logged.
- Define a retention window (e.g., raw `scan_events` older than 13 months get pruned or rolled into `analytics_daily` only) — decide the exact number with Дима before launch, but the schema should not assume infinite retention.

## 3. Redirect Endpoint (`/r/[code]`) Hardening

This route is unauthenticated by design (it's what the physical QR code hits), which makes it the most exposed surface:

- Rate-limit by `ip_hash` + `short_code` (e.g., via Vercel's edge middleware or Upstash Redis) to blunt scripted scan-count inflation — a real concern if scan counts ever feed into billing or attribution payouts between Дима's business and its client companies.
- Validate `short_code` format before hitting the database (reject obviously malformed input early, cheap defense against enumeration probing).
- Never reflect `target_url` or any user-controlled input back into the response in a way that could be exploited (open-redirect hygiene: `target_url` is only ever a value the tenant configured via the authenticated dashboard, never taken from the incoming request).
- Log and alert on abnormal spikes for a single `short_code` — both a fraud signal and a legitimate "this QR code went viral" signal worth surfacing to the tenant either way.

## 4. Auth

- Supabase Auth handles password hashing, email verification, and session refresh (ADR-004) — do not hand-roll any of this.
- Enforce a minimum password policy and email verification before a tenant can create QR codes (not before signup, to keep onboarding friction low).
- Role model: `owner` / `member` per tenant, plus a separate platform-level `admin` role (Дима) that is **not** just "a member of every tenant" — keep it a distinct claim so tenant RLS policies don't need special-casing to accommodate it. Admin cross-tenant reads go through a separate, explicitly audited code path.

## 5. Secrets & Config

- Supabase service-role key (which bypasses RLS) is only ever used server-side, in the admin/aggregation code paths, and never shipped to the client bundle.
- All secrets in Vercel environment variables, not committed to the repo, with separate values for preview/production.
- Rotate the service-role key if it's ever exposed in a log or client bundle by mistake — treat this as the single most sensitive credential in the system.

## 6. Export Endpoints

- CSV/PDF export must apply the same tenant-scoping as the dashboard — a common bug class is export endpoints that skip the filters the UI applies. Route exports through the same tenant-scoped query functions as the dashboard, not a parallel query path.

## Open Questions for Дима

1. What retention window for raw `scan_events` — is there a business reason to keep it longer than ~12-13 months?
2. Does scan count ever directly affect money changing hands between companies (billing/attribution payouts)? If yes, rate-limiting and anti-inflation on the redirect endpoint moves from "good practice" to "must-have before launch."
