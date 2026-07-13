'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { CheckoutProgress } from '@/components/checkout/checkout-progress';
import { ContactForm } from '@/components/checkout/contact-form';
import { ShippingAddressForm } from '@/components/checkout/shipping-address-form';
import { ShippingMethodSelector } from '@/components/checkout/shipping-method-selector';
import { OrderSummaryCard } from '@/components/checkout/order-summary-card';
import { USPSection } from '@/components/layout/usp-section';
import { useCartStore, useCartSync } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { isValidEmail, isValidPhone } from '@/lib/utils/validators';

export default function CheckoutPage() {
  const router = useRouter();
  
  // Sync cart on mount
  useCartSync();
  
  const { items } = useCartStore();
  const { data, setField } = useCheckoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const validateForm = useCallback((): boolean => {
    if (!data.email || !isValidEmail(data.email)) return false;
    if (!data.phone || !isValidPhone(data.phone)) return false;
    if (!data.fullName.trim()) return false;
    if (!data.rajaongkirCityId) return false; // Destination is mandatory
    if (!data.address1.trim()) return false; // Street address is mandatory
    return true;
  }, [data.email, data.phone, data.fullName, data.rajaongkirCityId, data.address1]);

  // Create checkout session when form is valid
  const createCheckoutSession = useCallback(async () => {
    if (!validateForm() || data.checkoutSessionId) return;

    setIsCreatingSession(true);
    try {
      const response = await fetch('/api/checkout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
          fullName: data.fullName,
          // Street address
          address1: data.address1,
          address2: data.address2,
          notes: data.notes,
          // RajaOngkir destination
          rajaongkirCityId: data.rajaongkirCityId,
          rajaongkirCityName: data.rajaongkirCityName,
          rajaongkirProvince: data.rajaongkirProvince,
          rajaongkirCity: data.rajaongkirCity,
          rajaongkirDistrict: data.rajaongkirDistrict,
          rajaongkirSubdistrict: data.rajaongkirSubdistrict,
          rajaongkirPostalCode: data.rajaongkirPostalCode,
          // City/province for backward compatibility
          city: data.rajaongkirCity || data.rajaongkirDistrict,
          province: data.rajaongkirProvince,
          postalCode: data.rajaongkirPostalCode,
          shippingMethod: data.shippingMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const result = await response.json();
      setField('checkoutSessionId', result.checkoutSession.id);
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  }, [data, setField, validateForm]);

  // Update shipping method on the server
  const updateShippingMethod = useCallback(async (shippingMethod: typeof data.shippingMethod) => {
    if (!data.checkoutSessionId) return;

    try {
      const response = await fetch('/api/checkout/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingMethod }),
      });

      if (!response.ok) {
        // Session is stale (already paid / payment in flight / expired) -
        // drop it so the next render creates a fresh one (with the current
        // shipping method already included), instead of getting stuck.
        setField('checkoutSessionId', null);
        const error = await response.json();
        throw new Error(error.error || 'Failed to update shipping method');
      }
    } catch (error) {
      console.error('Error updating shipping method:', error);
    }
  }, [data.checkoutSessionId, setField]);

  // Auto-create session when form becomes valid
  useEffect(() => {
    if (validateForm() && !data.checkoutSessionId && !isCreatingSession) {
      createCheckoutSession();
    }
  }, [validateForm, data.checkoutSessionId, isCreatingSession, createCheckoutSession]);

  // Track previous shipping method to detect changes
  const [prevShippingMethod, setPrevShippingMethod] = useState(data.shippingMethod);
  
  // Update shipping method on server when it changes
  useEffect(() => {
    if (data.checkoutSessionId && data.shippingMethod !== prevShippingMethod) {
      setPrevShippingMethod(data.shippingMethod);
      updateShippingMethod(data.shippingMethod);
    }
  }, [data.shippingMethod, data.checkoutSessionId, prevShippingMethod, updateShippingMethod]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Mohon lengkapi semua data yang diperlukan');
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure we have a checkout session
      let sessionId = data.checkoutSessionId;
      if (!sessionId) {
        // Create session if not exists
        const createResponse = await fetch('/api/checkout/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            phone: data.phone,
            fullName: data.fullName,
            address1: data.address1,
            address2: data.address2,
            notes: data.notes,
            rajaongkirCityId: data.rajaongkirCityId,
            rajaongkirCityName: data.rajaongkirCityName,
            rajaongkirProvince: data.rajaongkirProvince,
            rajaongkirCity: data.rajaongkirCity,
            rajaongkirDistrict: data.rajaongkirDistrict,
            rajaongkirSubdistrict: data.rajaongkirSubdistrict,
            rajaongkirPostalCode: data.rajaongkirPostalCode,
            city: data.rajaongkirCity || data.rajaongkirDistrict,
            province: data.rajaongkirProvince,
            postalCode: data.rajaongkirPostalCode,
            shippingMethod: data.shippingMethod,
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(error.error || 'Failed to create checkout session');
        }

        const createResult = await createResponse.json();
        sessionId = createResult.checkoutSession.id;
        setField('checkoutSessionId', sessionId);
      }

      // Ensure shipping method is updated
      const shippingUpdateResponse = await fetch('/api/checkout/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingMethod: data.shippingMethod }),
      });

      if (!shippingUpdateResponse.ok) {
        // Cached session is stale - drop it so the next click starts fresh
        // instead of repeatedly failing against a dead session id.
        setField('checkoutSessionId', null);
        throw new Error('Sesi checkout sudah tidak berlaku, silakan coba lagi');
      }

      // Create payment transaction
      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutSessionId: sessionId }),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        if (paymentResponse.status === 400 || paymentResponse.status === 404) {
          // Session is invalid/already paid, not a transient failure -
          // reusing it again would just fail the same way.
          setField('checkoutSessionId', null);
        }
        throw new Error(error.error || 'Failed to create payment transaction');
      }

      const paymentResult = await paymentResponse.json();
      const { redirectUrl } = paymentResult.data;

      // Open payment in a new tab and redirect current tab to /account
      window.open(redirectUrl, '_blank');
      router.push('/account');
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Terjadi kesalahan, silakan coba lagi');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
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
      <CheckoutProgress currentStep="information" />

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

      <section className="py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="flex-1">
              <ContactForm />
              <ShippingAddressForm />
              <ShippingMethodSelector checkoutSessionId={data.checkoutSessionId} />

              <div className="mt-8">
                <AnimatedButton
                  onClick={handleSubmit}
                  disabled={isSubmitting || isCreatingSession}
                  className="w-full py-4 text-base"
                >
                  {isCreatingSession 
                    ? 'Menyiapkan checkout...' 
                    : isSubmitting 
                      ? 'Memproses pembayaran...' 
                      : 'Lanjut ke Pembayaran'} <Icon icon="solar:arrow-right-linear" className="w-5 h-5" />
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

            <div className="lg:w-[480px]">
              <OrderSummaryCard />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}
