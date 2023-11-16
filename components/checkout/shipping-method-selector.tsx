'use client';

import { useCheckoutStore } from '@/lib/store/checkout';
import { useCartStore } from '@/lib/store/cart';
import { shippingMethods, FREE_SHIPPING_THRESHOLD } from '@/lib/constants/shipping';
import { formatRupiah } from '@/lib/utils/format';
import { Icon } from '@iconify/react';

export function ShippingMethodSelector() {
  const { data, setField } = useCheckoutStore();
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const subtotal = getSubtotal();
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className="pb-8">
      <h2 className="text-lg font-semibold tracking-tight mb-6">
        Metode Pengiriman
      </h2>
      <div className="space-y-3">
        {shippingMethods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center justify-between p-5 border-2 rounded-xl cursor-pointer transition-all ${
              data.shippingMethod === method.id
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <input
                type="radio"
                name="shippingMethod"
                checked={data.shippingMethod === method.id}
                onChange={() => setField('shippingMethod', method.id as typeof data.shippingMethod)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  data.shippingMethod === method.id
                    ? 'border-neutral-900'
                    : 'border-neutral-300'
                }`}
              >
                {data.shippingMethod === method.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                )}
              </div>
              <div>
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-neutral-500">{method.description}</div>
              </div>
            </div>
            <div className="text-right">
              {freeShipping ? (
                <span className="font-semibold text-green-600">Gratis</span>
              ) : (
                <span className="font-semibold">{formatRupiah(method.price)}</span>
              )}
            </div>
          </label>
        ))}
      </div>

      {freeShipping && (
        <div className="flex items-center gap-2 mt-4 text-sm text-green-600">
          <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
          Gratis ongkir untuk pesanan di atas {formatRupiah(FREE_SHIPPING_THRESHOLD)}
        </div>
      )}
    </div>
  );
}
