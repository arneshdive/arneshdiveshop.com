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
    <div className="w-full lg:w-80 bg-white p-6 border border-neutral-200 h-fit sticky top-24">
      <h2 className="font-semibold text-lg mb-6 pb-3 border-b border-neutral-200">Ringkasan Pesanan</h2>

      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const price = parseFloat(item.product.price.replace(/[^0-9]/g, ''));
          return (
            <div key={item.id} className="flex gap-3">
              <div className="w-16 h-20 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 text-[10px] relative overflow-hidden flex-shrink-0">
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  'Img'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.product.title}</div>
                {item.selectedVariant && (
                  <div className="text-xs text-neutral-500">
                    {item.selectedVariant.color || item.selectedVariant.size}
                  </div>
                )}
                <div className="text-xs text-neutral-500">Qty: {item.quantity}</div>
              </div>
              <div className="font-medium text-sm">{formatPrice(price * item.quantity)}</div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="space-y-2 text-sm border-t border-neutral-200 pt-4">
        <div className="flex justify-between">
          <span className="text-neutral-500">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Diskon ({promoDiscount * 100}%)</span>
            <span>-{formatPrice(subtotal * promoDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-500">Ongkos Kirim</span>
          <span>{freeShipping ? 'Gratis' : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg pt-3 border-t border-neutral-200">
          <span>Total</span>
          <span>{formatPrice(total + shippingCost)}</span>
        </div>
      </div>

      {/* Security Badge */}
      <div className="mt-6 pt-4 border-t border-neutral-200 text-center text-xs text-neutral-500 flex items-center justify-center gap-1">
        <Icon icon="solar:lock-linear" className="w-4 h-4" />
        Transaksi Anda dilindungi
      </div>
    </div>
  );
}
