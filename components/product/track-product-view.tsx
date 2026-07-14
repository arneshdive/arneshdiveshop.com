'use client';

import { useEffect } from 'react';
import { addToRecentlyViewed } from '@/lib/utils/recently-viewed';

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
    // Calculate price display
    // Note: priceCents stores actual cents (100 cents = 1 Rupiah)
    const activeVariants = variants.filter(v => v.isActive);
    const variantPrices = activeVariants
      .filter(v => v.priceCents !== null)
      .map(v => v.priceCents as number);

    let priceDisplay: string;
    let priceRangeMin: number | undefined;
    let priceRangeMax: number | undefined;
    
    if (variantPrices.length > 0) {
      const minPrice = Math.min(...variantPrices);
      const maxPrice = Math.max(...variantPrices);
      const effectiveMin = product.priceCents ? Math.min(product.priceCents, minPrice) : minPrice;
      const effectiveMax = Math.max(minPrice, product.priceCents || 0, maxPrice);
      
      priceRangeMin = effectiveMin;
      priceRangeMax = effectiveMax;
      priceDisplay = `Rp ${(effectiveMin / 100).toLocaleString('id-ID')}`;
    } else {
      priceDisplay = product.priceCents 
        ? `Rp ${(product.priceCents / 100).toLocaleString('id-ID')}` 
        : 'Rp 0';
    }
    
    // Determine badge
    const badge = product.isNewArrival 
      ? 'New Arrival' 
      : product.isOnSale 
        ? 'Sale' 
        : undefined;
    
    // Add to recently viewed
    addToRecentlyViewed({
      id: product.id,
      slug: product.slug,
      name: product.name,
      vendor: product.brand?.name,
      price: priceDisplay,
      priceRangeMin,
      priceRangeMax,
      compareAtPrice: product.compareAtPriceCents 
        ? `Rp ${(product.compareAtPriceCents / 100).toLocaleString('id-ID')}` 
        : undefined,
      badge,
      image: product.images?.[0],
      secondaryImage: product.images?.[1],
      variantId: activeVariants[0]?.id,
    });
  }, [product, variants]);

  // This component doesn't render anything
  return null;
}
