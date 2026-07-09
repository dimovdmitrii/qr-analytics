# ADR-004: Authentication Approach

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** Дима

## Context

Need email/password signup, session handling across the Next.js App Router, and a way to attach `tenant_id` + `role` to a session so RLS policies (ADR-003) and API routes can trust it.

## Decision

**Supabase Auth**, integrated via `@supabase/ssr`, with `tenant_id` and `role` stored as custom claims/user metadata rather than rolling a custom JWT/session system.

## Options Considered

### Option A: Supabase Auth

**Pros:** already part of the chosen platform (ADR-002) — no extra service; issues Postgres-compatible JWTs that RLS policies read directly (`auth.jwt()`), which is what makes ADR-003's RLS approach low-friction; handles password hashing, email verification, and password reset out of the box.
**Cons:** ties auth to Supabase specifically; less "textbook NextAuth tutorial" if that pattern is ever wanted for portfolio-signaling reasons.

### Option B: NextAuth (Auth.js) with Credentials provider

**Pros:** the most commonly recognized Next.js auth library; flexible provider system (easy to add Google/GitHub login later).
**Cons:** would need a separate mechanism to get `tenant_id`/`role` into a form Postgres RLS can check, duplicating what Supabase Auth already provides for free; adds a second identity system alongside Supabase's own `auth.users` table.

### Option C: Custom JWT + bcrypt

**Pros:** full control, no dependency.
**Cons:** reimplementing password reset, email verification, and session refresh correctly is exactly the kind of security-sensitive boilerplate not worth hand-rolling solo.

## Trade-off Analysis

Since Supabase was already chosen for the database (ADR-002), using its Auth product isn't really "picking a fourth thing" — it's not paying twice for the same capability. The RLS integration (JWT claims Postgres can read natively) is the deciding factor: it makes ADR-003's isolation strategy nearly free to implement correctly.

## Consequences

- Easier: RLS policies, session handling in Server Components/Route Handlers via `@supabase/ssr`, password reset/email verification flows.
- Harder: adding non-Supabase identity providers later requires Supabase's own OAuth provider config rather than NextAuth's more provider-agnostic system (not currently a requirement).
- Revisit if: social login (Google/GitHub) becomes a requirement — Supabase supports it too, so this is unlikely to force a change.

## Action Items

1. [ ] Set up Supabase Auth email/password provider, enable email confirmation
2. [ ] Store `tenant_id` and `role` in `auth.users` metadata at signup (invite flow for adding members to an existing tenant)
3. [ ] Wire `@supabase/ssr` middleware for session refresh in Next.js middleware.ts
