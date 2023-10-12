'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckoutProgress } from '@/components/checkout/checkout-progress';
import { ContactForm } from '@/components/checkout/contact-form';
import { ShippingAddressForm } from '@/components/checkout/shipping-address-form';
import { ShippingMethodSelector } from '@/components/checkout/shipping-method-selector';
import { OrderSummaryCard } from '@/components/checkout/order-summary-card';
import { useCartStore } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { isValidEmail, isValidPhone } from '@/lib/utils/validators';

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCartStore();
  const { data } = useCheckoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if cart is empty
  if (items.length === 0 && typeof window !== 'undefined') {
    // Only redirect on client side
    if (!isSubmitting) {
      // Don't redirect during render
    }
  }

  const validateForm = (): boolean => {
    if (!data.email || !isValidEmail(data.email)) return false;
    if (!data.phone || !isValidPhone(data.phone)) return false;
    if (!data.fullName.trim()) return false;
    if (!data.address1.trim()) return false;
    if (!data.city.trim()) return false;
    if (!data.postalCode.trim()) return false;
    if (!data.province) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Mohon lengkapi semua data yang diperlukan');
      return;
    }

    setIsSubmitting(true);

    // TODO: Create order via API and get Midtrans snap token
    // For now, redirect to success page with mock data
    const orderId = `ARD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    // In production, this would:
    // 1. Create order in database
    // 2. Get Midtrans snap token
    // 3. Redirect to Midtrans payment page
    
    // For now, simulate redirect to success
    setTimeout(() => {
      router.push(`/checkout/success?order_id=${orderId}`);
    }, 500);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <CheckoutProgress currentStep="information" />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-semibold mb-4">Keranjang Kosong</h2>
          <p className="text-neutral-500 mb-6">Tambahkan produk ke keranjang untuk melanjutkan checkout.</p>
          <Link
            href="/produk"
            className="inline-block bg-neutral-900 text-white px-8 py-3 text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors"
          >
            Mulai Belanja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Progress */}
      <CheckoutProgress currentStep="information" />

      {/* Checkout Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Forms */}
          <div className="flex-1">
            <ContactForm />
            <ShippingAddressForm />
            <ShippingMethodSelector />

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-neutral-900 text-white py-4 text-center text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Memproses...' : 'Lanjut ke Pembayaran'}
            </button>
            
            <Link
              href="/cart"
              className="block mt-4 text-sm text-neutral-500 text-center hover:text-neutral-900 transition-colors"
            >
              ← Kembali ke Keranjang
            </Link>
          </div>

          {/* Order Summary */}
          <OrderSummaryCard />
        </div>
      </div>
    </div>
  );
}
