# Arne's Dive Shop

Freediving/scuba e-commerce platform. Storefront (ISR + Server Components) and admin dashboard (CSR + TanStack Query) built on Next.js 16.

Status: frontend UI is complete (storefront + admin), backend is not yet built — no database connection, auth, payment, or admin CRUD. See `docs/RFP-COMPLETION.md` for the detailed scope of what's left.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Drizzle ORM + PostgreSQL (planned) · Zod · Midtrans (planned) · Radix UI · TanStack Query v5 (admin) · Zustand (cart)

## Getting Started

Package manager is pnpm — don't use npm/yarn (see `pnpm-workspace.yaml`).

```bash
pnpm dev      # start dev server (localhost:3000)
pnpm build    # production build
pnpm start    # run production build
pnpm lint     # eslint
```

## Where things live

- `app/` — routes: `(store)/` is the customer-facing storefront, `admin/` is the admin dashboard, `auth/` is login/register.
- `components/` — organized by feature domain (`cart/`, `checkout/`, `admin/`, `product/`, `layout/`, `ui/` for primitives).
- `lib/data/` — mock data standing in for the database until the backend is built.
- `lib/utils/format.ts` — shared money/date formatting; see the doc comments there for which formatter to use.
- `docs/superpowers/specs/` and `docs/superpowers/plans/` — per-page design specs and implementation plans from past build sessions.

See `CLAUDE.md` for the full architecture and current-state notes.

Last deployment trigger: 2026-07-13 (2)
