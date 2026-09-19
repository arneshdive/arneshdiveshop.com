'use client';

import { useEffect } from 'react';
import { addToRecentlyViewed } from '@/lib/utils/recently-viewed';
import { computeProductPriceDisplay } from '@/lib/utils/product-pricing';

interface TrackProductViewProps {
  product: {
    id: string;
    slug: string;
    name: string;
    priceCents: number | null;
    compareAtPriceCents: number | null;
    images: string[] | null;
    brand?: { name: string } | null;
    isNewArrival: boolean;
    isOnSale: boolean;
  };
  variants: Array<{
    id: string;
    priceCents: number | null;
    isActive: boolean;
  }>;
}

/**
 * Tracks product views in localStorage for the "Recently Viewed" feature.
 * This component doesn't render anything - it just runs the tracking effect.
 */
export function TrackProductView({ product, variants }: TrackProductViewProps) {
  useEffect(() => {
    const priceInfo = computeProductPriceDisplay({
      priceCents: product.priceCents ?? 0,
      compareAtPriceCents: product.compareAtPriceCents,
      variants: variants.map(v => ({
        isActive: v.isActive,
        priceCents: v.priceCents,
      })),
    });

    // Determine badges. Stored as stable, language-neutral keys (not
    // localized text) — ProductCard translates these for display, since
    // this value is persisted to localStorage and read back under whatever
    // locale the viewer is on later.
    const badges: string[] = [];
    if (product.isNewArrival) badges.push('new');
    if (product.isOnSale) badges.push('sale');

    // Add to recently viewed
    addToRecentlyViewed({
      id: product.id,
      slug: product.slug,
      name: product.name,
      vendor: product.brand?.name,
      price: priceInfo.priceDisplay,
      priceRangeMin: priceInfo.priceRangeMin,
      priceRangeMax: priceInfo.priceRangeMax,
      compareAtPrice: priceInfo.compareAtPriceDisplay,
      badges,
      image: product.images?.[0],
      secondaryImage: product.images?.[1],
      variantId: variants.find(v => v.isActive)?.id,
    });
  }, [product, variants]);

  // This component doesn't render anything
  return null;
}
