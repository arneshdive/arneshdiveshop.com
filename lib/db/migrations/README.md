# Database Schema Management

This project does **not** use a committed SQL migration history. `lib/db/schema.ts` is the
single source of truth; schema changes are applied with `drizzle-kit push`, which diffs
`schema.ts` against the target database and reconciles it directly.

This directory only exists because `drizzle-kit` requires an `out` folder to be configured
(`drizzle.config.ts`); it holds no meaningful state. `.gitignore` excludes any `*.sql` files
here, and there is no `meta/` snapshot history — don't recreate one and don't rely on
`pnpm db:migrate`, it has nothing to apply.

## Environments

**Current state (as of 2026-09-18): there is only one database.** `.env`'s `DATABASE_URL`
is the live production DB, and local dev / `pnpm db:push` run directly against it — be
careful with local mutations, seed scripts, and schema experiments.

A split was proposed but deliberately deferred:

| Environment | DB | `DATABASE_URL` source |
|---|---|---|
| Production | Neon production branch | Vercel dashboard, Production-scoped env var |
| Preview (Vercel PR/branch deploys) | would be an ephemeral Neon branch per preview | Neon's Vercel integration (not connected yet) |
| Local dev | would be a persistent Neon `dev` branch | `.env.local` (not set up yet) |

`lib/scripts/migrate-on-deploy.mjs` already runs `drizzle-kit push` on both Vercel
Production and Preview builds in anticipation of this split (Preview builds currently push
to the same DB as Production until the integration above is connected). If/when a `dev`
branch is created, put its connection string in `.env.local` (gitignored, takes precedence)
and never restore a real value to `.env`.

## Commands

```bash
# Apply schema.ts changes to whatever DB DATABASE_URL points at
pnpm db:push

# Optional: preview the SQL diff before pushing (output is not committed,
# not part of any pipeline — purely a local sanity check)
pnpm db:generate

# Open Drizzle Studio to inspect the database
pnpm db:studio
```

## Schema Overview

- **users** — authentication users with role-based access (customer/admin/super_admin)
- **customers** — customer profiles linked to users
- **addresses** — customer shipping addresses
- **categories** / **brands** — product taxonomy
- **products** / **product_variants** — catalog, pricing in cents
- **blog_posts** — editorial content
- **carts** / **cart_items** / **checkout_sessions** — pre-order flow
- **orders** / **order_items** / **order_status_history** — order lifecycle
- **payments** — Midtrans payment records
- **promotions** — discount codes
- **banners** — homepage content
- **otp_codes** / **rate_limits** / **verification_tokens** — auth
- **shop_settings** — store configuration

### Money storage
All monetary values are stored as integers in cents (never floats): `price_cents`,
`amount_cents`, `total_spent_cents`, etc.

### Cascade rules
Foreign keys use explicit `onDelete` behavior defined in `schema.ts` — e.g. deleting a
`users` row cascades through `customers` → `orders` → `order_items`/`payments`, while
`order_status_history.changed_by` is `SET NULL` to preserve the audit trail. Check
`schema.ts` directly for the current rules rather than assuming.
