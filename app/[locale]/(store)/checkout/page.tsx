'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyCart } from '@/components/cart/empty-cart';
import { Link, useRouter } from '@/i18n/navigation';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ContactForm } from '@/components/checkout/contact-form';
import { ShippingAddressForm } from '@/components/checkout/shipping-address-form';
import { ShippingMethodSelector } from '@/components/checkout/shipping-method-selector';
import { SavedAddressSelector } from '@/components/checkout/saved-address-selector';
import { OrderSummaryCard } from '@/components/checkout/order-summary-card';
import { USPSection } from '@/components/layout/usp-section';
import { useCartStore, useCartSync } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { checkoutFormSchema } from '@/lib/validations/checkout';
import { track } from '@/lib/analytics/track';

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations('checkout');

  // Sync cart on mount
  useCartSync();
  
  const { items, getTotalCents } = useCartStore();
  const { data, setField } = useCheckoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  type CheckoutViewer = 'loading' | 'guest' | 'logged-in';
  const [viewer, setViewer] = useState<CheckoutViewer>('loading');

  // Detect login state once on mount. Any failure (network error, 401,
  // 500) fails open to the guest view - checkout must never be blocked
  // by this check.
  useEffect(() => {
    let isCancelled = false;

    async function detectViewer() {
      try {
        const response = await fetch('/api/account/profile');
        if (!response.ok) {
          if (!isCancelled) setViewer('guest');
          return;
        }

        const result = await response.json();
        if (isCancelled) return;

        setField('email', result.profile.email);
        setViewer('logged-in');
      } catch {
        if (!isCancelled) setViewer('guest');
      }
    }

    detectViewer();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = useCallback((): { isValid: boolean; missingFields: string[] } => {
    const result = checkoutFormSchema.safeParse(data);
    if (result.success) return { isValid: true, missingFields: [] };

    const fieldLabels: Record<string, string> = {
      email: t('validation.fieldEmail'),
      phone: t('validation.fieldPhone'),
      fullName: t('validation.fieldFullName'),
      rajaongkirCityId: t('validation.fieldDestination'),
      address1: t('validation.fieldAddress'),
    };
    const missingFields = [
      ...new Set(
        result.error.issues
          .map((issue) => fieldLabels[issue.path[0] as string])
          .filter((label): label is string => Boolean(label))
      ),
    ];

    return { isValid: false, missingFields };
  }, [data, t]);

  // Create checkout session when form is valid
  const createCheckoutSession = useCallback(async () => {
    const { isValid } = validateForm();
    if (!isValid || data.checkoutSessionId) return;

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
        throw new Error(error.error || t('errors.createSessionFailed'));
      }

      const result = await response.json();
      setField('checkoutSessionId', result.checkoutSession.id);
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  }, [data, setField, validateForm, t]);

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
        throw new Error(error.error || t('errors.updateShippingFailed'));
      }
    } catch (error) {
      console.error('Error updating shipping method:', error);
    }
  }, [data.checkoutSessionId, setField, t]);

  // Auto-create session when form becomes valid
  useEffect(() => {
    const { isValid } = validateForm();
    if (isValid && !data.checkoutSessionId && !isCreatingSession) {
      // Side effect triggered by form validity, not by render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      createCheckoutSession();
    }
  }, [validateForm, data.checkoutSessionId, isCreatingSession, createCheckoutSession]);

  // Track previous shipping method to detect changes
  const [prevShippingMethod, setPrevShippingMethod] = useState(data.shippingMethod);
  
  // Update shipping method on server when it changes
  useEffect(() => {
    if (data.checkoutSessionId && data.shippingMethod !== prevShippingMethod) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrevShippingMethod(data.shippingMethod);
      updateShippingMethod(data.shippingMethod);
    }
  }, [data.shippingMethod, data.checkoutSessionId, prevShippingMethod, updateShippingMethod]);

  const handleSubmit = async () => {
    const { isValid, missingFields } = validateForm();
    if (!isValid) {
      toast.error(t('validation.incompleteTitle'), {
        description: t('validation.incompleteDescription', { fields: missingFields.join(', ') }),
      });
      return;
    }

    setIsSubmitting(true);
    track('checkout_started', { itemCount: items.length, totalCents: getTotalCents() });

    // Open new tab synchronously (before async operations) to avoid popup blockers
    const paymentTab = window.open('', '_blank');
    if (paymentTab) {
      paymentTab.document.write(`<html><head><title>${t('paymentTab.title')}</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui,sans-serif;color:#666;"><p>${t('paymentTab.processing')}</p></body></html>`);
    }

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
          throw new Error(error.error || t('errors.createSessionFailed'));
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
        throw new Error(t('errors.staleSession'));
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
        throw new Error(error.error || t('errors.createPaymentFailed'));
      }

      const paymentResult = await paymentResponse.json();
      const { redirectUrl } = paymentResult.data;

      // Navigate the payment tab to Midtrans
      if (paymentTab) {
        paymentTab.location.href = redirectUrl;
      }

      toast.success(t('toast.paymentOpenedTitle'), {
        description: t('toast.paymentOpenedDescription'),
      });
      router.push('/account');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t('toast.errorTitle'), {
        description: error instanceof Error ? error.message : t('toast.genericRetry'),
      });
      // Close the payment tab if there was an error
      if (paymentTab) {
        paymentTab.close();
      }
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
                {t('title')}
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter mb-4">
                {t('title')}
              </h1>
            </div>
          </div>
        </section>
        <section className="py-12 lg:py-16">
          <EmptyCart />
        </section>
      </>
    );
  }

  return (
    <>
      <section className="relative bg-neutral-100 pt-24 pb-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="text-center">
            <h1 className="text-3xl lg:text-5xl font-bold tracking-tighter mb-2">
              {t('title')}
            </h1>
            <p className="text-neutral-500">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="flex-1">
              {viewer === 'logged-in' ? (
                <SavedAddressSelector />
              ) : (
                <>
                  <ContactForm />
                  <ShippingAddressForm />
                </>
              )}
              <ShippingMethodSelector checkoutSessionId={data.checkoutSessionId} />

              <div className="mt-8">
                <AnimatedButton
                  onClick={handleSubmit}
                  disabled={isSubmitting || isCreatingSession}
                  className="w-full py-4 text-base"
                >
                  {isCreatingSession
                    ? t('preparingSession')
                    : isSubmitting
                      ? t('processingPayment')
                      : t('continueToPayment')} <Icon icon="solar:arrow-right-linear" className="w-5 h-5" />
                </AnimatedButton>
              </div>

              <Link
                href="/cart"
                className="inline-flex items-center gap-2 mt-6 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
                {t('backToCart')}
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
