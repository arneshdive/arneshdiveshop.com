# TODO: Backfill resized variants for legacy product images

**Status:** deferred, 2026-08-26. Nothing is broken without it — this is a page-weight optimisation.

## What the situation is

Images uploaded from 2026-08-26 onwards are downscaled in the browser into three
WebP sizes (2000/800/400px) and stored under `products/v2/`. See
`lib/utils/image-resize.ts` and `lib/utils/product-image.ts`.

The 780 images uploaded before that have no variants. They are served at full
size everywhere — a product card downloads the same file the gallery does.
`productImageUrl()` falls back to returning legacy URLs unchanged, so nothing
misbehaves; the pages are just heavier than they need to be.

Measured on production, 2026-08-26:

| Page | Now | With variants |
| --- | --- | --- |
| `/produk` (48 images) | 2,586 KB | ~1,400 KB |
| A legacy PDP (13 images) | 784 KB | ~216 KB |

Size distribution of the 780 legacy files (102.9 MB total, 135 KB average):

| Size | Files |
| --- | --- |
| under 50 KB | 277 |
| 50–150 KB | 314 |
| 150–400 KB | 153 |
| over 400 KB | 36 (largest 2.4 MB) |

Only the 189 files above 150 KB carry most of the weight. The 277 smallest would
barely change if processed, so they are not worth including.

## The hard constraint

**Uploaded images must never be written to or deleted.** The shop cannot
re-upload them; a mistake there is unrecoverable. Any backfill only ever
*reads* the originals and *writes new files at new paths*. `@vercel/blob`'s
`put()` defaults to `allowOverwrite: false` — keep it that way, and pass it
explicitly, so an existing object cannot be clobbered even by a buggy script.

Before and after any run, snapshot every image URL's `etag` and
`content-length` and diff them. That check has been run repeatedly during this
work and has always come back 0 differences across all 780 files.

## Why this needs a database column, unlike new uploads

New uploads need no schema change because the path itself says whether variants
exist: anything under `products/v2/` has siblings. Legacy files live at
`products/<name>.jpg`, so that trick does not extend to them — there is no way
to tell from the URL whether a backfilled sibling exists.

**Design decision to make before writing any code:** store the new column as an
*ordered array*, not a URL→URL map.

`products.images` carries the display order — the first entry is the primary
image. A lookup table keyed by original URL cannot express that, which would
leave `products.images` permanently required and the two columns entangled
forever. An ordered array of `{ main, medium, thumb }` can eventually replace
`products.images` outright.

Fallback stays as it is today: when the new column is missing or short for a
product, fall back to `products.images`. That keeps partial completion safe —
the script can stop at any point and every product still renders.

Rollback is emptying the new column. The originals and `products.images` are
never modified, so nothing needs restoring.

## Do not delete the originals afterwards

Considered and rejected on 2026-08-26:

- Irreversible, and the client cannot re-upload.
- The variants are lossy 2000px derivatives. Deleting the originals makes them
  the permanent master — regenerating at a larger size or a future format
  becomes impossible.
- The saving is about 103 MB, which is negligible against the storage tier.
- Links shared to WhatsApp/Instagram, Google image results and bookmarks point
  at those URLs and would break invisibly.

Storage does show more than the 103 MB products reference (240 MB at the time of
writing). The difference is likely images belonging to soft-deleted products,
plus uploads whose product was never saved. Orphaned files are a far safer
cleanup target than product images, but each would still need checking against
`products.images` first — including soft-deleted rows.

## Rough shape of the work

1. Add a nullable `imageVariants` column to `products` (ordered array). Leave
   `images` untouched.
2. Teach `productImageUrl()` to read the column when present, keeping the
   existing legacy fallback and the guarantees pinned by
   `lib/utils/product-image.test.ts`.
3. Write a resumable script: for each legacy image over 150 KB, download it,
   generate the three sizes, upload them to new paths, and record them. It must
   be safe to re-run and to interrupt.
4. Sharp was removed from the project deliberately (its native binary never
   loaded on Vercel), so a backfill script would need its own image processing —
   run it locally as a one-off rather than adding the dependency back to the
   deployed app.

## Why it was deferred

The catalogue is not in bad shape: over a third of the files are already under
50 KB, and the pages load acceptably. Backfilling adds a second way of resolving
variants that has to be maintained forever, for a moderate gain. Legacy images
also migrate to the new format on their own as products get edited and their
photos re-uploaded.

Worth revisiting if the catalogue grows a lot, if page weight becomes a
complaint, or if a redesign puts more images on screen at once.
