'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { useCartStore, useCartSync } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { formatRupiah } from '@/lib/utils/format';
import { productImageUrl } from '@/lib/utils/product-image';

type PaymentProvider = 'midtrans' | 'paypal';

interface OrderSummaryCardProps {
  selectedProvider?: PaymentProvider;
  onSelectProvider?: (provider: PaymentProvider) => void;
  canPayWithMidtrans?: boolean;
  canPayWithPaypal?: boolean;
}

export function OrderSummaryCard({
  selectedProvider,
  onSelectProvider,
  canPayWithMidtrans = true,
  canPayWithPaypal = true,
}: OrderSummaryCardProps = {}) {
  // Ensure cart is synced
  useCartSync();

  const t = useTranslations('checkout');
  const { items, promoDiscountCents, getSubtotalCents } = useCartStore();
  const { data: checkoutData } = useCheckoutStore();
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const currency = checkoutData.countryCode === 'ID' ? 'IDR' : 'USD';
  const hasUsdPrices = items.every((item) => (item.variant?.priceCentsUsd ?? item.product.priceCentsUsd) != null);
  const subtotalCents = currency === 'USD'
    ? (hasUsdPrices ? items.reduce((sum, item) => sum + (item.variant?.priceCentsUsd ?? item.product.priceCentsUsd ?? 0) * item.quantity, 0) : null)
    : getSubtotalCents();
  // The payment endpoint currently applies no promotions to PayPal orders.
  const discountCents = currency === 'USD' ? 0 : promoDiscountCents;
  const shippingCostCents = checkoutData.shippingCostCents;
  const totalCents = subtotalCents === null ? null : subtotalCents - discountCents + (shippingCostCents ?? 0);

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
          const priceCents = currency === 'USD'
            ? (item.variant?.priceCentsUsd ?? item.product.priceCentsUsd)
            : (item.variant?.priceCents ?? item.product.priceCents);
          const compareAtPriceCents = item.variant ? null : item.product.compareAtPriceCents;
          const hasDiscount = currency === 'IDR' && compareAtPriceCents !== null && compareAtPriceCents > item.product.priceCents;

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
                <p className="text-sm font-medium">{priceCents == null ? '—' : formatRupiah(priceCents * item.quantity, currency)}</p>
                {hasDiscount && (
                  <p className="text-xs text-neutral-400 line-through">
                    {formatRupiah(compareAtPriceCents! * item.quantity, currency)}
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
          <span>{subtotalCents === null ? '—' : formatRupiah(subtotalCents, currency)}</span>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{t('summary.discount')}</span>
            <span>-{formatRupiah(discountCents, currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">{t('summary.shipping')}</span>
          {shippingCostCents !== null ? (
            <span>{formatRupiah(shippingCostCents, currency)}</span>
          ) : (
            <span className="text-neutral-400">{t('summary.shippingPendingCourier')}</span>
          )}
        </div>
        <div className="flex justify-between text-xl font-semibold tracking-tight pt-3 border-t border-neutral-100">
          <span>{t('summary.total')}</span>
          <span>{totalCents === null ? '—' : formatRupiah(totalCents, currency)}</span>
        </div>
      </div>

      {/* Payment method toggle */}
      {selectedProvider && onSelectProvider && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-neutral-500 mb-3">{t('paymentMethodTitle')}</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => canPayWithMidtrans && onSelectProvider('midtrans')}
              disabled={!canPayWithMidtrans}
              aria-label={t('payLocal')}
              className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                !canPayWithMidtrans
                  ? 'border-neutral-200 opacity-40 cursor-not-allowed'
                  : selectedProvider === 'midtrans'
                    ? 'border-neutral-900 bg-white'
                    : 'border-neutral-200 hover:bg-white/60'
              }`}
            >
              <div className="relative w-20 h-5 flex-shrink-0">
                <Image src="/midtrans-logo.svg" alt={t('payLocal')} fill className="object-contain object-left" />
              </div>
              <span className="text-[11px] text-neutral-500 leading-tight text-left flex-1">{t('payLocalHint')}</span>
              {selectedProvider === 'midtrans' && (
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-neutral-900 flex-shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => canPayWithPaypal && onSelectProvider('paypal')}
              disabled={!canPayWithPaypal}
              aria-label={t('payPaypal')}
              className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                !canPayWithPaypal
                  ? 'border-neutral-200 opacity-40 cursor-not-allowed'
                  : selectedProvider === 'paypal'
                    ? 'border-neutral-900 bg-white'
                    : 'border-neutral-200 hover:bg-white/60'
              }`}
            >
              <div className="relative w-20 h-5 flex-shrink-0">
                <Image src="/paypal-logo.svg" alt={t('payPaypal')} fill className="object-contain object-left" />
              </div>
              <span className="text-[11px] text-neutral-500 leading-tight text-left flex-1">{t('payPaypalHint')}</span>
              {selectedProvider === 'paypal' && (
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-neutral-900 flex-shrink-0" />
              )}
            </button>
          </div>

          {!canPayWithMidtrans && (
            <p className="text-xs text-neutral-500 mt-3">{t('midtransUnavailable')}</p>
          )}
          {!canPayWithPaypal && (
            <p className="text-xs text-neutral-500 mt-3">{t('paypalUnavailable')}</p>
          )}
        </div>
      )}

      {/* Trust */}
      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-neutral-400">
        <Icon icon="solar:shield-check-linear" className="w-4 h-4" />
        {t('summary.secureTransaction')}
      </div>
    </div>
  );
}
