'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { useCartStore } from '@/lib/store/cart';

interface Variant {
  id: string;
  name: string;
  options: Record<string, string>;
  priceCents: number | null;
  isActive: boolean;
}

interface ProductActionsProps {
  productId: string;
  variants: Variant[];
  basePriceCents: number;
  compareAtPriceCents: number | null;
  isActive: boolean;
  onPriceChange?: (priceInfo: { priceCents: number | null; compareAtPriceCents: number | null }) => void;
}

export function ProductActions({ 
  productId,
  variants = [],
  basePriceCents,
  compareAtPriceCents,
  isActive,
  onPriceChange,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [added, setAdded] = useState(false);
  
  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);

  const handleAddToCart = async () => {
    if (added || isLoading) return;
    
    setAdded(true);
    
    const result = await addItem(productId, selectedVariantId, quantity);
    
    if (result.success) {
      setTimeout(() => setAdded(false), 2000);
    } else {
      setAdded(false);
      console.error('Failed to add item:', result.error);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < 99) {
      setQuantity(q => q + 1);
    }
  };

  // Get selected variant price
  const selectedVariant = selectedVariantId 
    ? variants.find(v => v.id === selectedVariantId) 
    : null;
  const currentPriceCents = selectedVariant?.priceCents ?? basePriceCents;
  
  // Notify parent of price changes
  useEffect(() => {
    if (onPriceChange) {
      onPriceChange({ 
        priceCents: currentPriceCents, 
        compareAtPriceCents: selectedVariant ? null : compareAtPriceCents 
      });
    }
  }, [currentPriceCents, selectedVariant, compareAtPriceCents, onPriceChange]);
  
  // Extract variant options grouped by option name
  const variantOptionsMap = new Map<string, { label: string; value: string; variantId: string }[]>();
  
  if (variants.length > 0) {
    const optionNames = new Set<string>();
    variants.forEach(v => {
      Object.keys(v.options).forEach(name => optionNames.add(name));
    });
    
    optionNames.forEach(optionName => {
      const values = new Map<string, { label: string; value: string; variantId: string }>();
      variants.forEach(variant => {
        const value = variant.options[optionName];
        if (value && !values.has(value) && variant.isActive) {
          values.set(value, {
            label: value,
            value: value.toLowerCase().replace(/\s+/g, '-'),
            variantId: variant.id,
          });
        }
      });
      variantOptionsMap.set(optionName, Array.from(values.values()));
    });
  }

  return (
    <>
      {/* Variant Selection */}
      {variantOptionsMap.size > 0 && Array.from(variantOptionsMap.entries()).map(([optionName, options]) => (
        <div key={optionName} className="mb-6">
          <p className="text-sm uppercase tracking-widest text-neutral-600 font-medium mb-3">
            {optionName}{selectedVariant ? '' : <span className="text-red-500 ml-1">*</span>}
          </p>
          <div className="flex flex-wrap gap-3">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedVariantId(option.variantId)}
                className={`min-w-[48px] h-12 px-4 rounded-md border text-sm font-medium transition-colors ${
                  selectedVariantId === option.variantId
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 hover:border-neutral-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Quantity */}
      <div className="mb-6">
        <p className="text-sm uppercase tracking-widest text-neutral-600 font-medium mb-3">Jumlah</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
            className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg leading-none">−</span>
          </button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <button
            type="button"
            onClick={increaseQuantity}
            disabled={quantity >= 99}
            className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>
      </div>

      {/* Stock Status */}
      {isActive ? (
        <p className="text-sm text-green-600 mb-6 flex items-center gap-2">
          <Icon icon="solar:check-circle-linear" className="w-4 h-4" />
          Produk tersedia
        </p>
      ) : (
        <p className="text-sm text-red-600 mb-6 flex items-center gap-2">
          <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
          Produk tidak tersedia
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <AnimatedButton 
          className="flex-1 h-[54px] text-base"
          onClick={handleAddToCart}
          disabled={!isActive || added || isLoading}
        >
          {added ? (
            <span className="flex items-center gap-2">
              <Icon icon="solar:check-circle-linear" className="w-5 h-5" />
              Ditambahkan!
            </span>
          ) : isLoading ? (
            'Menambahkan...'
          ) : (
            'Tambah ke Keranjang'
          )}
        </AnimatedButton>
        <AnimatedButton className="!w-[54px] !h-[54px] !p-0" variant="outline">
          <Icon icon="solar:heart-linear" className="w-5 h-5" />
        </AnimatedButton>
      </div>
    </>
  );
}
