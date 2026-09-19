'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { useCartStore, useCartSync } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { formatRupiah } from '@/lib/utils/format';
import { productImageUrl } from '@/lib/utils/product-image';

export function OrderSummaryCard() {
  // Ensure cart is synced
  useCartSync();

  const t = useTranslations('checkout');
  const { items, promoDiscountCents, getSubtotalCents } = useCartStore();
  const { data: checkoutData } = useCheckoutStore();
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const subtotalCents = getSubtotalCents();
  const shippingCostCents = checkoutData.shippingCostCents;
  const totalCents = subtotalCents - promoDiscountCents + (shippingCostCents ?? 0);

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
  };

  return (
    <div className="bg-neutral-50 p-8 lg:p-12 sticky top-24 rounded-2xl">
      <h2 className="text-xl font-semibold tracking-tight mb-6">{t('summary.title')}</h2>

      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const image = item.product.images?.[0];
          const thumbnail = image && !failedImages.has(image)
            ? productImageUrl(image, 'thumb')
            : undefined;
          const priceCents = item.variant?.priceCents ?? item.product.priceCents;
          const compareAtPriceCents = item.variant ? null : item.product.compareAtPriceCents;
          const hasDiscount = compareAtPriceCents !== null && compareAtPriceCents > item.product.priceCents;

          return (
            <div key={item.id} className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-lg relative overflow-hidden flex-shrink-0 flex items-center justify-center">
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={item.product.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                    onError={() => handleImageError(image!)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                    <Icon icon="solar:box-linear" className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                {item.variant && (
                  <p className="text-xs text-neutral-400">{item.variant.name}</p>
                )}
                <p className="text-xs text-neutral-400">{t('summary.qty', { quantity: item.quantity })}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatRupiah(priceCents * item.quantity)}</p>
                {hasDiscount && (
                  <p className="text-xs text-neutral-400 line-through">
                    {formatRupiah(compareAtPriceCents! * item.quantity)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="border-t border-neutral-100 pt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">{t('summary.subtotal')}</span>
          <span>{formatRupiah(subtotalCents)}</span>
        </div>
        {promoDiscountCents > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{t('summary.discount')}</span>
            <span>-{formatRupiah(promoDiscountCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">{t('summary.shipping')}</span>
          {shippingCostCents !== null ? (
            <span>{formatRupiah(shippingCostCents)}</span>
          ) : (
            <span className="text-neutral-400">{t('summary.shippingPendingCourier')}</span>
          )}
        </div>
        <div className="flex justify-between text-xl font-semibold tracking-tight pt-3 border-t border-neutral-100">
          <span>{t('summary.total')}</span>
          <span>{formatRupiah(totalCents)}</span>
        </div>
      </div>

      {/* Trust */}
      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-neutral-400">
        <Icon icon="solar:shield-check-linear" className="w-4 h-4" />
        {t('summary.secureTransaction')}
      </div>
    </div>
  );
}
