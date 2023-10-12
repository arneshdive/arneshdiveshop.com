'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { CartItem as CartItemType, useCartStore } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/validators';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const price = parseFloat(item.product.price.replace(/[^0-9]/g, ''));

  return (
    <div className="flex gap-4 py-6 border-b border-neutral-200 bg-white px-4 mb-4 first:mt-4">
      {/* Product Image */}
      <Link
        href={`/produk/${item.product.handle}`}
        className="w-24 h-32 lg:w-28 lg:h-36 bg-neutral-100 flex-shrink-0 relative overflow-hidden"
      >
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
            Img
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/produk/${item.product.handle}`} className="font-medium hover:underline">
            {item.product.title}
          </Link>
          {item.selectedVariant && (
            <p className="text-neutral-500 text-xs mt-1">
              {[
                item.selectedVariant.color && `Warna: ${item.selectedVariant.color}`,
                item.selectedVariant.size && `Ukuran: ${item.selectedVariant.size}`,
              ]
                .filter(Boolean)
                .join(' | ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center border border-neutral-300">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="px-3 py-1 hover:bg-neutral-100 transition-colors"
              aria-label="Kurangi jumlah"
            >
              <Icon icon="solar:minus-linear" className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 border-x border-neutral-300 text-center min-w-[40px]">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="px-3 py-1 hover:bg-neutral-100 transition-colors"
              aria-label="Tambah jumlah"
            >
              <Icon icon="solar:add-linear" className="w-4 h-4" />
            </button>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => removeItem(item.id)}
            className="text-neutral-400 hover:text-red-500 transition-colors"
            aria-label="Hapus item"
          >
            <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="font-semibold text-right">
        {formatPrice(price * item.quantity)}
      </div>
    </div>
  );
}
