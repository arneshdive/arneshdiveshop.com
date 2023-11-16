'use client';

import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { CartItem } from '@/components/cart/cart-item';
import { OrderSummary } from '@/components/cart/order-summary';
import { EmptyCart } from '@/components/cart/empty-cart';
import { RecentlyViewed } from '@/components/product/recently-viewed';
import { USPSection } from '@/components/layout/usp-section';
import { useCartStore } from '@/lib/store/cart';

export default function CartPage() {
  const items = useCartStore((state) => state.items);

  return (
    <>
      {/* Title Section - Full width, no container */}
      <section className="pt-8 lg:pt-16">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
          <div className="flex items-end justify-between">
            <div>
              <span className="inline-block text-[10px] uppercase tracking-widest text-neutral-500 mb-2 lg:mb-3">
                Belanja
              </span>
              <h1 className="text-3xl lg:text-5xl font-bold tracking-tighter">
                Keranjang Anda
              </h1>
            </div>
            {items.length > 0 && (
              <AnimatedButton asChild variant="outline" className="hidden sm:flex px-6 py-3 text-base">
                <Link href="/produk">
                  Lanjut Belanja
                </Link>
              </AnimatedButton>
            )}
          </div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-6 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
              {/* Cart Items */}
              <div className="flex-1">
                {items.map((item, index) => (
                  <div key={item.id} className={index !== items.length - 1 ? 'border-b border-neutral-200' : ''}>
                    <CartItem item={item} />
                  </div>
                ))}
                
                {/* Mobile: Lanjut Belanja */}
                <AnimatedButton asChild variant="outline" className="sm:hidden mt-6 px-6 py-3 text-base">
                  <Link href="/produk">
                    Lanjut Belanja
                  </Link>
                </AnimatedButton>
              </div>

              {/* Order Summary */}
              <div className="lg:w-[480px]">
                <OrderSummary />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* USP Section - overlaps the footer below it */}
      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}
