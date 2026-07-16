'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X } from 'lucide-react';
import { Icon } from '@iconify/react';
import { CartItem as CartItemType, useCartStore } from '@/lib/store/cart';
import { formatRupiah } from '@/lib/utils/format';
import { AnimatedUnderline } from '@/components/ui/animated-underline';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, isLoading } = useCartStore();
  
  // Use variant price if available, otherwise product price
  const priceCents = item.variant?.priceCents ?? item.product.priceCents;
  const totalPriceCents = priceCents * item.quantity;

  // Variants don't have their own compare-at price, so only show the discount
  // when no variant is selected — matches the PDP's rule for the same product.
  const compareAtPriceCents = item.variant ? null : item.product.compareAtPriceCents;
  const hasDiscount = compareAtPriceCents !== null && compareAtPriceCents > item.product.priceCents;
  
  // Get image URL
  const imageUrl = item.product.images?.[0] || null;

  return (
    <div className="flex gap-4 lg:gap-6 py-6 lg:py-8 group/item">
      {/* Product Image - blend like product card */}
      <Link
        href={`/produk/${item.product.slug}`}
        className="w-24 h-24 lg:w-36 lg:h-36 bg-neutral-100 flex-shrink-0 relative overflow-hidden rounded-lg cursor-pointer"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.product.name}
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
          <Link
            href={`/produk/${item.product.slug}`}
            className="text-base lg:text-lg font-medium tracking-tight cursor-pointer inline"
          >
            <AnimatedUnderline>{item.product.name}</AnimatedUnderline>
          </Link>
          {item.variant && (
            <p className="text-sm text-neutral-400 mt-0.5 lg:mt-1 cursor-default">
              {item.variant.name}
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
              disabled={isLoading}
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={isLoading}
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Tambah jumlah"
            >
              <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            {hasDiscount ? (
              <>
                <p className="text-base lg:text-lg font-semibold tracking-tight text-red-500 cursor-default">
                  {formatRupiah(totalPriceCents)}
                </p>
                <p className="text-xs text-neutral-400 line-through cursor-default">
                  {formatRupiah(compareAtPriceCents! * item.quantity)}
                </p>
              </>
            ) : (
              <p className="text-base lg:text-lg font-semibold tracking-tight cursor-default">
                {formatRupiah(totalPriceCents)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          removeItem(item.id);
        }}
        disabled={isLoading}
        className="self-start text-black hover:text-red-500 transition-colors p-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Hapus item"
      >
        <X className="w-4 h-4 lg:w-5 lg:h-5" />
      </button>
    </div>
  );
}
