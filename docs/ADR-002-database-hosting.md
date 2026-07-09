# ADR-002: Database & Hosting Platform

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** Дима

## Context

Дима has no strong preference and asked for "the simplest good option." The app needs: a relational store for tenants/QR codes/scan events, user authentication, file storage (QR logo uploads for branding), and a way to push live scan updates to the dashboard. Solo dev, cost-sensitive, wants to minimize the number of services to configure and maintain.

## Decision

**Supabase** (managed Postgres + Auth + Storage + Realtime), paired with **Prisma** as the ORM/schema layer, deployed alongside the Next.js app on **Vercel**.

## Options Considered

### Option A: Supabase (Postgres + Auth + Storage + Realtime)

| Dimension | Assessment |
|---|---|
| Complexity | Low — one platform covers DB, auth, storage, realtime |
| Cost | Free tier covers this project's scale comfortably |
| Scalability | Fine for thousands of tenants; standard managed Postgres underneath |
| Team familiarity | New tool, but each piece (Postgres, Auth) is standard and well-documented |

**Pros:** four separate concerns (DB, auth, file storage for logos, realtime for the live scan feed) solved by one account/dashboard instead of four; Postgres underneath so Prisma works normally and nothing is locked into a proprietary query language; generous free tier.
**Cons:** Supabase Auth replaces NextAuth, which is a bit less "standard Next.js tutorial" — but it removes a whole integration surface (session cookies, providers config) instead of adding one.

### Option B: Neon (serverless Postgres) + NextAuth + Vercel Blob

| Dimension | Assessment |
|---|---|
| Complexity | Medium — three separate services to wire together |
| Cost | Also cheap, but split across three billing surfaces |
| Scalability | Neon's branching is nice for preview environments |
| Team familiarity | NextAuth is the most common Next.js auth pattern |

**Pros:** Neon's database branching per Vercel preview deploy is a genuinely nice DX feature; NextAuth has the most tutorials/community support.
**Cons:** three services instead of one means three places things can misconfigure (CORS/env vars for storage, auth callback URLs, DB connection pooling) — directly working against the "simple" requirement.

### Option C: Railway (Postgres) + self-rolled everything

| Dimension | Assessment |
|---|---|
| Complexity | Medium — Railway is simple for the DB itself, but auth/storage/realtime are all DIY |
| Cost | Cheap, usage-based |
| Scalability | Fine |
| Team familiarity | Simple mental model (just a Postgres box) |

**Pros:** straightforward, no vendor lock beyond "it's Postgres."
**Cons:** you'd hand-build auth (password hashing, sessions, email verification) and file storage — exactly the boilerplate that's easiest to get subtly wrong, and the least interesting part to build for a portfolio piece.

## Trade-off Analysis

Given the explicit ask for the simplest good option, the deciding factor is **number of services to operate**, not raw feature ceiling — all three options are technically capable. Supabase wins because auth, storage, and realtime are all *already required by the feature list* (login, logo upload, live scan feed), and Supabase provides all three against the same Postgres instance Prisma talks to. Neon's branching feature is nice but doesn't offset onboarding three separate vendors solo.

## Consequences

- Easier: auth (no NextAuth provider/callback config), logo uploads (Supabase Storage bucket), live scan feed (Supabase Realtime channel on `scan_events`), all one dashboard to check.
- Harder: migrating off Supabase later would mean re-implementing auth and storage, not just swapping a connection string — acceptable lock-in for a portfolio/small-business tool, worth revisiting only if the project outgrows Supabase's tier limits.
- Revisit if: scan volume or tenant count outgrows Supabase's free/pro tier limits, or if there's ever a reason to run fully self-hosted.

## Action Items

1. [ ] Create Supabase project, enable Postgres + Auth + Storage + Realtime
2. [ ] Set up Prisma schema against the Supabase Postgres connection string
3. [ ] Configure `@supabase/ssr` for Next.js session handling
4. [ ] Create a Storage bucket for QR logo uploads with per-tenant path scoping
