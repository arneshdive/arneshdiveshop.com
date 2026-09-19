'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { AnimatedButton } from '@/components/ui/animated-button';
import { cn } from '@/lib/utils/cn';
import { orderStatusConfig } from '@/lib/constants/order-status';
import { formatRupiah, formatDate, formatDateTime, toTitleCase } from '@/lib/utils/format';
import { productImageUrl } from '@/lib/utils/product-image';
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
  providerTransactionId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  expiredAt: string | null;
  metadata: Record<string, unknown> | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  trackingNumber: string | null;
  shippedAt: string | null;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  notes: string | null;
  createdAt: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string | null;
  shippingAddress1: string;
  shippingAddress2: string | null;
  shippingCity: string;
  shippingState: string | null;
  shippingPostalCode: string;
  shippingCountry: string;
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

interface ShopSettings {
  whatsapp: string;
  phone: string;
}

// Style config for customer-facing view. Labels come from translation keys
// (account.orders.status.<value> / account.orders.paymentStatus.<value>)
// rather than being hardcoded, since both are backend-enum-backed.
const customerStatusConfig: Record<OrderStatus, { textClass: string; dotClass: string; pingClass: string }> = {
  pending_payment: { textClass: 'text-amber-700', dotClass: 'bg-amber-500', pingClass: 'bg-amber-400' },
  processing: { textClass: 'text-blue-700', dotClass: 'bg-blue-500', pingClass: 'bg-blue-400' },
  shipped: { textClass: 'text-purple-700', dotClass: 'bg-purple-500', pingClass: 'bg-purple-400' },
  delivered: { textClass: 'text-green-700', dotClass: 'bg-green-500', pingClass: 'bg-green-400' },
  cancelled: { textClass: 'text-red-700', dotClass: 'bg-red-500', pingClass: 'bg-red-400' },
  refunded: { textClass: 'text-red-700', dotClass: 'bg-red-500', pingClass: 'bg-red-400' },
};

const paymentStatusColor: Record<PaymentStatus, string> = {
  pending: 'text-amber-600',
  paid: 'text-green-600',
  failed: 'text-red-600',
  expired: 'text-neutral-500',
  cancelled: 'text-red-600',
  refunded: 'text-neutral-500',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('account');
  const resolvedParams = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
  };

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/orders/${resolvedParams.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(t('orders.detail.errors.notFound'));
          } else if (response.status === 403) {
            setError(t('orders.detail.errors.forbidden'));
          } else {
            setError(t('orders.detail.errors.loadFailed'));
          }
          return;
        }

        const data = await response.json();
        setOrder(data.order);
        setShopSettings(data.shopSettings || null);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(t('orders.detail.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [resolvedParams.id, t]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">{t('orders.detail.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="py-16 text-center">
        <div className="w-20 h-20 bg-neutral-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Icon icon="solar:box-linear" className="w-10 h-10 text-neutral-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-4">
          {error || t('orders.detail.notFoundTitle')}
        </h1>
        <p className="text-neutral-500 mb-8">
          {t('orders.detail.notFoundDescription')}
        </p>
        <AnimatedButton asChild className="py-3">
          <Link href="/account/orders">
            {t('orders.detail.backToList')}
          </Link>
        </AnimatedButton>
      </div>
    );
  }

  const status = customerStatusConfig[order.status];
  const payment = order.payments[0];
  const isPendingPayment = payment?.status === 'pending' && order.status === 'pending_payment';
  const paymentStatusLabel = payment ? t(`orders.paymentStatus.${payment.status}`) : null;
  const paymentStatusColorClass = payment ? paymentStatusColor[payment.status] : null;

  // Full shipping address
  const fullAddress = [
    order.shippingAddress1,
    order.shippingAddress2,
    toTitleCase(order.shippingCity),
    order.shippingState && toTitleCase(order.shippingState),
    order.shippingPostalCode,
  ].filter(Boolean).join(', ');

  const customerName = `${order.shippingFirstName} ${order.shippingLastName}`.trim();
  
  // VA payment instructions from Midtrans metadata
  const vaNumber = payment?.metadata?.va_numbers as { bank: string; va_number: string }[] | undefined;
  const billKey = payment?.metadata?.bill_key as string | undefined;
  const billCode = payment?.metadata?.biller_code as string | undefined;
  const paymentDeadline = payment?.expiredAt ? new Date(payment.expiredAt) : null;
  const redirectUrl = payment?.metadata?.redirectUrl as string | undefined;

  const handleBayarSekarang = () => {
    if (!redirectUrl) {
      toast.error(t('orders.payLinkUnavailable.title'), {
        description: t('orders.payLinkUnavailable.description'),
      });
      return;
    }
    window.open(redirectUrl, '_blank');
  };

  return (
    <div>
      {/* Back link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
      >
        <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
        {t('orders.detail.backToOrders')}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            {t('orders.detail.orderNumber', { number: order.orderNumber })}
          </h1>
          <p className="text-neutral-500">
            {t('orders.detail.createdOn', { date: formatDate(order.createdAt) })}
          </p>
        </div>
        <div className={cn(
          'px-4 py-2 rounded-full',
          orderStatusConfig[order.status].bgColor
        )}>
          <span className={cn('text-sm font-medium', orderStatusConfig[order.status].color)}>
            {t(`orders.status.${order.status}`)}
          </span>
        </div>
      </div>

      {/* Payment Banner for Pending Payment */}
      {isPendingPayment && (
        <div className="bg-amber-50 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:clock-circle-bold" className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-amber-900 mb-1">
                {t('orders.detail.paymentBanner.title')}
              </h2>
              <p className="text-sm text-amber-700">
                {t('orders.detail.paymentBanner.description')}
              </p>
            </div>
          </div>

          {paymentDeadline && (
            <div className="bg-white rounded-xl p-4 mb-4">
              <p className="text-sm text-neutral-500 mb-1">{t('orders.detail.paymentBanner.deadlineLabel')}</p>
              <p className="font-semibold text-neutral-900">{formatDateTime(paymentDeadline)}</p>
            </div>
          )}

          {/* VA Instructions */}
          {vaNumber && vaNumber.length > 0 && (
            <div className="space-y-3">
              {vaNumber.map((va, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4">
                  <p className="text-sm text-neutral-500 mb-1">
                    {t('orders.detail.paymentBanner.vaLabel', { bank: va.bank.toUpperCase() })}
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-lg font-semibold tracking-wide">{va.va_number}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(va.va_number)}
                      className="text-sm text-amber-700 hover:text-amber-900 transition-colors"
                    >
                      <Icon icon="solar:copy-linear" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-sm text-amber-700">
                {t('orders.detail.paymentBanner.transferExact', { amount: formatRupiah(order.totalCents) })}
              </p>
            </div>
          )}

          {/* Mandiri Bill Instructions */}
          {billKey && billCode && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-neutral-500 mb-2">{t('orders.detail.paymentBanner.mandiriTitle')}</p>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-sm text-neutral-500">{t('orders.detail.paymentBanner.billerCode')}</p>
                  <p className="font-mono font-semibold">{billCode}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(billCode)}
                    className="text-amber-700 hover:text-amber-900 transition-colors"
                  >
                    <Icon icon="solar:copy-linear" className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-neutral-500">{t('orders.detail.paymentBanner.billKey')}</p>
                  <p className="font-mono font-semibold">{billKey}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(billKey)}
                    className="text-amber-700 hover:text-amber-900 transition-colors"
                  >
                    <Icon icon="solar:copy-linear" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-amber-700">
                {t('orders.detail.paymentBanner.payExact', { amount: formatRupiah(order.totalCents) })}
              </p>
            </div>
          )}

          {/* Generic Payment Method */}
          {payment?.paymentMethod && !vaNumber && !billKey && (
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-neutral-500 mb-1">{t('orders.detail.paymentBanner.methodLabel')}</p>
              <p className="font-semibold">{formatPaymentMethod(payment.paymentMethod, t)}</p>
            </div>
          )}

          <AnimatedButton
            onClick={handleBayarSekarang}
            className="w-full mt-4 py-3 text-sm uppercase tracking-wider"
          >
            {t('orders.payNow')}
          </AnimatedButton>
        </div>
      )}

      {/* Items Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold tracking-tight mb-4">{t('orders.detail.items.title')}</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 bg-neutral-50 rounded-xl p-4"
            >
              <div className="w-20 h-24 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.product.images?.[0] && !failedImages.has(item.product.images[0]) ? (
                  <Image
                    src={productImageUrl(item.product.images[0], 'thumb')!}
                    alt={item.name}
                    width={80}
                    height={96}
                    className="w-full h-full object-cover mix-blend-multiply"
                    onError={() => handleImageError(item.product.images![0]!)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon icon="solar:box-linear" className="w-8 h-8 text-neutral-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <Link
                  href={`/produk/${item.product.slug}`}
                  className="font-medium tracking-tight hover:text-neutral-600 transition-colors"
                >
                  {item.name}
                </Link>
                {item.variant && (
                  <p className="text-sm text-neutral-400">{item.variant.name}</p>
                )}
                <p className="text-sm text-neutral-400">{t('orders.qtyLabel', { count: item.quantity })}</p>
              </div>
              <div className="text-right flex flex-col justify-center">
                <p className="font-semibold tracking-tight">{formatRupiah(item.priceCents)}</p>
                {item.quantity > 1 && (
                  <p className="text-sm text-neutral-400">{formatRupiah(item.priceCents * item.quantity)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-neutral-50 rounded-2xl p-6 mb-8">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">{t('orders.detail.summary.subtotal')}</span>
            <span className="font-medium">{formatRupiah(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">{t('orders.detail.summary.shipping')}</span>
            <span className="font-medium">{order.shippingCents > 0 ? formatRupiah(order.shippingCents) : t('orders.detail.summary.free')}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{t('orders.detail.summary.discount')}</span>
              <span className="font-medium">-{formatRupiah(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold pt-3 border-t border-neutral-200">
            <span>{t('orders.total')}</span>
            <span>{formatRupiah(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        {/* Tracking Number */}
        {order.status === 'shipped' || order.status === 'delivered' ? (
          <div className="bg-neutral-50 rounded-2xl p-6 sm:col-span-2">
            <h3 className="font-semibold tracking-tight mb-4">{t('orders.detail.tracking.title')}</h3>
            {order.trackingNumber ? (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 bg-white rounded-xl px-4 py-3 border border-neutral-200">
                    <p className="font-mono text-lg font-semibold tracking-wide">{order.trackingNumber}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(order.trackingNumber!)}
                    className="p-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors"
                    title={t('orders.detail.tracking.copyHint')}
                  >
                    <Icon icon="solar:copy-linear" className="w-5 h-5" />
                  </button>
                </div>
                {order.shippedAt && (
                  <p className="text-sm text-neutral-500">
                    {t('orders.detail.tracking.shippedOn', { date: formatDate(order.shippedAt) })}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="solar:delivery-linear" className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">
                    {t('orders.detail.tracking.inTransit')}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Order Status */}
        <div className="bg-neutral-50 rounded-2xl p-6">
          <h3 className="font-semibold tracking-tight mb-4">{t('orders.detail.status.title')}</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-3 w-3">
              {isPendingPayment && (
                <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', status.pingClass)} />
              )}
              <span className={cn('relative inline-flex rounded-full h-3 w-3', status.dotClass)} />
            </span>
            <span className={cn('font-medium', status.textClass)}>{t(`orders.status.${order.status}`)}</span>
          </div>
          {(order.status === 'processing' || order.status === 'pending_payment') && !order.trackingNumber && (
            <p className="text-sm text-neutral-500">
              {order.status === 'processing'
                ? t('orders.detail.status.processingNote')
                : t('orders.detail.status.waitingPayment')}
            </p>
          )}
        </div>

        {/* Payment Status */}
        {payment && (
          <div className="bg-neutral-50 rounded-2xl p-6">
            <h3 className="font-semibold tracking-tight mb-4">{t('orders.detail.payment.title')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">{t('orders.detail.payment.statusLabel')}</span>
                <span className={cn('font-medium', paymentStatusColorClass)}>{paymentStatusLabel}</span>
              </div>
              {payment.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">{t('orders.detail.payment.methodLabel')}</span>
                  <span className="text-sm font-medium">{formatPaymentMethod(payment.paymentMethod, t)}</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">{t('orders.detail.payment.paidAtLabel')}</span>
                  <span className="text-sm font-medium">{formatDate(payment.paidAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shipping Info */}
        <div className="bg-neutral-50 rounded-2xl p-6">
          <h3 className="font-semibold tracking-tight mb-4">{t('orders.detail.shipping.title')}</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-neutral-500 mb-1">{t('orders.detail.shipping.recipient')}</p>
              <p className="font-medium">{customerName}</p>
              {order.shippingPhone && (
                <p className="text-sm text-neutral-400">{order.shippingPhone}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">{t('orders.detail.shipping.address')}</p>
              <p className="text-sm">{fullAddress}</p>
              <p className="text-sm text-neutral-400">{order.shippingCountry}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-neutral-50 rounded-2xl p-6">
            <h3 className="font-semibold tracking-tight mb-3">{t('orders.detail.notes.title')}</h3>
            <p className="text-neutral-600">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Need Help */}
      <div className="bg-neutral-900 rounded-2xl p-6 text-white">
        <h3 className="font-semibold mb-2">{t('orders.detail.help.title')}</h3>
        <p className="text-sm text-neutral-300 mb-4">
          {t('orders.detail.help.description')}
        </p>
        <a
          href={`https://wa.me/${shopSettings?.whatsapp || '6281234567890'}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-neutral-300 transition-colors"
        >
          <Icon icon="solar:chat-round-dots-linear" className="w-4 h-4" />
          {t('orders.detail.help.whatsapp')}
        </a>
      </div>
    </div>
  );
}

function formatPaymentMethod(method: string, t: ReturnType<typeof useTranslations>): string {
  const methods: Record<string, string> = {
    'credit_card': t('orders.paymentMethods.credit_card'),
    'bank_transfer': t('orders.paymentMethods.bank_transfer'),
    'bca_va': t('orders.paymentMethods.bca_va'),
    'bni_va': t('orders.paymentMethods.bni_va'),
    'bri_va': t('orders.paymentMethods.bri_va'),
    'echannel': t('orders.paymentMethods.echannel'),
    'gopay': t('orders.paymentMethods.gopay'),
    'gopay_partner': t('orders.paymentMethods.gopay_partner'),
    'ovo': t('orders.paymentMethods.ovo'),
    'shopeepay': t('orders.paymentMethods.shopeepay'),
    'qris': t('orders.paymentMethods.qris'),
    'danamon_online': t('orders.paymentMethods.danamon_online'),
    'akulaku': t('orders.paymentMethods.akulaku'),
  };
  
  return methods[method] || method;
}
