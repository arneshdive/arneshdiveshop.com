'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X } from 'lucide-react';
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
    <div className="flex gap-4 lg:gap-6 py-6 lg:py-8 group/item">
      {/* Product Image - blend like product card */}
      <Link
        href={`/produk/${item.product.handle}`}
        className="w-24 h-24 lg:w-36 lg:h-36 bg-neutral-100 flex-shrink-0 relative overflow-hidden rounded-lg cursor-pointer"
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
            <Icon icon="solar:box-linear" className="w-6 h-6 lg:w-8 lg:h-8" />
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between py-0.5 lg:py-1">
        <div>
          {item.product.vendor && (
            <p className="text-[10px] lg:text-xs uppercase tracking-widest text-neutral-400 mb-0.5 lg:mb-1 cursor-default">
              {item.product.vendor}
            </p>
          )}
          <Link 
            href={`/produk/${item.product.handle}`}
            className="text-base lg:text-lg font-medium tracking-tight relative inline-block cursor-pointer"
          >
            <span className="transition-colors">{item.product.title}</span>
            <span className="absolute left-0 bottom-0 w-0 h-px bg-neutral-900 transition-all duration-300 group-hover/item:w-full" />
          </Link>
          {item.selectedVariant && (
            <p className="text-sm text-neutral-400 mt-0.5 lg:mt-1 cursor-default">
              {[
                item.selectedVariant.color && `Warna: ${item.selectedVariant.color}`,
                item.selectedVariant.size && `Ukuran: ${item.selectedVariant.size}`,
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 lg:mt-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 lg:gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                updateQuantity(item.id, item.quantity - 1);
              }}
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors cursor-pointer"
              aria-label="Kurangi jumlah"
            >
              <Minus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </button>
            <span className="w-6 lg:w-8 text-center text-sm lg:text-base font-medium cursor-default">
              {item.quantity}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                updateQuantity(item.id, item.quantity + 1);
              }}
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors cursor-pointer"
              aria-label="Tambah jumlah"
            >
              <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-base lg:text-lg font-semibold tracking-tight cursor-default">
              {formatPrice(price * item.quantity)}
            </p>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          removeItem(item.id);
        }}
        className="self-start text-black hover:text-red-500 transition-colors p-1 cursor-pointer"
        aria-label="Hapus item"
      >
        <X className="w-4 h-4 lg:w-5 lg:h-5" />
      </button>
    </div>
  );
}
