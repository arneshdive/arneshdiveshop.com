# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The import above pulls in Next.js-version-specific agent rules (this project pins Next.js 16, which has breaking changes vs. training data — consult `node_modules/next/dist/docs/` before writing App Router code).

## Project State

This is **Arnesh Dive Shop**, a freediving/scuba e-commerce platform. Per `docs/RFP-COMPLETION.md` (2026-07-12), the project is ~40% complete:

- **Done:** full storefront UI (`app/(store)/`), full admin UI (`app/admin/`), the component library (`components/`), DB schema/connection, and product-related backend (catalog CRUD, storefront product listing/search/pagination, categories, brands).
- **Also done:** email-OTP authentication (see below), JWT sessions (`lib/auth/session.ts` + `middleware.ts`), transactional email via Resend (`lib/email/`), admin invitations.
- **Missing/unverified:** Midtrans payment, order processing, deployment. Check `lib/queries/`, `app/api/`, and `app/admin/` directly before assuming a feature is missing — this list may lag actual progress.

The DB layer is built and live: `lib/db/index.ts` (Drizzle + Neon Postgres client), `lib/db/schema.ts`, and migrations exist and are actively used. `lib/queries/products.ts` (and sibling files under `lib/queries/`) provide the direct-import query layer used by Server Components (`/produk`, homepage) and Route Handlers (`/api/search`, `/api/products`, admin pages). **Do not assume the DB doesn't exist or that pages still run on mock data** — verify against `lib/db/schema.ts` and `lib/queries/` first. Remaining mock data (`lib/data/mock-products.ts`) is limited to non-catalog UI content (`valueProps`); it is not used for product data anymore.

**Auth is email-OTP based and deliberately purpose-agnostic.** There are exactly two endpoints — `POST /api/auth/request-otp` (issues a code; also creates the account when `name` is supplied for an unknown email) and `POST /api/auth/verify-otp` (consumes it and mints a session). One live code per email, enforced by `email` being the primary key of `otp_codes` (`lib/auth/otp.ts`). **Don't reintroduce per-purpose codes** (`login:` / `register:` identifiers): that design let two valid codes coexist behind two identical-looking emails and made users see "kedaluwarsa" for perfectly fresh codes. `verification_tokens` is a separate table used only for admin invitation links — OTPs must not go back in there, since its globally-unique `token` column can't safely hold 6-digit values. Rate limiting (`lib/auth/rate-limit.ts`) is DB-backed via the `rate_limits` table and its functions are **async** — an in-memory Map was useless here because each serverless instance kept its own counter. `lib/auth/password.ts` (PBKDF2) is unused. NextAuth was removed entirely (the project uses custom `jose` JWT sessions); don't reintroduce it.

The wireframes (`docs/wireframes/`) were deleted and are no longer used — **the live code under `app/` and `components/` is the source of truth for UI/layout.** Match existing patterns there when building new pages rather than inventing new layouts.

The planning docs (`docs/sandwich/`) were deleted earlier but have since been **regenerated (2026-07-12) via the sandwich pipeline's `/order` step, run against `docs/RFP-COMPLETION.md`/`RFP-SUMMARY.md`** — they're current and reflect the actual codebase (correctly note e.g. that `lib/db` doesn't exist), and are now the primary planning reference:

- `docs/sandwich/prd.md` — modules/features with confidence tags (`[stated]`/`[inferred]`/`[assumed]`); check a feature's tag before assuming scope
- `docs/sandwich/technical-notes.md` — stack + architecture rationale, **supersedes `SPEC.md` on auth**: documents custom JWT/`jose`-based sessions, not NextAuth v5 — plus a Risks section
- `docs/sandwich/client-questions.md` — currently 0 open questions (previously-open ones were resolved when `/order` was re-run in "answer" mode)
- `docs/sandwich/user-flows.md` — step-by-step actor flows (UF-xxx)
- Note: `docs/sandwich/feature-queue.md` and `specs/` do **not** exist — the `/prep` step hasn't been run against this regenerated order yet, so there's no prioritized backlog/per-feature specs currently

Also still useful: `SPEC.md` (full technical spec — architecture sections still broadly valid, but defer to `technical-notes.md` above on auth) and `docs/superpowers/specs/`/`plans/` (per-page design specs and implementation plans from past UI build sessions, e.g. checkout flow, search page, PDP).

## Commands

Package manager is **pnpm** (`pnpm-workspace.yaml` + `pnpm-lock.yaml` present — don't use npm/yarn).

```bash
pnpm dev      # start dev server (localhost:3000)
pnpm build    # production build
pnpm start    # run production build
pnpm lint     # eslint (flat config: eslint.config.mjs)
pnpm test     # vitest (watch)
pnpm test:run # vitest (single run)
```

Vitest is configured (`vitest.config.ts`), but coverage is thin — currently only `lib/auth/otp.test.ts`.

## UI conventions

All UI copy is in **Bahasa Indonesia** — match that in any new pages/components. Storefront pages live under `app/(store)/` (homepage, `produk` PLP/PDP — which also handles search and category/sale/diving-type filtering via query params, e.g. `/produk?q=`, `/produk?onSale=true`, `/produk?divingType=freediving`, `/produk?category=aksesoris` — cart, checkout, account) and the admin panel under `app/admin/` (dashboard, products, orders, customers, banners, settings). `/sale`, `/freediving`, `/scuba`, `/aksesoris`, `/search` are legacy routes that now just redirect to the equivalent `/produk?...` URL (see `next.config.ts` `redirects()` and `app/(store)/search/page.tsx`) — don't recreate them as standalone pages. Some wireframed sections aren't built yet (wishlist, contact/FAQ, legal pages, admin promotions/inventory/reports) — check `app/` and `app/admin/` directly for what exists before assuming a page is missing.

## Target Architecture (per `docs/sandwich/technical-notes.md`, architecture sections cross-checked against `SPEC.md`)

**Stack:** Next.js (App Router) + TypeScript strict, Tailwind CSS v4, Drizzle ORM + PostgreSQL (Neon serverless), Zod, custom JWT auth via `jose` (HTTP-only cookie sessions, role-based access — **not** NextAuth v5, despite what `SPEC.md` says), Midtrans (Indonesian payment gateway), React Hook Form + Zod resolver, Radix UI primitives, TanStack Query v5 (admin only), Mailgun (transactional email/OTP), Vercel Blob (product images), deployed on Vercel.

**Vertical slice + clean architecture:** each feature lives as a self-contained module under `features/` — this directory doesn't exist yet since only UI has been built so far (current code is flat under `app/`, `components/`, `lib/`); create it when backend wiring starts. Complex features (products, orders, payment) get full domain/application/presentation layering; simple features (banners, categories) stay presentation-only with direct DB queries — don't add layers speculatively. Domain layer is pure TypeScript with zero dependencies; application layer uses direct Drizzle queries (no repository pattern for plain CRUD); no infrastructure abstraction layer beyond the payment provider interface.

**Storefront vs Admin split** — this is the central architectural decision, don't blur it:
- **Storefront**: ISR + Server Components for SEO. Queries are direct function imports inside Server Components (no HTTP round-trip). Mutations go through Server Actions.
- **Admin**: CSR with TanStack Query. Admin data is served via Route Handlers (HTTP) for caching/parallelization, not direct Server Component queries.

**Money as integer cents**: all prices stored as `priceCents` (integer) in the DB to avoid float errors, converted to dollars/rupiah at API boundaries, formatted for display via a `formatCurrency` helper. Never store or compute prices as floats.

**Orders**: created atomically — order + orderItems + payment record in a single DB transaction, with an idempotency key to prevent duplicate orders from double form-submits. Status workflow: `pending_payment → processing → shipped → delivered`.

**Payment**: `PaymentProvider` interface abstracts Midtrans so it's swappable (e.g. for Stripe/Xendit) without touching order logic. Webhook handler must verify the signature before updating order status.

**No inventory tracking** — explicitly dropped by the client; products use a single `isActive` availability flag instead of stock counts.
