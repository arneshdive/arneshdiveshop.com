import { describe, it, expect } from 'vitest';
import { computeProductPriceDisplay } from './product-pricing';

/**
 * Intl.NumberFormat('id-ID') uses non-breaking spaces (U+00A0)
 * between the currency symbol and the number. This helper normalizes
 * those to regular spaces so test assertions are readable.
 */
function nbsp(str: string): string {
  return str.replace(/\u00A0/g, ' ');
}
const rp = (s: string) => nbsp(s);

describe('computeProductPriceDisplay', () => {
  // ── Non-variant products ──────────────────────────────────────────

  it('uses base priceCents when no variants exist', () => {
    const result = computeProductPriceDisplay({
      priceCents: 85000000,
      compareAtPriceCents: null,
      variants: [],
    });

    expect(rp(result.priceDisplay)).toBe('Rp 850.000');
    expect(result.priceRangeMin).toBeUndefined();
    expect(result.priceRangeMax).toBeUndefined();
    expect(result.compareAtPriceDisplay).toBeUndefined();
    expect(result.hasDiscount).toBe(false);
  });

  it('shows compare-at price when discount is active (non-variant)', () => {
    const result = computeProductPriceDisplay({
      priceCents: 50000000,
      compareAtPriceCents: 75000000,
      variants: [],
    });

    expect(rp(result.priceDisplay)).toBe('Rp 500.000');
    expect(result.compareAtPriceDisplay).toBeDefined();
    expect(rp(result.compareAtPriceDisplay!)).toBe('Rp 750.000');
    expect(result.hasDiscount).toBe(true);
  });

  it('ignores compare-at price when it is NOT higher than base (non-variant)', () => {
    const result = computeProductPriceDisplay({
      priceCents: 75000000,
      compareAtPriceCents: 50000000,
      variants: [],
    });

    expect(rp(result.priceDisplay)).toBe('Rp 750.000');
    expect(result.compareAtPriceDisplay).toBeUndefined();
    expect(result.hasDiscount).toBe(false);
  });

  it('falls back to Rp 0 for zero priceCents without variants', () => {
    const result = computeProductPriceDisplay({
      priceCents: 0,
      compareAtPriceCents: null,
      variants: [],
    });

    expect(rp(result.priceDisplay)).toBe('Rp 0');
    expect(result.priceRangeMin).toBeUndefined();
    expect(result.priceRangeMax).toBeUndefined();
  });

  // ── Variant products — prices only on variants ───────────────────

  it('uses the lowest active variant price when base priceCents is 0', () => {
    const result = computeProductPriceDisplay({
      priceCents: 0,
      compareAtPriceCents: null,
      variants: [
        { isActive: true, priceCents: 25000000 },
        { isActive: true, priceCents: 40000000 },
        { isActive: true, priceCents: 32000000 },
      ],
    });

    // Should show the minimum variant price, NOT Rp 0
    expect(rp(result.priceDisplay)).toBe('Rp 250.000');
    expect(result.priceRangeMin).toBe(25000000);
    expect(result.priceRangeMax).toBe(40000000);
  });

  it('ignores inactive variants when computing price range', () => {
    const result = computeProductPriceDisplay({
      priceCents: 0,
      compareAtPriceCents: null,
      variants: [
        { isActive: true, priceCents: 50000000 },
        { isActive: false, priceCents: 1000000 },
      ],
    });

    expect(rp(result.priceDisplay)).toBe('Rp 500.000');
    expect(result.priceRangeMin).toBe(50000000);
    expect(result.priceRangeMax).toBe(50000000);
  });

  it('ignores variants with null priceCents (inherit from base)', () => {
    const result = computeProductPriceDisplay({
      priceCents: 0,
      compareAtPriceCents: null,
      variants: [
        { isActive: true, priceCents: 35000000 },
        { isActive: true, priceCents: null },
      ],
    });

    expect(rp(result.priceDisplay)).toBe('Rp 350.000');
    expect(result.priceRangeMin).toBe(35000000);
    expect(result.priceRangeMax).toBe(35000000);
  });

  // ── Variant products — base price has a meaningful value ─────────

  it('includes base price in range when it is > 0 alongside variant prices', () => {
    const result = computeProductPriceDisplay({
      priceCents: 20000000,
      compareAtPriceCents: null,
      variants: [
        { isActive: true, priceCents: 25000000 },
        { isActive: true, priceCents: 40000000 },
      ],
    });

    expect(rp(result.priceDisplay)).toBe('Rp 200.000');
    expect(result.priceRangeMin).toBe(20000000);
    expect(result.priceRangeMax).toBe(40000000);
  });

  // ── Discount logic with variants ─────────────────────────────────

  it('shows compare-at price for variant products when compareAt > effective price', () => {
    const result = computeProductPriceDisplay({
      priceCents: 0,
      compareAtPriceCents: 100000000,
      variants: [
        { isActive: true, priceCents: 75000000 },
      ],
    });

    // Discount: compareAtCents (100000000) > effectiveMin (75000000) → discount
    expect(rp(result.priceDisplay)).toBe('Rp 750.000');
    expect(result.compareAtPriceDisplay).toBeDefined();
    expect(rp(result.compareAtPriceDisplay!)).toBe('Rp 1.000.000');
    expect(result.hasDiscount).toBe(true);
  });
});
