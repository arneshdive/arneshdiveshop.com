'use client';

import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { CartItem } from '@/components/cart/cart-item';
import { OrderSummary } from '@/components/cart/order-summary';
import { EmptyCart } from '@/components/cart/empty-cart';
import { useCartStore } from '@/lib/store/cart';

export default function CartPage() {
  const items = useCartStore((state) => state.items);

  return (
    <>
      {/* Title Section - Full width, no container */}
      <section className="pt-12 lg:pt-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between">
            <div>
              <span className="inline-block text-xs uppercase tracking-widest text-neutral-500 mb-3">
                Belanja
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter">
                Keranjang Anda
              </h1>
            </div>
            {items.length > 0 && (
              <AnimatedButton asChild variant="outline" className="hidden sm:flex px-6 py-3 text-sm">
                <Link href="/produk">
                  Lanjut Belanja
                </Link>
              </AnimatedButton>
            )}
          </div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Cart Items */}
              <div className="flex-1">
                {items.map((item, index) => (
                  <div key={item.id} className={index !== items.length - 1 ? 'border-b border-neutral-200' : ''}>
                    <CartItem item={item} />
                  </div>
                ))}
                
                {/* Mobile: Lanjut Belanja */}
                <AnimatedButton asChild variant="outline" className="sm:hidden flex mt-8 px-6 py-3 text-sm uppercase tracking-wider">
                  <Link href="/produk">
                    Lanjut Belanja
                  </Link>
                </AnimatedButton>
              </div>

              {/* Order Summary */}
              <div className="lg:w-[380px]">
                <OrderSummary />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
