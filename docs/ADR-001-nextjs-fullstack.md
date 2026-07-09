# ADR-001: Fullstack Next.js instead of separate Vite/React + Express

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** Дима

## Context

The app needs a dashboard UI, an authenticated CRUD API, a public high-traffic redirect endpoint, and scheduled aggregation jobs. It's built and operated by one person, and doubles as a portfolio piece.

## Decision

Use Next.js 15 (App Router) as a single fullstack app: React UI, API routes, and the `/r/[code]` redirect handler all live in one repo, deployed as one Vercel project.

## Options Considered

### Option A: Next.js fullstack

| Dimension | Assessment |
|---|---|
| Complexity | Low — one repo, one deploy, one language |
| Cost | Low — single Vercel project, generous free tier |
| Scalability | Good enough — serverless functions scale per-route automatically |
| Team familiarity | High — matches stated stack preference |

**Pros:** one deploy pipeline; API routes and pages share types end-to-end; `waitUntil` and edge middleware make the fast-redirect/async-log pattern trivial; Vercel Cron for aggregation jobs needs no extra infra.
**Cons:** less separation of concerns than a dedicated backend service; harder to scale the API independently of the frontend if that's ever needed; vendor-leans toward Vercel conventions.

### Option B: Vite + React SPA, separate Express/Node backend

| Dimension | Assessment |
|---|---|
| Complexity | Medium-high — two apps, two deploy targets, CORS, shared-types setup |
| Cost | Similar, but two services to host instead of one |
| Scalability | Backend scales independently — not a real need here |
| Team familiarity | High, but more surface area to maintain solo |

**Pros:** cleaner separation, backend portable off Vercel, more "traditional" architecture to show range.
**Cons:** for a solo dev this is pure overhead right now — two deploys, auth/session sharing across origins, duplicated types.

## Trade-off Analysis

The only real argument for Option B is portfolio variety (showing you can build a decoupled backend). That's outweighed by the operational cost of running two services solo, especially since the redirect endpoint's latency requirements are easily met by Vercel serverless/edge functions.

## Consequences

- Easier: deployment, auth/session handling (no cross-origin cookie issues), type sharing between UI and API.
- Harder: swapping the frontend framework later, or extracting the API to a standalone service if the project ever needs to scale past Vercel's model.
- Revisit if: the redirect endpoint's traffic ever needs a dedicated, independently-scaled service (unlikely at current scale).

## Action Items

1. [ ] Scaffold Next.js 15 App Router project
2. [ ] Set up `/api` route structure per SYSTEM_DESIGN.md
3. [ ] Set up `/r/[code]` route with edge runtime
