'use client';

import { Icon } from '@iconify/react';
import { useCartStore, useCartSync } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { shippingMethods, FREE_SHIPPING_THRESHOLD } from '@/lib/constants/shipping';
import { formatRupiah } from '@/lib/utils/format';

export function OrderSummaryCard() {
  // Ensure cart is synced
  useCartSync();
  
  const { items, promoDiscountCents, getSubtotalCents, getTotalCents } = useCartStore();
  const { data } = useCheckoutStore();
  
  const subtotalCents = getSubtotalCents();
  const totalCents = getTotalCents();
  const freeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotalCents;
  const selectedMethod = shippingMethods.find((m) => m.id === data.shippingMethod);
  const shippingCost = freeShipping ? 0 : (selectedMethod?.price || 0);

  // Get image for item
  const getItemImage = (item: typeof items[0]) => {
    return item.product.images?.[0] || null;
  };

  return (
    <div className="bg-neutral-50 p-8 lg:p-12 sticky top-24 rounded-2xl">
      <h2 className="text-xl font-semibold tracking-tight mb-6">Ringkasan</h2>

      {/* Free shipping progress */}
      {!freeShipping && subtotalCents > 0 && (
        <div className="mb-6 p-4 bg-white rounded-xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-500">Gratis ongkir di atas {formatRupiah(FREE_SHIPPING_THRESHOLD)}</span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-neutral-900 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((subtotalCents / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Tambah {formatRupiah(remainingForFreeShipping)} lagi untuk gratis ongkir
          </p>
        </div>
      )}

      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const image = getItemImage(item);
          const priceCents = item.variant?.priceCents ?? item.product.priceCents;
          
          return (
            <div key={item.id} className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-lg relative overflow-hidden flex-shrink-0">
                {image ? (
                  <img
                    src={image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
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
                <p className="text-xs text-neutral-400">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium">{formatRupiah(priceCents * item.quantity)}</p>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="border-t border-neutral-100 pt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Subtotal</span>
          <span>{formatRupiah(subtotalCents)}</span>
        </div>
        {promoDiscountCents > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Diskon</span>
            <span>-{formatRupiah(promoDiscountCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Ongkos Kirim</span>
          <span>{freeShipping ? <span className="text-green-600 font-medium">Gratis</span> : formatRupiah(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-xl font-semibold tracking-tight pt-3 border-t border-neutral-100">
          <span>Total</span>
          <span>{formatRupiah(totalCents + shippingCost)}</span>
        </div>
      </div>

      {/* Trust */}
      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-neutral-400">
        <Icon icon="solar:shield-check-linear" className="w-4 h-4" />
        Transaksi aman & terenkripsi
      </div>
    </div>
  );
}
