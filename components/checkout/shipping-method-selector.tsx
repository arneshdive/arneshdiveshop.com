'use client';

import { useCheckoutStore } from '@/lib/store/checkout';
import { useCartStore } from '@/lib/store/cart';
import { shippingMethods, FREE_SHIPPING_THRESHOLD } from '@/lib/constants/shipping';
import { formatPrice } from '@/lib/utils/validators';

export function ShippingMethodSelector() {
  const { data, setField } = useCheckoutStore();
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const subtotal = getSubtotal();
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className="bg-white p-6 mb-6 border border-neutral-200">
      <h2 className="font-semibold text-lg mb-6 pb-3 border-b border-neutral-200">
        Metode Pengiriman
      </h2>
      <div className="space-y-3">
        {shippingMethods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
              data.shippingMethod === method.id
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-300 hover:border-neutral-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                checked={data.shippingMethod === method.id}
                onChange={() => setField('shippingMethod', method.id as typeof data.shippingMethod)}
                className="accent-neutral-900"
              />
              <div>
                <div className="font-medium">{method.name}</div>
                <div className="text-xs text-neutral-500">{method.description}</div>
              </div>
            </div>
            <span className="font-medium">
              {freeShipping ? (
                <span className="text-green-600">Gratis</span>
              ) : (
                formatPrice(method.price)
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
