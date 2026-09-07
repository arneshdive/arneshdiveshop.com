import { describe, it, expect } from 'vitest';
import {
  hasVariants,
  productImageUrl,
  toPublicImageUrl,
  variantPath,
  originalPath,
} from './product-image';

/** Where the catalogue was stored until the 2026-09-07 migration. */
const BLOB = 'https://duruwpeexnyc4tce.public.blob.vercel-storage.com';
/** Where it is served from now. Same paths — every object was copied verbatim. */
const CDN = 'https://file.arneshdiveshop.com';

// Shapes taken from rows actually present in the catalogue. These are still
// what `products.images` holds: the migration copied bytes and rewrote no rows.
const LEGACY = [
  `${BLOB}/products/1786953414893-px4ard.jpg`,
  `${BLOB}/products/1784124485399-h2hdt6.png`,
  `${BLOB}/products/1787733342543-c3bosm.jpeg`,
  `${BLOB}/products/1784439448791-iss9iq.webp`,
];

const PIPELINE_MAIN = `${BLOB}/products/v2/1790000000000-abc123.webp`;

describe('product image resolution', () => {
  describe('host rewriting', () => {
    it('serves stored Blob URLs from the CDN, path untouched', () => {
      for (const url of LEGACY) {
        const rewritten = toPublicImageUrl(url);
        expect(rewritten).toBe(url.replace(BLOB, CDN));
        // The path is what makes the copy verifiable — it must survive exactly.
        expect(new URL(rewritten).pathname).toBe(new URL(url).pathname);
      }
    });

    it('leaves anything not on the old Blob host alone', () => {
      // Local assets, an already-rewritten URL, and an externally hosted brand
      // logo (brands.logoUrl is free text an admin types).
      for (const url of [
        '/hero-image.webp',
        `${CDN}/products/1786953414893-px4ard.jpg`,
        'https://cdn.example.com/logo.png',
      ]) {
        expect(toPublicImageUrl(url)).toBe(url);
      }
    });

    it('is idempotent', () => {
      const once = toPublicImageUrl(LEGACY[0]!);
      expect(toPublicImageUrl(once)).toBe(once);
    });
  });

  describe('legacy images keep their filename', () => {
    it.each(LEGACY)('never appends a variant suffix to %s', (url) => {
      // The point of this suite: legacy files have no siblings, so asking for a
      // smaller size must not invent a URL that 404s. Only the host may change.
      const expected = url.replace(BLOB, CDN);
      expect(productImageUrl(url, 'main')).toBe(expected);
      expect(productImageUrl(url, 'medium')).toBe(expected);
      expect(productImageUrl(url, 'thumb')).toBe(expected);
    });

    it('does not treat legacy paths as having variants', () => {
      for (const url of LEGACY) {
        expect(hasVariants(url)).toBe(false);
        expect(hasVariants(toPublicImageUrl(url))).toBe(false);
      }
    });

    // Both of these exist in public/. The assertion used to pin
    // /placeholder-product.jpg, which never existed — so the suite guaranteed
    // that a 404 was passed through faithfully.
    it('leaves local /public images alone', () => {
      expect(productImageUrl('/hero-image.webp', 'thumb')).toBe('/hero-image.webp');
      expect(productImageUrl('/instagram-1.jpg', 'medium')).toBe('/instagram-1.jpg');
    });
  });

  describe('pipeline images resolve to siblings', () => {
    it('recognises a main URL on either host', () => {
      expect(hasVariants(PIPELINE_MAIN)).toBe(true);
      expect(hasVariants(toPublicImageUrl(PIPELINE_MAIN))).toBe(true);
    });

    it('returns the main file on the CDN', () => {
      expect(productImageUrl(PIPELINE_MAIN, 'main')).toBe(PIPELINE_MAIN.replace(BLOB, CDN));
    });

    it('swaps in the medium and thumbnail siblings', () => {
      expect(productImageUrl(PIPELINE_MAIN, 'medium')).toBe(
        `${CDN}/products/v2/1790000000000-abc123-800.webp`,
      );
      expect(productImageUrl(PIPELINE_MAIN, 'thumb')).toBe(
        `${CDN}/products/v2/1790000000000-abc123-400.webp`,
      );
    });

    it('never double-suffixes when handed a variant URL', () => {
      const medium = `${BLOB}/products/v2/1790000000000-abc123-800.webp`;
      expect(hasVariants(medium)).toBe(false);
      expect(productImageUrl(medium, 'thumb')).toBe(medium.replace(BLOB, CDN));
    });

    it('does not treat the kept original as a variant source', () => {
      const original = `${BLOB}/products/v2/1790000000000-abc123-original.webp`;
      expect(hasVariants(original)).toBe(false);
      expect(productImageUrl(original, 'thumb')).toBe(original.replace(BLOB, CDN));
    });
  });

  describe('empty input', () => {
    it('returns undefined rather than a broken URL', () => {
      expect(productImageUrl(undefined, 'thumb')).toBeUndefined();
      expect(productImageUrl(null, 'main')).toBeUndefined();
      expect(productImageUrl('', 'medium')).toBeUndefined();
    });
  });

  describe('upload paths', () => {
    it('builds variant paths the resolver can read back', () => {
      expect(variantPath('base-1', 'main')).toBe('products/v2/base-1.webp');
      expect(variantPath('base-1', 'medium')).toBe('products/v2/base-1-800.webp');
      expect(variantPath('base-1', 'thumb')).toBe('products/v2/base-1-400.webp');
    });

    it('round-trips: a written main path resolves to the written siblings', () => {
      // New uploads are stored on the CDN host directly, so this is the shape
      // the resolver will see from here on.
      const main = `${CDN}/${variantPath('base-1', 'main')}`;
      expect(productImageUrl(main, 'medium')).toBe(`${CDN}/${variantPath('base-1', 'medium')}`);
      expect(productImageUrl(main, 'thumb')).toBe(`${CDN}/${variantPath('base-1', 'thumb')}`);
    });

    it('keeps the original under the same base', () => {
      expect(originalPath('base-1', 'heic')).toBe('products/v2/base-1-original.heic');
    });
  });
});
