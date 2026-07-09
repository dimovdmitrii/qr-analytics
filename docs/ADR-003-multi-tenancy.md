# ADR-003: Multi-Tenancy Data Isolation Strategy

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** Дима

## Context

The core reason this tool exists is attribution: multiple companies share the same physical QR-code infrastructure from the main "SaaS QR" business, and every scan must be traceable to exactly one tenant (company) without leaking one tenant's data into another's dashboard. This is the most security-sensitive decision in the system.

## Decision

**Shared database, shared schema**, with a `tenant_id` column on every tenant-owned table, enforced by **Postgres Row-Level Security (RLS)** policies (available directly via Supabase) as a second layer of defense underneath the application-level query filters.

## Options Considered

### Option A: Shared schema + `tenant_id` + RLS

| Dimension | Assessment |
|---|---|
| Complexity | Low-medium — one schema, RLS policies to write once per table |
| Cost | Lowest — one database |
| Scalability | Fine to thousands of tenants |
| Isolation strength | Strong if RLS is correctly configured; app-level bugs are still caught by RLS as a backstop |

**Pros:** cheapest, simplest to migrate/query across tenants for the admin view, and RLS means even a bug in application code (forgetting a `WHERE tenant_id = ?`) can't leak data, because Postgres itself rejects the cross-tenant row.
**Cons:** requires discipline to write and test RLS policies for every table; a misconfigured policy is a silent security hole rather than a loud error.

### Option B: Schema-per-tenant

| Dimension | Assessment |
|---|---|
| Complexity | High — migrations must run per schema, connection/search_path juggling |
| Cost | Higher — more objects to manage, harder to pool connections |
| Scalability | Awkward past a few hundred tenants |
| Isolation strength | Strong by construction |

**Pros:** very strong isolation, easy to reason about per-tenant.
**Cons:** operationally heavy for a solo dev — every schema change is now N migrations, and the admin cross-tenant view (a required feature) gets harder, not easier.

### Option C: Database-per-tenant

| Dimension | Assessment |
|---|---|
| Complexity | Very high |
| Cost | Highest — one DB instance/connection pool per tenant |
| Scalability | Poor at this project's scale |
| Isolation strength | Strongest, but massive overkill |

**Pros:** maximum isolation, easy to delete a tenant's data entirely (drop the DB).
**Cons:** completely disproportionate to a project with dozens of tenants and one operator.

## Trade-off Analysis

Option A is the only one that doesn't fight the admin cross-tenant view requirement, and RLS specifically addresses the main risk of shared-schema multi-tenancy (an app-layer bug leaking rows) without the operational cost of B or C. Given the attribution use case is the whole point of the product, isolation still has to be real — RLS is what makes "shared schema" safe to choose rather than just convenient.

## Consequences

- Easier: schema migrations (one set), cross-tenant admin reporting, cost (one DB).
- Harder: every new table needs an RLS policy written and tested as part of its migration — this must become a checklist item, not an afterthought.
- Revisit if: a tenant ever requires contractual data-residency/physical-isolation guarantees a shared DB can't provide (unlikely for this customer segment).

## Action Items

1. [ ] Write RLS policy template applied to every new tenant-owned table: `USING (tenant_id = auth.jwt() -> 'tenant_id')`
2. [ ] Add an automated test that asserts a logged-in tenant A cannot read tenant B's `scan_events` via the API
3. [ ] Document the RLS checklist in the repo so it's not forgotten when adding tables
