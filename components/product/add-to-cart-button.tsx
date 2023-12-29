'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { useCartStore } from '@/lib/store/cart';

interface AddToCartButtonProps {
  productId: string;
  disabled?: boolean;
  variantId?: string;
}

export function AddToCartButton({ 
  productId, 
  disabled = false,
  variantId 
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);

  const handleAddToCart = async () => {
    if (added || isLoading) return;
    
    setAdded(true);
    
    const result = await addItem(productId, variantId, 1);
    
    if (result.success) {
      setTimeout(() => setAdded(false), 2000);
    } else {
      setAdded(false);
      console.error('Failed to add item:', result.error);
    }
  };

  return (
    <AnimatedButton 
      className="flex-1 h-[54px] text-base"
      onClick={handleAddToCart}
      disabled={disabled || added || isLoading}
    >
      {added ? (
        <span className="flex items-center gap-2">
          <Icon icon="solar:check-circle-linear" className="w-5 h-5" />
          Ditambahkan!
        </span>
      ) : (
        'Tambah ke Keranjang'
      )}
    </AnimatedButton>
  );
}
