'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { useCartStore } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { track } from '@/lib/analytics/track';
import { formatRupiah, formatDate } from '@/lib/utils/format';
import { productImageUrl } from '@/lib/utils/product-image';
import { orderStatusConfig } from '@/lib/constants/order-status';
import type { OrderStatus, PaymentStatus } from '@/lib/db/schema';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  priceCents: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[] | null;
  };
  variant: {
    id: string;
    name: string;
  } | null;
}

interface Payment {
  id: string;
  status: PaymentStatus;
  amountCents: number;
  provider: string;
  paymentMethod: string | null;
  paidAt: string | null;
  metadata: Record<string, unknown> | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string | null;
  shippingAddress1: string;
  shippingAddress2: string | null;
  shippingCity: string;
  shippingState: string | null;
  shippingPostalCode: string;
  shippingCountry: string;
  createdAt: string;
  items: OrderItem[];
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  payments: Payment[];
}

export function CheckoutSuccessContent() {
  const t = useTranslations('checkout');
  const tOrderStatus = useTranslations('account.orders.status');
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();
  const { data: checkoutData, reset } = useCheckoutStore();
  const hasCleared = useRef(false);
  const hasTracked = useRef(false);

  // Store guest email in a ref before reset clears it
  // This is crucial for guest checkout order access
  const guestEmailRef = useRef<string | null>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
  };

  const orderId = searchParams.get('order_id');

  // Capture guest email on mount before reset clears checkout store
  useEffect(() => {
    if (!guestEmailRef.current && checkoutData.email) {
      guestEmailRef.current = checkoutData.email;
    }
  }, [checkoutData.email]);

  // Fetch order data
  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        // Build URL with email parameter for guest access
        const email = guestEmailRef.current;
        const url = email 
          ? `/api/orders/${orderId}?email=${encodeURIComponent(email)}`
          : `/api/orders/${orderId}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(t('success.errors.notFound'));
          } else if (response.status === 403) {
            setError(t('success.errors.noAccess'));
          } else {
            setError(t('success.errors.loadFailed'));
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setOrder(data.order);

        if (!hasTracked.current) {
          hasTracked.current = true;
          track('purchase_completed', {
            orderNumber: data.order.orderNumber,
            totalCents: data.order.totalCents,
            itemCount: data.order.items.length,
          });
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(t('success.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, t]);

  // Clear cart and checkout data on successful order - only once
  useEffect(() => {
    if (hasCleared.current) return;
    hasCleared.current = true;
    
    // Delay reset to allow order fetch to complete with guest email
    const timer = setTimeout(() => {
      clearCart();
      reset();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [clearCart, reset]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">{t('success.loadingOrder')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Icon icon="solar:close-circle-bold" className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-4">
            {error || t('success.errors.notFoundTitle')}
          </h1>
          <p className="text-neutral-500 mb-8">
            {t('success.errors.notFoundDescription')}
          </p>
          <AnimatedButton asChild className="py-3">
            <Link href="/account/orders">
              {t('success.errors.viewMyOrders')}
            </Link>
          </AnimatedButton>
        </div>
      </section>
    );
  }

  // Get payment info
  const payment = order.payments[0];
  const isPendingPayment = payment?.status === 'pending';

  // Full shipping address
  const fullAddress = [
    order.shippingAddress1,
    order.shippingAddress2,
    order.shippingCity,
    order.shippingState,
    order.shippingPostalCode,
  ].filter(Boolean).join(', ');

  // Customer name
  const customerName = `${order.shippingFirstName} ${order.shippingLastName}`.trim();


  return (
    <>
      {/* Hero */}
      <section className="relative bg-neutral-100 pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Icon icon="solar:check-circle-bold" className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter mb-4">
              {t('success.thankYouTitle')}
            </h1>
            <p className="text-neutral-500 max-w-md mx-auto mb-4">
              {t('success.thankYouDescription')}
            </p>
            <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm">
              <span className="text-sm text-neutral-500">{t('success.orderNumberLabel')}</span>
              <span className="font-semibold">{order.orderNumber}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Order Status Banner */}
            <div className={`p-4 ${isPendingPayment ? 'bg-amber-50' : 'bg-green-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon 
                    icon={isPendingPayment ? 'solar:clock-circle-linear' : 'solar:check-circle-linear'} 
                    className={`w-5 h-5 ${isPendingPayment ? 'text-amber-600' : 'text-green-600'}`} 
                  />
                  <span className={`font-medium ${isPendingPayment ? 'text-amber-900' : 'text-green-900'}`}>
                    {isPendingPayment ? t('success.pendingPayment') : t('success.orderConfirmed')}
                  </span>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full ${orderStatusConfig[order.status].bgColor} ${orderStatusConfig[order.status].color}`}>
                  {tOrderStatus(order.status)}
                </span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="p-8 border-b border-neutral-100">
              <h2 className="text-xl font-semibold tracking-tight mb-6">{t('success.shippingInfoTitle')}</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">{t('success.nameLabel')}</p>
                  <p className="font-medium">{customerName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">{t('success.orderDateLabel')}</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-neutral-400 mb-1">{t('success.addressLabel')}</p>
                  <p className="font-medium">{fullAddress || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">{t('success.emailLabel')}</p>
                  <p className="font-medium">{order.customer.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">{t('success.phoneLabel')}</p>
                  <p className="font-medium">{order.shippingPhone || order.customer.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-8 border-b border-neutral-100">
              <h2 className="text-xl font-semibold tracking-tight mb-6">{t('success.orderDetailsTitle')}</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 bg-neutral-100 rounded-xl overflow-hidden flex items-center justify-center text-neutral-300">
                      {item.product.images?.[0] && !failedImages.has(item.product.images[0]) ? (
                        <Image
                          src={productImageUrl(item.product.images[0], 'thumb')!}
                          alt={item.name}
                          width={64}
                          height={80}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(item.product.images![0]!)}
                        />
                      ) : (
                        <Icon icon="solar:box-linear" className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-neutral-400">
                        {item.variant?.name && `${item.variant.name} • `}{t('success.qtyLabel', { quantity: item.quantity })}
                      </p>
                    </div>
                    <p className="font-medium">{formatRupiah(item.priceCents)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">{t('success.subtotal')}</span>
                  <span>{formatRupiah(order.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">{t('success.shippingCost')}</span>
                  <span>{order.shippingCents > 0 ? formatRupiah(order.shippingCents) : t('success.free')}</span>
                </div>
                {order.discountCents > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('success.discount')}</span>
                    <span>-{formatRupiah(order.discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-3 border-t border-neutral-100">
                  <span>{t('success.total')}</span>
                  <span>{formatRupiah(order.totalCents)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {isPendingPayment && (
              <div className="p-8 bg-amber-50">
                <div className="flex gap-3">
                  <Icon icon="solar:info-circle-linear" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 mb-1">{t('success.paymentInstructionsTitle')}</p>
                    <p className="text-sm text-amber-700 mb-4">
                      {t('success.paymentInstructionsDescription')}
                    </p>
                    {payment?.paymentMethod && (
                      <p className="text-sm text-amber-700">
                        <span className="font-medium">{t('success.paymentMethodLabel')}</span>{' '}
                        {formatPaymentMethod(payment.paymentMethod, t)}
                      </p>
                    )}
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-block mt-4 text-sm font-medium text-amber-900 hover:text-amber-700 underline"
                    >
                      {t('success.viewPaymentDetails')}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Completed Info */}
            {!isPendingPayment && payment?.paidAt && (
              <div className="p-6 bg-green-50">
                <div className="flex gap-3 items-center">
                  <Icon icon="solar:check-circle-linear" className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      {t('success.paymentCompleted', { date: formatDate(payment.paidAt) })}
                    </p>
                    {payment.paymentMethod && (
                      <p className="text-sm text-green-700">
                        {t('success.paymentMethodShort', { method: formatPaymentMethod(payment.paymentMethod, t) })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <AnimatedButton asChild className="flex-1 py-4 text-sm uppercase tracking-wider">
              <Link href="/account/orders">
                {t('success.viewOrders')}
              </Link>
            </AnimatedButton>
            <Link
              href="/"
              className="flex-1 py-4 text-center text-sm uppercase tracking-wider border-2 border-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              {t('success.continueShopping')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function formatPaymentMethod(method: string, t: ReturnType<typeof useTranslations>): string {
  const methods: Record<string, string> = {
    'credit_card': t('success.paymentMethods.creditCard'),
    'bank_transfer': t('success.paymentMethods.bankTransfer'),
    // Brand/service names - kept identical across locales.
    'bca_va': 'BCA Virtual Account',
    'bni_va': 'BNI Virtual Account',
    'bri_va': 'BRI Virtual Account',
    'echannel': 'Mandiri Bill Payment',
    'gopay': 'GoPay',
    'gopay_partner': 'GoPay',
    'ovo': 'OVO',
    'shopeepay': 'ShopeePay',
    'qris': 'QRIS',
    'danamon_online': 'Danamon Online',
    'akulaku': 'Akulaku',
  };

  return methods[method] || method;
}
