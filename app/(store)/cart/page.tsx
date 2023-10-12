'use client';

import Link from 'next/link';
import { CartItem } from '@/components/cart/cart-item';
import { OrderSummary } from '@/components/cart/order-summary';
import { EmptyCart } from '@/components/cart/empty-cart';
import { useCartStore } from '@/lib/store/cart';

export default function CartPage() {
  const items = useCartStore((state) => state.items);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Page Title */}
      <div className="text-center pt-8 pb-4">
        <h1 className="text-2xl lg:text-3xl font-semibold">Keranjang Belanja</h1>
      </div>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
              <Link
                href="/produk"
                className="inline-block mt-6 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                ← Lanjut Belanja
              </Link>
            </div>

            {/* Order Summary */}
            <OrderSummary />
          </div>
        )}
      </div>
    </div>
  );
}
