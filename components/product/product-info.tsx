'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { ExpandableText } from '@/components/ui/expandable-text';
import { ProductActions } from '@/components/product/product-actions';
import { formatRupiah } from '@/lib/utils/format';
import { formatDivingType } from '@/lib/constants/diving-types';
import type { DivingType } from '@/lib/db/schema';

interface Variant {
  id: string;
  name: string;
  options: Record<string, string>;
  priceCents: number | null;
  isActive: boolean;
}

interface ProductInfoProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    sku: string | null;
    priceCents: number;
    compareAtPriceCents: number | null;
    isActive: boolean;
    category?: { name: string; slug: string } | null;
    brand?: { name: string } | null;
    divingTypes?: string[];
  };
  variants: Variant[];
}

export function ProductInfo({ product, variants }: ProductInfoProps) {
  const [currentPriceCents, setCurrentPriceCents] = useState<number | null>(null);
  const [currentCompareAtPriceCents, setCurrentCompareAtPriceCents] = useState<number | null>(
    product.compareAtPriceCents
  );
  
  // Calculate price range from variants
  const variantPrices = variants
    .filter(v => v.isActive && v.priceCents !== null)
    .map(v => v.priceCents as number);
  
  const hasVariantPricing = variantPrices.length > 0;
  
  // Calculate min/max prices for range display
  let priceRangeMin = product.priceCents;
  let priceRangeMax = product.priceCents;
  
  if (hasVariantPricing) {
    const minVariant = Math.min(...variantPrices);
    const maxVariant = Math.max(...variantPrices);
    priceRangeMin = Math.min(product.priceCents, minVariant);
    priceRangeMax = Math.max(product.priceCents, maxVariant);
  }
  
  // Determine what to display
  const displayPrice = currentPriceCents ?? priceRangeMin;
  const isPriceRange = !currentPriceCents && hasVariantPricing && priceRangeMin !== priceRangeMax;
  
  // Handle price changes from variant selection
  const handlePriceChange = useCallback((priceInfo: { priceCents: number | null; compareAtPriceCents: number | null }) => {
    setCurrentPriceCents(priceInfo.priceCents);
    setCurrentCompareAtPriceCents(priceInfo.compareAtPriceCents);
  }, []);

  // Only a real discount if the compare-at price is actually higher than the selling price
  const hasDiscount = !!currentCompareAtPriceCents && currentCompareAtPriceCents > product.priceCents;

  return (
    <div className="lg:sticky lg:top-24 max-w-md">
      {/* Vendor */}
      {product.brand && (
        <Link
          href={`/produk?brand=${product.brand.name.toLowerCase().replace(/\s+/g, '-')}`}
          className="text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-colors mb-2"
        >
          {product.brand.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter mb-3">
        {product.name}
      </h1>

      {/* Price */}
      <p className="text-xl lg:text-2xl font-semibold tracking-tight mb-6">
        {hasDiscount ? (
          <>
            <span className="text-red-500">
              {isPriceRange
                ? `${formatRupiah(priceRangeMin)} - ${formatRupiah(priceRangeMax)}`
                : formatRupiah(displayPrice)
              }
            </span>{' '}
            <s className="text-neutral-400 font-normal">{formatRupiah(currentCompareAtPriceCents!)}</s>
          </>
        ) : (
          isPriceRange 
            ? `${formatRupiah(priceRangeMin)} - ${formatRupiah(priceRangeMax)}`
            : formatRupiah(displayPrice)
        )}
      </p>

      {/* Interactive Actions (Quantity, Variants, Add to Cart) */}
      <ProductActions 
        productId={product.id}
        variants={variants}
        basePriceCents={product.priceCents}
        compareAtPriceCents={product.compareAtPriceCents}
        isActive={product.isActive}
        onPriceChange={handlePriceChange}
      />

      {/* Accordion */}
      <Accordion>
        <AccordionItem title="Deskripsi" defaultOpen>
          <ExpandableText text={product.description || ''} />
        </AccordionItem>
        <AccordionItem title="Spesifikasi">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1.5 text-neutral-500 w-1/3">SKU</td>
                <td className="py-1.5">{product.sku || '-'}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-neutral-500 w-1/3">Tipe Diving</td>
                <td className="py-1.5">
                  {(product.divingTypes?.length ?? 0) > 0 
                    ? product.divingTypes!.map(t => formatDivingType(t as DivingType)).join(', ')
                    : '-'}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-neutral-500 w-1/3">Kategori</td>
                <td className="py-1.5">{product.category?.name || '-'}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-neutral-500 w-1/3">Brand</td>
                <td className="py-1.5">{product.brand?.name || '-'}</td>
              </tr>
            </tbody>
          </table>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
