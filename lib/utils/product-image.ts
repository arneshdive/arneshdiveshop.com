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
 *   products/v2/<base>-original.<ext> untouched upload, kept as the source of truth
 */

export const VARIANT_DIR = 'products/v2';

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
 * Resolve a stored image URL to the best file for how it will be displayed.
 * Legacy images have no derivatives, so they come back unchanged.
 */
export function productImageUrl(
  url: string | undefined | null,
  size: ImageSize,
): string | undefined {
  if (!url) return undefined;
  if (size === 'main' || !hasVariants(url)) return url;
  return url.replace(/\.webp$/, `${SUFFIX[size]}.webp`);
}
