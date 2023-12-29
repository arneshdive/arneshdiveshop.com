'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { orderStatusConfig } from '@/lib/constants/order-status';
import { formatRupiah, formatDate, formatDateTime } from '@/lib/utils/format';
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

// Status config for customer-facing view (ping dot style)
const customerStatusConfig: Record<OrderStatus, { label: string; textClass: string; dotClass: string; pingClass: string }> = {
  pending_payment: { label: 'Perlu Dibayar', textClass: 'text-amber-700', dotClass: 'bg-amber-500', pingClass: 'bg-amber-400' },
  processing: { label: 'Diproses', textClass: 'text-blue-700', dotClass: 'bg-blue-500', pingClass: 'bg-blue-400' },
  shipped: { label: 'Dikirim', textClass: 'text-purple-700', dotClass: 'bg-purple-500', pingClass: 'bg-purple-400' },
  delivered: { label: 'Selesai', textClass: 'text-green-700', dotClass: 'bg-green-500', pingClass: 'bg-green-400' },
  cancelled: { label: 'Dibatalkan', textClass: 'text-red-700', dotClass: 'bg-red-500', pingClass: 'bg-red-400' },
  refunded: { label: 'Dikembalikan', textClass: 'text-red-700', dotClass: 'bg-red-500', pingClass: 'bg-red-400' },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Menunggu', color: 'text-amber-600' },
  paid: { label: 'Dibayar', color: 'text-green-600' },
  failed: { label: 'Gagal', color: 'text-red-600' },
  expired: { label: 'Kadaluarsa', color: 'text-neutral-500' },
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/orders/${resolvedParams.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Pesanan tidak ditemukan');
          } else if (response.status === 403) {
            setError('Anda tidak memiliki akses ke pesanan ini');
          } else {
            setError('Gagal memuat pesanan');
          }
          return;
        }

        const data = await response.json();
        setOrder(data.order);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Gagal memuat pesanan');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [resolvedParams.id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">Memuat pesanan...</p>
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
        <h1 className="text-2xl font-bold tracking-tighter mb-4">
          {error || 'Pesanan Tidak Ditemukan'}
        </h1>
        <p className="text-neutral-500 mb-8">
          Pesanan yang Anda cari tidak dapat ditemukan atau Anda tidak memiliki akses.
        </p>
        <AnimatedButton asChild className="py-3">
          <Link href="/account/orders">
            Kembali ke Daftar Pesanan
          </Link>
        </AnimatedButton>
      </div>
    );
  }

  const status = customerStatusConfig[order.status];
  const payment = order.payments[0];
  const isPendingPayment = payment?.status === 'pending' && order.status === 'pending_payment';
  const paymentStatus = payment ? paymentStatusConfig[payment.status] : null;

  // Full shipping address
  const fullAddress = [
    order.shippingAddress1,
    order.shippingAddress2,
    order.shippingCity,
    order.shippingState,
    order.shippingPostalCode,
  ].filter(Boolean).join(', ');

  const customerName = `${order.shippingFirstName} ${order.shippingLastName}`.trim();
  
  // VA payment instructions from Midtrans metadata
  const vaNumber = payment?.metadata?.va_numbers as { bank: string; va_number: string }[] | undefined;
  const billKey = payment?.metadata?.bill_key as string | undefined;
  const billCode = payment?.metadata?.biller_code as string | undefined;
  const paymentDeadline = payment?.expiredAt ? new Date(payment.expiredAt) : null;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
      >
        <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
        Kembali ke Pesanan
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Pesanan #{order.orderNumber}
          </h1>
          <p className="text-neutral-500">
            Dibuat pada {formatDate(order.createdAt)}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full ${orderStatusConfig[order.status].bgColor}`}>
          <span className={`text-sm font-medium ${orderStatusConfig[order.status].color}`}>
            {orderStatusConfig[order.status].label}
          </span>
        </div>
      </div>

      {/* Payment Instructions for Pending Payment */}
      {isPendingPayment && (
        <div className="bg-amber-50 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <Icon icon="solar:clock-circle-bold" className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-amber-900 mb-1">Menunggu Pembayaran</h2>
              <p className="text-sm text-amber-700">
                Selesaikan pembayaran Anda sebelum deadline berikut
              </p>
            </div>
          </div>

          {paymentDeadline && (
            <div className="bg-white rounded-xl p-4 mb-4">
              <p className="text-sm text-neutral-500 mb-1">Batas Waktu Pembayaran</p>
              <p className="font-semibold text-neutral-900">{formatDateTime(paymentDeadline)}</p>
            </div>
          )}

          {/* VA Instructions */}
          {vaNumber && vaNumber.length > 0 && (
            <div className="space-y-3">
              {vaNumber.map((va, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4">
                  <p className="text-sm text-neutral-500 mb-1">{va.bank.toUpperCase()} Virtual Account</p>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-lg font-semibold tracking-wide">{va.va_number}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(va.va_number)}
                      className="text-sm text-amber-700 hover:text-amber-900"
                    >
                      <Icon icon="solar:copy-linear" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-sm text-amber-700">
                Transfer tepat sesuai nominal: <strong>{formatRupiah(order.totalCents)}</strong>
              </p>
            </div>
          )}

          {/* Mandiri Bill Instructions */}
          {billKey && billCode && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-neutral-500 mb-1">Mandiri Bill Payment</p>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-sm text-neutral-500">Kode Biller:</p>
                  <p className="font-mono font-semibold">{billCode}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(billCode)}
                    className="text-amber-700 hover:text-amber-900"
                  >
                    <Icon icon="solar:copy-linear" className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-neutral-500">Bill Key:</p>
                  <p className="font-mono font-semibold">{billKey}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(billKey)}
                    className="text-amber-700 hover:text-amber-900"
                  >
                    <Icon icon="solar:copy-linear" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-amber-700">
                Bayar tepat sesuai nominal: <strong>{formatRupiah(order.totalCents)}</strong>
              </p>
            </div>
          )}

          {/* Generic Payment Method */}
          {payment?.paymentMethod && !vaNumber && !billKey && (
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-neutral-500 mb-1">Metode Pembayaran</p>
              <p className="font-semibold">{formatPaymentMethod(payment.paymentMethod)}</p>
            </div>
          )}

          <AnimatedButton className="w-full mt-4 py-3">
            Bayar Sekarang
          </AnimatedButton>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-6">Item Pesanan</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-neutral-100 last:border-0 last:pb-0">
                  <div className="w-20 h-24 bg-neutral-50 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.name}
                        width={80}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon icon="solar:box-linear" className="w-8 h-8 text-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/produk/${item.product.slug}`}
                      className="font-medium hover:text-neutral-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                    {item.variant && (
                      <p className="text-sm text-neutral-400 mt-0.5">{item.variant.name}</p>
                    )}
                    <p className="text-sm text-neutral-400">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatRupiah(item.priceCents)}</p>
                    {item.quantity > 1 && (
                      <p className="text-sm text-neutral-400">{formatRupiah(item.priceCents * item.quantity)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-neutral-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span>{formatRupiah(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Ongkos Kirim</span>
                <span>{order.shippingCents > 0 ? formatRupiah(order.shippingCents) : 'Gratis'}</span>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Diskon</span>
                  <span>-{formatRupiah(order.discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-semibold pt-3 border-t border-neutral-100">
                <span>Total</span>
                <span>{formatRupiah(order.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold tracking-tight mb-3">Catatan Pesanan</h2>
              <p className="text-neutral-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Status Pesanan</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className={`relative flex h-3 w-3`}>
                {isPendingPayment && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.pingClass}`} />
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${status.dotClass}`} />
              </span>
              <span className={`font-medium ${status.textClass}`}>{status.label}</span>
            </div>
            <Link
              href="#"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Lacak status pengiriman →
            </Link>
          </div>

          {/* Payment Status */}
          {payment && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold tracking-tight mb-4">Pembayaran</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Status</span>
                  <span className={`font-medium ${paymentStatus?.color}`}>{paymentStatus?.label}</span>
                </div>
                {payment.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Metode</span>
                    <span className="text-sm">{formatPaymentMethod(payment.paymentMethod)}</span>
                  </div>
                )}
                {payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Tanggal Bayar</span>
                    <span className="text-sm">{formatDate(payment.paidAt)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-neutral-100">
                  <span className="text-sm text-neutral-500">Total</span>
                  <span className="font-semibold">{formatRupiah(payment.amountCents)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Pengiriman</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Penerima</p>
                <p className="font-medium">{customerName}</p>
                {order.shippingPhone && (
                  <p className="text-sm text-neutral-400">{order.shippingPhone}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Alamat</p>
                <p className="text-sm">{fullAddress}</p>
                <p className="text-sm text-neutral-400">{order.shippingPostalCode}</p>
                <p className="text-sm text-neutral-400">{order.shippingCountry}</p>
              </div>
            </div>
          </div>

          {/* Need Help */}
          <div className="bg-neutral-50 rounded-2xl p-6">
            <h2 className="font-semibold mb-2">Butuh Bantuan?</h2>
            <p className="text-sm text-neutral-500 mb-4">
              Hubungi customer service kami jika ada pertanyaan tentang pesanan Anda.
            </p>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              <Icon icon="solar:chat-round-dots-linear" className="w-4 h-4" />
              Chat via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    'credit_card': 'Kartu Kredit',
    'bank_transfer': 'Transfer Bank',
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
