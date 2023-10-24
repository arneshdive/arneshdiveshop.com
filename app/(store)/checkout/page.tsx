'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { CheckoutProgress } from '@/components/checkout/checkout-progress';
import { ContactForm } from '@/components/checkout/contact-form';
import { ShippingAddressForm } from '@/components/checkout/shipping-address-form';
import { ShippingMethodSelector } from '@/components/checkout/shipping-method-selector';
import { OrderSummaryCard } from '@/components/checkout/order-summary-card';
import { USPSection } from '@/components/usp-section';
import { useCartStore } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { isValidEmail, isValidPhone } from '@/lib/utils/validators';

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCartStore();
  const { data } = useCheckoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    if (!data.email || !isValidEmail(data.email)) return false;
    if (!data.phone || !isValidPhone(data.phone)) return false;
    if (!data.fullName.trim()) return false;
    if (!data.hasMapLocation) return false; // Map selection is mandatory
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Mohon lengkapi semua data yang diperlukan');
      return;
    }

    setIsSubmitting(true);

    // Generate order ID
    const orderId = `ARD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    // Redirect to success page
    setTimeout(() => {
      router.push(`/checkout/success?order_id=${orderId}`);
    }, 500);
  };

  if (items.length === 0) {
    return (
      <>
        {/* Hero */}
        <section className="relative bg-neutral-100 pt-24 pb-12 lg:pt-32 lg:pb-16">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
            <div className="text-center">
              <span className="inline-block text-xs uppercase tracking-widest text-neutral-500 mb-3">
                Checkout
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter mb-4">
                Keranjang Kosong
              </h1>
              <p className="text-neutral-500 max-w-md mx-auto mb-8">
                Tambahkan produk ke keranjang untuk melanjutkan checkout.
              </p>
              <AnimatedButton asChild className="px-8 py-4 text-sm uppercase tracking-wider">
                <Link href="/produk">Mulai Belanja <Icon icon="solar:arrow-right-linear" className="w-4 h-4" /></Link>
              </AnimatedButton>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Progress */}
      <CheckoutProgress currentStep="information" />

      {/* Hero */}
      <section className="relative bg-neutral-100 pt-12 pb-8">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="text-center">
            <h1 className="text-3xl lg:text-5xl font-bold tracking-tighter mb-2">
              Checkout
            </h1>
            <p className="text-neutral-500">
              Lengkapi informasi untuk melanjutkan
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Forms */}
            <div className="flex-1">
              <ContactForm />
              <ShippingAddressForm />
              <ShippingMethodSelector />

              <div className="mt-8">
                <AnimatedButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 text-base"
                >
                  {isSubmitting ? 'Memproses...' : 'Lanjut ke Pembayaran'} <Icon icon="solar:arrow-right-linear" className="w-5 h-5" />
                </AnimatedButton>
              </div>
              
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 mt-6 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
                Kembali ke Keranjang
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:w-[480px]">
              <OrderSummaryCard />
            </div>
          </div>
        </div>
      </section>

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
