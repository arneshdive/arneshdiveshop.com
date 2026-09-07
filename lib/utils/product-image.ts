/**
 * Picking the right file for a product image.
 *
 * Images uploaded before the resizing pipeline existed are single files with
 * no derivatives, and they must keep working untouched — the shop's images
 * cannot be re-uploaded. So rather than recording variants in the database
 * (which would mean changing the product form payload and the save path, and
 * risking existing rows), which sizes exist is encoded in the path itself:
 * anything under `products/v2/` was produced by the pipeline and has
 * siblings, anything else is a legacy file and is served exactly as stored.
 *
 * Layout written by app/api/upload/route.ts:
 *   products/v2/<base>.webp           main, 2000px  <- the URL stored on the product
 *   products/v2/<base>-800.webp       medium
 *   products/v2/<base>-400.webp       thumbnail
 *
 * Note: The 2000px main variant IS the master copy for images uploaded after
 * 2026-08-26. The browser re-encodes to lossy WebP before upload, so we never
 * store a lossless original. The originalPath() function exists for future use
 * (e.g., if a backfill process starts storing unprocessed originals), but no
 * originals have ever been written to storage.
 */

export const VARIANT_DIR = 'products/v2';

/**
 * Where images used to live, and where they live now.
 *
 * Every object was copied from Blob to R2 byte for byte, at an identical path
 * (1,127 objects, each verified by MD5 against the source — see
 * lib/scripts/copy-images-to-r2.ts). Because the paths match, serving from R2
 * is a hostname swap and nothing else: `products.images` still holds the
 * original Blob URLs, and no row was ever rewritten.
 *
 * Doing the swap here rather than in the query layer covers URLs that never
 * pass through a query at all — the cart and the recently-viewed list are
 * persisted in the visitor's own browser with whatever host was current when
 * they were saved, and those entries would otherwise keep pointing at Blob
 * indefinitely.
 *
 * Reverting is `git revert` on this commit: the database is unchanged, and the
 * Blob objects are all still there. Blob is kept forever as the archive — the
 * catalogue cannot be re-uploaded, so its store must never be deleted.
 */
const LEGACY_IMAGE_HOST = 'duruwpeexnyc4tce.public.blob.vercel-storage.com';
const IMAGE_HOST = 'file.arneshdiveshop.com';

export type ImageSize = 'thumb' | 'medium' | 'main';

const SUFFIX: Record<ImageSize, string> = {
  thumb: '-400',
  medium: '-800',
  main: '',
};

/** Path (not URL) for one variant of a freshly uploaded image. */
export function variantPath(base: string, size: ImageSize): string {
  return `${VARIANT_DIR}/${base}${SUFFIX[size]}.webp`;
}

/** Path for the untouched upload, kept so derivatives can be regenerated later. */
export function originalPath(base: string, extension: string): string {
  return `${VARIANT_DIR}/${base}-original.${extension}`;
}

/** Whether this URL came from the resizing pipeline and therefore has siblings. */
export function hasVariants(url: string): boolean {
  return (
    url.includes(`/${VARIANT_DIR}/`) &&
    url.endsWith('.webp') &&
    // Guard against being handed a variant URL instead of the main one.
    !/-(?:400|800|original)\.webp$/.test(url)
  );
}

/**
 * Point a stored image URL at the host that serves it today.
 *
 * Only the one known Blob host is rewritten, and only the host — the path is
 * carried across untouched, because that is exactly what the copy did. Any
 * other URL (a `/public` asset, an externally hosted brand logo, an already
 * rewritten URL) is returned as-is.
 */
export function toPublicImageUrl(url: string): string {
  return url.includes(LEGACY_IMAGE_HOST)
    ? url.replace(LEGACY_IMAGE_HOST, IMAGE_HOST)
    : url;
}

/**
 * Resolve a stored image URL to the best file for how it will be displayed:
 * the right host, and the right size variant.
 *
 * Legacy images have no derivatives, so they keep their filename — but they
 * still get the current host, since they were copied too.
 */
export function productImageUrl(
  url: string | undefined | null,
  size: ImageSize,
): string | undefined {
  if (!url) return undefined;
  const hosted = toPublicImageUrl(url);
  if (size === 'main' || !hasVariants(hosted)) return hosted;
  return hosted.replace(/\.webp$/, `${SUFFIX[size]}.webp`);
}
