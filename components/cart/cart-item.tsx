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
    <div className="flex gap-6 py-6">
      {/* Product Image - blend like product card */}
      <Link
        href={`/produk/${item.product.handle}`}
        className="w-28 h-36 lg:w-32 lg:h-40 bg-neutral-100 flex-shrink-0 relative overflow-hidden rounded-lg"
      >
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.title}
            fill
            className="object-cover mix-blend-multiply"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <Icon icon="solar:box-linear" className="w-8 h-8" />
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <Link 
            href={`/produk/${item.product.handle}`} 
            className="text-lg font-medium tracking-tight hover:text-neutral-600 transition-colors"
          >
            {item.product.title}
          </Link>
          {item.selectedVariant && (
            <p className="text-sm text-neutral-400 mt-1">
              {[
                item.selectedVariant.color && `Warna: ${item.selectedVariant.color}`,
                item.selectedVariant.size && `Ukuran: ${item.selectedVariant.size}`,
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition-colors"
              aria-label="Kurangi jumlah"
            >
              <Icon icon="solar:minus-linear" className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition-colors"
              aria-label="Tambah jumlah"
            >
              <Icon icon="solar:add-linear" className="w-4 h-4" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-lg font-semibold tracking-tight">
              {formatPrice(price * item.quantity)}
            </p>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => removeItem(item.id)}
        className="self-start text-neutral-300 hover:text-red-500 transition-colors p-1"
        aria-label="Hapus item"
      >
        <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
      </button>
    </div>
  );
}
