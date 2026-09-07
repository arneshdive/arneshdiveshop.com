# Image pipeline hardening

**Date:** 2026-09-07
**Trigger:** production incident — most product images returned `403` for hours.

## What actually happened

Vercel Blob's free-tier **"Blob Simple Operations" quota (10,000/month) was exhausted**, and
Vercel responds to that by refusing *every* read on the store. Confirmed empirically:

- the reported image URL returned `403`
- a deliberately nonexistent path **also** returned `403` (a missing file returns `404`, so this
  was store-wide throttling, not a broken file)
- authenticated `head()`/`list()` through the SDK still worked, but fetching the **bytes** was
  refused even with an `Authorization` header — so the block is specifically on content reads
- after the plan was upgraded, the same URL returned `200` and the nonexistent path returned `404`

Images that still rendered during the incident were being served from a CDN edge that already had
them; every cache miss failed. That is why it looked like "most, but not all" images broke.

### Two things I got wrong early, corrected here

1. I claimed there was no caching because I saw `cache-control: public, max-age=0, must-revalidate`.
   **That header came from the 403 error response, not from the image.** The real objects serve with
   `max-age=2592000` (30 days), which is the `@vercel/blob` SDK default. Caching was never the
   root cause.
2. The `Image Optimization – Transformations 4.6K/5K` figure on the dashboard is **residual usage
   from before 2026-08-26**, when `images.unoptimized: true` landed (commit `a50b6a0`). The only
   remaining image generator, `app/opengraph-image.tsx`, is fully static — no dynamic data, no
   params — so it is built once per deploy. The optimizer is genuinely off.

## Root cause: the admin panel, not customer traffic

The shop has no customers yet, which made 10,000 operations look impossible. The audits found where
they went.

**`productImageUrl()` is called in exactly two files in the entire project** —
`components/product/product-card.tsx` and `components/product/product-gallery.tsx`. Every other
render site requests the raw stored URL, which is the **2000px master**.

| Driver | Evidence | Cost |
| --- | --- | --- |
| `/admin/products` has **no pagination and no limit** | `components/admin/products-page-content.tsx:63-71` never sets `limit`; `app/api/products/route.ts:40-55` doesn't read one; `lib/queries/products.ts:372` passes `limit: undefined` → Drizzle emits no `LIMIT` | one 2000px image **per active product** (132+), every single page view |
| Uploader re-fetches from storage right after upload | `components/admin/product-form/image-uploader.tsx:207-211` swaps the in-memory `blob:` URL for the remote 2000px URL 500ms after success | up to 30 full-size downloads per upload session, for bytes the browser already had |
| Every mutation invalidates the whole unpaginated list | `products-page-content.tsx:106`, `app/admin/products/[id]/page.tsx:110` | full refetch after each edit/delete |
| 11 render sites request `main` for thumbnails 24–144px wide | see table below | ~25× more pixels than displayed |

Building the catalogue through this admin, over days, is the main driver. But see the measured
baseline below before trusting any single-cause story — the CDN data complicates it.

## Measured baseline (2026-09-07, production)

Everything here is measured, not inferred. Inferences are labelled.

**Catalogue composition — this reorders the whole plan:**

| | count | share |
| --- | --- | --- |
| total products | 197 | |
| products with images | 195 | |
| total stored image URLs | 973 | |
| on the `products/v2/` pipeline | **80** | **8.2%** |
| legacy (`products/<ts>-<rand>.jpg\|png`) | 887 | 91.2% |
| local `/public` paths | 6 | 0.6% |

The database stores **only the main URL** — zero stored URLs contain `-800`/`-400`. Variants are
derived at render time. All 12 sampled v2 mains had both siblings live; legacy files have no
siblings (confirmed 404), which is why the resolver's legacy passthrough is load-bearing.

**Consequence: Phase 2 below only affects 8.2% of images.** It is still correct — it prevents the
bug recurring as the catalogue migrates, and it is nearly free — but it is not the big win. The
legacy backfill is.

**Caching works. It was never the problem.** Three consecutive `curl -I` per URL, 6/6 URLs:
`MISS → HIT → HIT`, `age` incrementing 1:1 with wall clock (40s → 101s → 221s). All objects serve
`cache-control: public, max-age=2592000` (30 days). Conditional requests behave correctly: a correct
`If-None-Match` returns `304` with 0 bytes. So repeat requests do **not** reach the origin; one fill
per edge POP covers 30 days. There are ~1,127 distinct objects (887 legacy + 80 v2 × 3 variants),
so a cold fill of the whole catalogue is ~1,127 operations per POP before any other traffic.

Two headers are absent (inferred consequence, not measured): no `immutable`, so browsers may
revalidate on reload despite the content being immutable by policy; and no `s-maxage` /
`stale-while-revalidate`.

**`last-modified` is the CDN fill time, not the upload time** — a file whose filename epoch decodes
to 2026-08-26 reported `last-modified` matching the moment of the probe request. **`etag` is the only
trustworthy validator here.** This directly constrains the deferred migration: verify copies by
etag/MD5, never by `last-modified`.

**Page weight, `/produk` (24 cards, 48 images):**

| group | n | total | avg | median |
| --- | --- | --- | --- | --- |
| legacy, as-stored | 22 | 1,279,144 B | 58,142 | 47,626 |
| v2 `-800` | 26 | 410,842 B | 15,801 | 15,433 |

**Total 1.61 MB per page view. The 22 legacy images are 46% of the files but 76% of the bytes.**
Inferred: backfilling them at the observed `-800` average would take the page to roughly 758 KB, a
~55% reduction. Confirmed live: 0 occurrences of `_next/image` and 0 `srcset`, so
`images.unoptimized` is genuinely in effect in production.

**Separate finding, not image-related but it explains the Function Invocation and Fluid CPU figures
on the dashboard:** `/produk` HTML is **completely uncached** — `cache-control: private, no-cache,
no-store, max-age=0, must-revalidate` and `x-vercel-cache: MISS` on three consecutive requests. Every
single page view runs a full server render and its database queries. `CLAUDE.md` specifies "Storefront:
ISR + Server Components for SEO". That is not what is deployed. Root cause not investigated — needs
its own look.

**Attribution honesty:** with a working CDN absorbing repeats, the 10,000 operations cannot be
pinned on one cause with confidence. The credible contributors, in rough order: cold fills across
~1,127 objects and multiple edge POPs; the unpaginated admin list pulling 195 full-size mains that
the storefront never requests (so they need their own fills); the post-upload refetch storm (up to 30
per session); and `put()` operations during catalogue building, including the orphans implied by the
240 MB-stored vs 103 MB-referenced gap. Do not present a single-cause narrative.

## The actual goal (corrected 2026-09-07, after checking with the owner)

I originally sequenced this plan around "don't hit the quota again" and filed the R2 migration as
deferred and out of scope. **That was wrong.** The owner's goals, in their priority order:

1. Tidy up every render path.
2. **Stop depending on Vercel Blob.**
3. Above all: **the client must never re-upload, and no image may ever be lost.**

Goal 2 makes the migration the centre of this work, not an appendix. Decisions confirmed with the
owner: **Vercel Blob is kept as a permanent archive and is never deleted**, even once R2 serves all
traffic (244 MB of storage is a rounding error against the risk). There is **no deadline pressure** —
the Pro trial has room, so every step gets full verification rather than being compressed.

### Consequence: the backfill and the migration are one operation, not two

The deferred legacy backfill and the R2 migration both require reading every legacy object once.
Running them separately would read everything twice and, worse, write thousands of new variant files
**into the storage we are trying to leave**. So it is a single pass:

> read each legacy image once → generate its variants → write all of them straight to R2

After that pass, **not one new byte is ever written to Vercel Blob again**.

### Consequence: no database writes at all

`docs/TODO-image-backfill.md` proposed a new `imageVariants` column, because legacy paths
(`products/<base>.jpg`) cannot encode which variants exist the way `products/v2/` does. Writing to R2
fresh removes that constraint — we choose the convention, so the mapping becomes **deterministic**:

```
Blob   products/1786953414893-px4ard.jpg
R2     products/v3/1786953414893-px4ard.webp   (+ -800.webp, -400.webp)
```

The base name carries over. The Blob→R2 rewrite is then applied **in the query layer**
(`lib/queries/products.ts`), at the data boundary, not at the 11 render sites and not in the database.

This is strictly safer than the column approach:

| Property | How it is guaranteed |
| --- | --- |
| `products.images` is never `UPDATE`d | The rewrite happens on read. The column is never written by any part of this work. |
| Partial completion is safe | A URL absent from the migration manifest falls through to its original Blob URL. At 10% or 90% done, every product renders. |
| The manifest is a closed, finite set | It only ever covers the 973 pre-migration URLs. New uploads write their R2 URL straight into `products.images`, so they never need an entry. |
| No client bundle cost | Resolution is server-side in the query layer; the manifest never reaches the browser. |
| Rollback | Turn off one flag. Nothing was mutated, so nothing needs restoring. |
| No image can be lost | Blob keeps every original forever. Copies are verified per object by **etag/MD5** — never by `last-modified`, which is measurably the CDN fill time here. |

This composes cleanly with Phase 2: the query layer decides *which storage host and base*, and
`productImageUrl()` decides *which variant*. Two orthogonal concerns, neither aware of the other.

### Note on generating the legacy variants

Legacy files have no siblings, so the pass must re-encode them. `sharp` was removed from this project
because its native binary never loaded **on Vercel** — locally it is fine. Install it as a
dev-only dependency for the one-off script, exactly as `docs/TODO-image-backfill.md:98-101` already
suggests. It must never become a dependency of the deployed app.

## Revised priority order

1. **Phase A — read-path tidy** (Phases 1, 2, 3 below). Safe, no storage involvement, already in
   progress. Also the prerequisite for judging real traffic later.
2. **Phase B — storage abstraction** (`lib/storage/`), so the provider is swappable behind an
   interface. Mirrors the existing `PaymentProvider` decision in `CLAUDE.md`'s architecture, and is
   the structural answer to "never be locked to one provider again".
3. **Phase C — new uploads go to R2.** Until this lands, every new product deepens the dependency
   being removed.
4. **Phase D — the single migration pass** (read legacy once → variants → R2) + query-layer rewrite
   behind a flag. Gets its own review before it runs.
5. **Phase E — guardrails** (Phase 5 below) and observability (Phase 6 below).
6. **Storefront ISR** — out of scope here, but it is the largest non-image cost measured and needs
   its own investigation.

Phase 4's `cacheControlMaxAge` work becomes moot once uploads move to R2 in Phase C; the rest of
Phase 4 (validation, the refetch storm, the object-URL leak, the stale closure) is storage-agnostic
and stands regardless.

## Hard constraints — non-negotiable

**The client will not re-upload images. There is no source copy outside Blob for the ~780
catalogue images.** Therefore:

- **Never** call `del()`, `copy()` onto an existing key, or `put()` with `allowOverwrite: true`.
- **Never** `UPDATE products.images` (or any column holding an image URL) in this work.
- **Never** write to an existing blob path. New files go to new paths only.
- Every phase below is **additive or read-only**. A phase that cannot satisfy that is quarantined
  into its own plan (see "Deferred").

### Why phases 1–5 cannot cause a re-upload

Re-upload risk exists only if bytes are destroyed or the URL→bytes mapping is lost. Phases 1–5
delete nothing, overwrite nothing, and never write to the database. They change **which URL string
is requested at render time** and **what options new uploads pass**. The worst possible failure is a
wrong URL producing a broken image, which reverts with a `git revert`. The stored objects are
untouched throughout.

---

## Phase 1 — Resilience: never show a broken glyph again

Ships **before** phase 2 so a safety net exists prior to any URL change.

**The declared fallback does not exist.** `/placeholder-product.jpg` is referenced at
`components/product/product-card.tsx:92,105`, `components/product/product-gallery.tsx:17,18,26,51`,
and `app/(store)/produk/[slug]/page.tsx:123,124` — and there is **no such file in `public/`**
(verified). `lib/utils/product-image.test.ts:37` asserts the resolver passes this dead path through
unchanged, so the test suite pins a 404. Products with no images have been rendering broken icons
this whole time, independent of the incident.

There is **no `onError`, `placeholder`, or `blurDataURL` anywhere** in `app/` or `components/` — the
only `onError` matches are TanStack mutation callbacks.

Meanwhile a *good* fallback already exists and is used consistently for the **absent-image** case:
the `solar:box-linear` Iconify glyph in `components/cart/cart-item.tsx:45-47`,
`components/cart/order-summary.tsx:98-100`,
`components/checkout/order-summary-card.tsx:49-51`,
`app/(store)/account/orders/page.tsx:249-251`,
`app/(store)/account/orders/[id]/page.tsx:354-356`,
`app/(store)/checkout/success/checkout-success-content.tsx:294`.

**Work:**

1. Retire the dead `/placeholder-product.jpg` path. Route those sites to the same Iconify fallback
   used by the cart, rather than introducing a new binary asset — one fallback pattern for the whole
   codebase.
2. Add an `onError` handler at every image render site that flips into that existing fallback
   branch, so a URL that exists but fails to fetch degrades exactly like a missing URL.
3. Update `lib/utils/product-image.test.ts:37` so it no longer pins a nonexistent asset.

**Verification:** with the network blocked for the blob host, every page renders placeholders and no
broken glyphs.

## Phase 2 — Request the right variant

`productImageUrl(url, size)` is already correct and already tested; it is simply not called. It
returns legacy URLs **unchanged**, so calling it on a legacy image is a safe no-op. For a
`products/v2/` URL the siblings are guaranteed to exist: all three `put()` calls happen in one
request, and a partial failure returns 500 without ever storing the main URL — so any v2 URL present
in `products.images` implies all three variants were written.

| file:line | box size | now | change to |
| --- | --- | --- | --- |
| `components/cart/order-summary.tsx:90` | 48px | `main` 2000px | `thumb` |
| `components/checkout/order-summary-card.tsx:41` | 48px | `main` 2000px | `thumb` |
| `components/cart/cart-item.tsx:38` | 96–144px | `main` 2000px | `thumb` |
| `app/(store)/account/orders/page.tsx:241` | 80px, ×3 per order | `main` 2000px | `thumb` |
| `app/(store)/account/orders/[id]/page.tsx:346` | 80×96px | `main` 2000px | `thumb` |
| `app/(store)/checkout/success/checkout-success-content.tsx:286` | 64×80px | `main` 2000px | `thumb` |
| `components/admin/products-page-content.tsx:187` | 64–80px | `main` 2000px | `thumb` |
| `components/admin/orders/order-detail.tsx:479` | 48px | `main` 2000px | `thumb` |
| `components/admin/product-form/product-preview.tsx:75` | 320px | `main` 2000px | `medium` |
| `components/admin/product-form/product-preview.tsx:109` | 48px ×4 | `main` 2000px | `thumb` |
| `components/admin/product-form/image-uploader.tsx:349` | ~100–200px | `main` 2000px | `thumb` |

`thumb` is 400px, correct even at 3× DPR for a 144px box.

`components/cart/order-summary.tsx:68` and `components/checkout/order-summary-card.tsx:21` are the
**same duplicated `getItemImage` helper** — two rows above collapse into one fix.

**Deliberately unchanged:**

- `components/product/product-gallery.tsx:26` keeps `main`. The box is ~646px, which wants ~1292px
  at 2× DPR; there is no 1200px variant to step down to, so `medium` (800px) would be a retina
  regression. This is the one justified use of `main`.
- `components/product/product-card.tsx:91,102` keep `medium`. Correct for a ~318px desktop card at
  2× DPR.

**Also in scope — halve card payload:** both the primary and the hover image sit in the DOM inside
one slider (`product-card.tsx:88`), so lazy loading does not defer the hover image; every visible
card downloads **two** 800px files. Defer the secondary image until hover.

**Latent landmine to fix while here:** `components/product/product-card.tsx:188` renders variant
swatches as a CSS `background-image` at 24×24px from the `main` 2000px URL — and CSS backgrounds get
no `next/image` lazy loading. Nothing populates `product.swatches` today, so it costs nothing yet;
it becomes a 2000px-per-swatch bug the moment swatches are wired up.

## Phase 3 — Cap the admin product list

The single largest driver. `/admin/products` currently renders every active product.

**Work:** the admin caller passes an explicit `limit` and gains pagination.

**Critical constraint:** do **not** change the default in `lib/queries/products.ts`. `getProducts`
is shared with the storefront, which passes its own limit (`app/(store)/produk/page.tsx:10` caps at
24). Changing a shared default to fix one caller is how the storefront breaks. The admin route/page
supplies the limit; the query layer's behaviour for existing callers stays byte-identical.

Also narrow the mutation invalidations at `products-page-content.tsx:106` and
`app/admin/products/[id]/page.tsx:110` so an edit does not refetch the entire catalogue.

## Phase 4 — Harden the upload path (affects new uploads only)

1. **Pass `cacheControlMaxAge` explicitly** in both `put()` calls (`app/api/upload/route.ts:64,115`).
   The SDK default (30 days) is currently inherited by accident; paths are content-unique and never
   rewritten, so this content is safely immutable and should say so rather than depend on an SDK
   default that can change under us.
2. **Stop the post-upload refetch.** Keep the in-memory `blob:` URL as the tile's `src` until the
   remote image has loaded (`image-uploader.tsx:207-211`). Up to 30 full-size downloads per session
   disappear.
3. **Fix the object-URL leak.** The success branch at `image-uploader.tsx:210` drops the entry
   without `URL.revokeObjectURL()`; the error path does revoke. The unmount cleanup at `:40-48` has a
   `[]` dep array, so it closes over an empty list and revokes nothing.
4. **Fix the slot-accounting stale closure** (`image-uploader.tsx:154-228`): `uploadingImages.length`
   is read at `:160` but omitted from the `useCallback` deps, so two quick drops compute
   `remainingSlots` against a stale count and the 30-image cap can be exceeded — writing blobs beyond
   the stated limit, which can never be cleaned up.
5. **Validate the variant path.** It currently checks only size, performs no MIME or magic-byte
   check, and hardcodes `contentType: 'image/webp'` (`route.ts:57-70`) — so an authenticated admin
   can store arbitrary bytes served as an image. The fallback path already validates properly
   (`route.ts:93-110`); bring the variant path up to parity.
6. **Remove the dead client branch** at `image-uploader.tsx:116-120`, which reads a `warning` field
   the route never returns.

**Correct a stale claim while here:** `lib/utils/product-image.ts:16` documents a
`products/v2/<base>-original.<ext>` object as "the untouched upload, kept as the source of truth",
and `originalPath()` exists and is unit-tested — **but the route never calls it and no original has
ever been stored.** Since the browser re-encodes to lossy 2000px WebP before upload, that 2000px
variant *is* the master for every post-2026-08-26 image. Fix the comment and
`docs/TODO-image-backfill.md:74-77`, which argues against deleting originals that do not exist.
Either start writing originals or stop claiming they exist — do not leave the docs lying.

## Phase 5 — Structural guardrail so this cannot regress

The defect was not that the resolver was wrong; it was that **nothing stopped anyone bypassing it**,
and the bypass is silent and invisible in review.

1. Add an ESLint `no-restricted-syntax` rule rejecting a raw `images[...]` member expression used
   directly as an image `src`, with a message pointing at `productImageUrl()`. Runs in `pnpm lint`.
2. Extend `lib/utils/product-image.test.ts` to pin the intended variant per surface, so a future
   change that swaps a thumbnail back to `main` fails a test rather than quietly costing money.

## Phase 6 — Observability (user action, outside the repo)

Nobody found out until images visibly broke. Configure Vercel usage alerts on Blob operations at
~50% and ~80% of quota. Without this, the next ceiling is discovered the same way.

---

## Phases B–D: getting off Vercel Blob

This is the goal, not an appendix — see "The actual goal" above. Credentials are in `.env` and
connectivity is verified: S3 `list` and `put` both succeed against bucket `arneshdive`, and the
public URL returned `200` for a test object (since deleted). Note the public URL is currently a
`pub-*.r2.dev` subdomain, which Cloudflare rate-limits and does not intend for production — a custom
domain is required before Phase D serves real traffic.

**Scope of the copy, from the measured baseline:**

| Source | Objects to write to R2 | Work needed |
| --- | --- | --- |
| 80 v2 mains | 240 (3 variants each, already exist in Blob) | byte-for-byte copy, no re-encoding |
| 887 legacy files | ~2,661 (original + 2 generated variants) | re-encode locally with `sharp` |
| 6 local `/public` paths | 0 | not in Blob; leave alone |

**Rules the migration script must obey — these are not negotiable:**

1. Reads from Blob. Writes to R2. Writes a local manifest. **Nothing else.** No DB writes, no Blob
   writes, no deletes anywhere.
2. Resumable and safe to re-run: consult the manifest, skip anything already verified.
3. Verify every object after upload by comparing MD5 against the downloaded bytes (S3 returns the
   MD5 as the `ETag` for a non-multipart `PutObject`). A mismatch marks the entry failed, not done.
4. Never trust `last-modified` as a validator — measured to be the CDN fill time here, not the
   upload time.
5. Circuit-breaker: abort after 3 consecutive `403`/`429` from Blob rather than hammering a
   throttled store.
6. `sharp` stays a dev-only dependency, local runs only, never shipped.

**Ordering within Phase D:** copy and verify everything first, with the query-layer rewrite flag
**off**. Only flip the flag once the manifest shows every object verified. The flag is the entire
cutover, and turning it back off is the entire rollback.

### Settle this before Phase D runs

`lib/utils/product-image.ts:16` claims a `products/v2/<base>-original.<ext>` object is kept as "the
source of truth". **It has never been written** — `originalPath()` exists and is tested but is never
called (Phase 4 corrects the comment). So for every image uploaded since 2026-08-26, the lossy 2000px
WebP *is* the master, and there is nothing else to copy. This is settled: the migration copies the
three variants and nothing more. It also means the argument in
`docs/TODO-image-backfill.md:70-77` against deleting originals is about files that do not exist.

For the 887 legacy files, the stored file **is** the original — full-size, unprocessed. Those are the
real masters, and they are exactly what the permanent Blob archive protects.
