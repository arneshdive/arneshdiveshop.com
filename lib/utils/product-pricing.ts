import { formatRupiah } from './format';

export interface ProductPriceInput {
  priceCents: number;
  compareAtPriceCents: number | null;
  variants: Array<{ isActive: boolean; priceCents: number | null }>;
}

export interface ProductPriceDisplay {
  priceDisplay: string;
  priceRangeMin: number | undefined;
  priceRangeMax: number | undefined;
  compareAtPriceDisplay: string | undefined;
  hasDiscount: boolean;
}

/**
 * Compute display price info for a product, correctly handling the
 * two-tier pricing model (base price + optional per-variant prices).
 *
 * When a product has variants with explicit priceCents, the range is
 * built from those variant prices. The base priceCents is only folded
 * into the range when it is > 0 (meaning it represents a real fallback
 * price for variants that don't have their own price).
 *
 * A base priceCents of 0 signals "variant-only pricing" and is never
 * shown as the display price when active variant prices exist.
 */
export function computeProductPriceDisplay(
  product: ProductPriceInput,
): ProductPriceDisplay {
  const activeVariants = product.variants.filter((v) => v.isActive);
  const variantPrices = activeVariants
    .filter((v) => v.priceCents !== null)
    .map((v) => v.priceCents as number);

  let priceDisplay: string;
  let priceRangeMin: number | undefined;
  let priceRangeMax: number | undefined;

  if (variantPrices.length > 0) {
    priceRangeMin = Math.min(...variantPrices);
    priceRangeMax = Math.max(...variantPrices);

    // Only include base price in the range when it's meaningful (> 0).
    // A base of 0 means the product uses variant-only pricing, so
    // folding 0 into the min would incorrectly show "Rp 0".
    if (product.priceCents > 0) {
      priceRangeMin = Math.min(product.priceCents, priceRangeMin);
      priceRangeMax = Math.max(product.priceCents, priceRangeMax);
    }

    priceDisplay = formatRupiah(priceRangeMin);
  } else {
    // No active variant prices — fall back to base price
    priceDisplay = formatRupiah(product.priceCents || 0);
  }

  // Determine the effective price for discount comparison.
  // When variants drive the display, use the priceRangeMin.
  // Otherwise use the base priceCents directly.
  const effectivePriceCents =
    priceRangeMin !== undefined ? priceRangeMin : product.priceCents || 0;

  const hasDiscount =
    !!product.compareAtPriceCents &&
    product.compareAtPriceCents > effectivePriceCents;

  const compareAtPriceDisplay = hasDiscount
    ? formatRupiah(product.compareAtPriceCents!)
    : undefined;

  return {
    priceDisplay,
    priceRangeMin,
    priceRangeMax,
    compareAtPriceDisplay,
    hasDiscount,
  };
}
