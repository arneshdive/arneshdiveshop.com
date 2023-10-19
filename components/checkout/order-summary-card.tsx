'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useCartStore } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { shippingMethods, FREE_SHIPPING_THRESHOLD } from '@/lib/constants/shipping';
import { formatPrice } from '@/lib/utils/validators';

export function OrderSummaryCard() {
  const { items, promoDiscount, getSubtotal, getTotal } = useCartStore();
  const { data } = useCheckoutStore();
  const subtotal = getSubtotal();
  const total = getTotal();
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const selectedMethod = shippingMethods.find((m) => m.id === data.shippingMethod);
  const shippingCost = freeShipping ? 0 : (selectedMethod?.price || 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 sticky top-24">
      <h2 className="text-xl font-semibold tracking-tight mb-6">Pesanan Anda</h2>

      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const price = parseFloat(item.product.price.replace(/[^0-9]/g, ''));
          return (
            <div key={item.id} className="flex gap-4">
              <div className="w-16 h-20 bg-neutral-100 rounded-xl relative overflow-hidden flex-shrink-0">
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                    <Icon icon="solar:box-linear" className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="font-medium text-sm leading-tight">{item.product.title}</div>
                {item.selectedVariant && (
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {item.selectedVariant.color || item.selectedVariant.size}
                  </div>
                )}
                <div className="text-xs text-neutral-400 mt-0.5">Qty: {item.quantity}</div>
              </div>
              <div className="font-medium text-sm">{formatPrice(price * item.quantity)}</div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="border-t border-neutral-100 pt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Diskon ({promoDiscount * 100}%)</span>
            <span>-{formatPrice(subtotal * promoDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Ongkos Kirim</span>
          <span>{freeShipping ? <span className="text-green-600 font-medium">Gratis</span> : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-xl font-semibold tracking-tight pt-3 border-t border-neutral-100">
          <span>Total</span>
          <span>{formatPrice(total + shippingCost)}</span>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-neutral-100 text-xs text-neutral-400">
        <Icon icon="solar:shield-check-linear" className="w-4 h-4" />
        Transaksi aman & terenkripsi
      </div>
    </div>
  );
}
