'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { ProductActions } from '@/components/product/product-actions';
import { formatRupiah } from '@/lib/utils/format';

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

  return (
    <div className="lg:sticky lg:top-24 max-w-md">
      {/* Vendor */}
      {product.brand && (
        <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
          {product.brand.name}
        </p>
      )}

      {/* Title */}
      <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter mb-3">
        {product.name}
      </h1>

      {/* Price */}
      <p className="text-xl lg:text-2xl font-semibold tracking-tight mb-6">
        {currentCompareAtPriceCents ? (
          <>
            <span className="text-red-500">
              {isPriceRange 
                ? `${formatRupiah(priceRangeMin)} - ${formatRupiah(priceRangeMax)}`
                : formatRupiah(displayPrice)
              }
            </span>{' '}
            <s className="text-neutral-400 font-normal">{formatRupiah(currentCompareAtPriceCents)}</s>
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
          <p className="leading-relaxed">{product.description || 'Tidak ada deskripsi.'}</p>
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
                    ? product.divingTypes!.map(t => t === 'freediving' ? 'Freediving' : 'Scuba').join(', ')
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
        <AccordionItem title="Pengiriman">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Icon icon="solar:check-circle-linear" className="w-4 h-4 text-green-600 mt-0.5" />
              Gratis ongkir untuk pembelian di atas Rp 500.000
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="solar:check-circle-linear" className="w-4 h-4 text-green-600 mt-0.5" />
              Pengiriman 1-3 hari kerja (Jabodetabek)
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="solar:check-circle-linear" className="w-4 h-4 text-green-600 mt-0.5" />
              Pengiriman 3-7 hari kerja (Luar Jabodetabek)
            </li>
          </ul>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
