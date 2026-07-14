'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product/product-card';
import {
  getRecentlyViewed,
  type RecentlyViewedProduct,
} from '@/lib/utils/recently-viewed';

interface RecentlyViewedProps {
  currentProductId?: string; // Optionally exclude current product from list
}

export function RecentlyViewed({ currentProductId }: RecentlyViewedProps) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load recently viewed products
    const viewed = getRecentlyViewed();
    
    // Filter out current product if provided
    const filtered = currentProductId
      ? viewed.filter(p => p.id !== currentProductId)
      : viewed;
    
    // Take only 4 for display
    setProducts(filtered.slice(0, 4));
  }, [currentProductId]);

  // Don't render anything until client-side hydration is complete
  // This prevents hydration mismatch
  if (!mounted) {
    return null;
  }

  // Hide section if no products
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 lg:py-16 bg-white border-t border-neutral-100">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
        <div className="flex flex-col mb-8">
          <span className="text-[10px] lg:text-xs text-neutral-500 uppercase tracking-widest mb-2">
            Riwayat
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tighter mb-2">
            Baru{' '}
            <em
              is="highlighted-text"
              className="highlighted-text not-italic relative inline-block animated"
              data-style="scribble"
            >
              <span className="relative z-10">Dilihat</span>
              <svg
                className="icon icon-squiggle-underline absolute -bottom-1 left-0 w-full"
                viewBox="-347 -30.1947 694 96.19"
                stroke="#93c5fd"
                fill="none"
                role="presentation"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeWidth={24}
                  pathLength={1}
                  d="M-335,35 C-280,35 -250,70 -200,25 C-150,-20 -120,60 -60,30 C0,0 50,55 120,35 C190,15 250,45 335,20"
                />
              </svg>
            </em>
          </h2>
          <p className="text-sm lg:text-base max-w-md">
            Lanjutkan dari produk yang baru saja Anda lihat.
          </p>
        </div>

        <div className="flex overflow-x-auto gap-4 lg:gap-6 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 scrollbar-hide snap-x snap-mandatory">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[calc(50%-8px)] snap-start md:w-auto"
            >
              <ProductCard
                product={{
                  id: product.id,
                  handle: product.slug,
                  title: product.name,
                  vendor: product.vendor,
                  price: product.price,
                  priceRangeMin: product.priceRangeMin,
                  priceRangeMax: product.priceRangeMax,
                  compareAtPrice: product.compareAtPrice,
                  badge: product.badge,
                  image: product.image,
                  secondaryImage: product.secondaryImage,
                  variantId: product.variantId,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
