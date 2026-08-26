import { describe, it, expect } from 'vitest';
import {
  hasVariants,
  productImageUrl,
  variantPath,
  originalPath,
} from './product-image';

const BLOB = 'https://duruwpeexnyc4tce.public.blob.vercel-storage.com';

// Shapes taken from rows actually present in the catalogue.
const LEGACY = [
  `${BLOB}/products/1786953414893-px4ard.jpg`,
  `${BLOB}/products/1784124485399-h2hdt6.png`,
  `${BLOB}/products/1787733342543-c3bosm.jpeg`,
  `${BLOB}/products/1784439448791-iss9iq.webp`,
];

const PIPELINE_MAIN = `${BLOB}/products/v2/1790000000000-abc123.webp`;

describe('product image resolution', () => {
  describe('legacy images are never rewritten', () => {
    it.each(LEGACY)('passes %s through untouched for every size', (url) => {
      expect(productImageUrl(url, 'main')).toBe(url);
      expect(productImageUrl(url, 'medium')).toBe(url);
      expect(productImageUrl(url, 'thumb')).toBe(url);
    });

    it('does not treat legacy paths as having variants', () => {
      for (const url of LEGACY) {
        expect(hasVariants(url)).toBe(false);
      }
    });

    it('leaves local /public images alone', () => {
      expect(productImageUrl('/hero-image.webp', 'thumb')).toBe('/hero-image.webp');
      expect(productImageUrl('/placeholder-product.jpg', 'medium')).toBe(
        '/placeholder-product.jpg',
      );
    });
  });

  describe('pipeline images resolve to siblings', () => {
    it('recognises a main URL', () => {
      expect(hasVariants(PIPELINE_MAIN)).toBe(true);
    });

    it('returns the main file unchanged', () => {
      expect(productImageUrl(PIPELINE_MAIN, 'main')).toBe(PIPELINE_MAIN);
    });

    it('swaps in the medium and thumbnail siblings', () => {
      expect(productImageUrl(PIPELINE_MAIN, 'medium')).toBe(
        `${BLOB}/products/v2/1790000000000-abc123-800.webp`,
      );
      expect(productImageUrl(PIPELINE_MAIN, 'thumb')).toBe(
        `${BLOB}/products/v2/1790000000000-abc123-400.webp`,
      );
    });

    it('never double-suffixes when handed a variant URL', () => {
      const medium = `${BLOB}/products/v2/1790000000000-abc123-800.webp`;
      expect(hasVariants(medium)).toBe(false);
      expect(productImageUrl(medium, 'thumb')).toBe(medium);
    });

    it('does not treat the kept original as a variant source', () => {
      const original = `${BLOB}/products/v2/1790000000000-abc123-original.webp`;
      expect(hasVariants(original)).toBe(false);
      expect(productImageUrl(original, 'thumb')).toBe(original);
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
      const main = `${BLOB}/${variantPath('base-1', 'main')}`;
      expect(productImageUrl(main, 'medium')).toBe(
        `${BLOB}/${variantPath('base-1', 'medium')}`,
      );
      expect(productImageUrl(main, 'thumb')).toBe(
        `${BLOB}/${variantPath('base-1', 'thumb')}`,
      );
    });

    it('keeps the original under the same base', () => {
      expect(originalPath('base-1', 'heic')).toBe('products/v2/base-1-original.heic');
    });
  });
});
