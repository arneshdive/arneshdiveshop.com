'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { formatRupiah, formatDate } from '@/lib/utils/format';
import { orderStatusConfig } from '@/lib/constants/order-status';
import { cn } from '@/lib/utils/cn';
import type { OrderStatus } from '@/lib/db/schema';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

// Valid status transitions
const VALID_TRANSITIONS: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  pending_payment: [
    { status: 'processing', label: 'Tandai Dibayar' },
    { status: 'cancelled', label: 'Batalkan' },
  ],
  processing: [
    { status: 'shipped', label: 'Kirim Pesanan' },
    { status: 'cancelled', label: 'Batalkan' },
  ],
  shipped: [
    { status: 'delivered', label: 'Tandai Diterima' },
    { status: 'cancelled', label: 'Batalkan' },
  ],
  delivered: [
    { status: 'refunded', label: 'Refund' },
  ],
  cancelled: [],
  refunded: [],
};

// API Order type from admin orders page
interface ApiOrder {
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
  createdAt: string;
  updatedAt: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string | null;
  shippingAddress1: string;
  shippingAddress2: string | null;
  shippingCity: string;
  shippingState: string | null;
  shippingPostalCode: string;
  shippingCountry: string;
  notes: string | null;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    name: string;
    quantity: number;
    priceCents: number;
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[] | null;
    };
    variant: { id: string; name: string } | null;
  }>;
  payments: Array<{
    id: string;
    status: PaymentStatus;
    amountCents: number;
    provider: string;
    paymentMethod: string | null;
    paidAt: string | null;
  }>;
}

interface OrderDetailProps {
  order: ApiOrder | null;
  onStatusUpdate?: () => void;
}

export function OrderDetail({ order, onStatusUpdate }: OrderDetailProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (!order) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
          <Icon icon="solar:inbox-linear" className="w-6 h-6 text-neutral-400" />
        </div>
        <p className="text-neutral-600 font-medium tracking-tight">Pilih Pesanan</p>
        <p className="text-sm text-neutral-500 mt-1">Pilih pesanan untuk melihat detail</p>
      </div>
    );
  }

  const status = orderStatusConfig[order.status];
  const availableTransitions = VALID_TRANSITIONS[order.status];

  const handleUpdateTracking = async () => {
    if (!trackingNumber.trim()) return;
    
    setIsUpdatingTracking(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: trackingNumber.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update tracking');
      }

      toast.success('Nomor resi berhasil diperbarui');
      setTrackingNumber('');
      onStatusUpdate?.();
    } catch (error) {
      console.error('Error updating tracking:', error);
      toast.error('Gagal memperbarui nomor resi');
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setShowStatusMenu(false);
    setIsUpdatingStatus(true);
    
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      toast.success('Status pesanan berhasil diperbarui');
      onStatusUpdate?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Gagal memperbarui status pesanan');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
      {/* Order Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tighter text-neutral-900">{order.orderNumber}</h2>
          <p className="text-sm text-neutral-500 mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${status.color} ${status.bgColor}`}>
          {status.label}
        </span>
      </div>

      {/* Tracking Number - Compact */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Resi:</span>
        {order.trackingNumber ? (
          <>
            <code className="font-mono text-sm font-medium bg-neutral-100 px-2 py-0.5 rounded">{order.trackingNumber}</code>
            <button
              onClick={() => navigator.clipboard.writeText(order.trackingNumber!)}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Salin"
            >
              <Icon icon="solar:copy-linear" className="w-4 h-4" />
            </button>
          </>
        ) : (
          <span className="text-sm text-neutral-400">Belum ada</span>
        )}
        <div className="flex-1" />
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder={order.trackingNumber ? "Ubah resi..." : "Masukkan resi..."}
          className="w-40 px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
          onKeyDown={(e) => e.key === 'Enter' && handleUpdateTracking()}
        />
        <button
          onClick={handleUpdateTracking}
          disabled={isUpdatingTracking || !trackingNumber.trim()}
          className="px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdatingTracking ? <Icon icon="solar:spinner-line" className="w-4 h-4 animate-spin" /> : 'Simpan'}
        </button>
      </div>

      {/* Delivery Timeline */}
      <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-5">Status Pengiriman</h3>
        <div className="space-y-0">
          {/* Order Placed */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
                <Icon icon="solar:cart-check-linear" className="w-4 h-4 text-white" />
              </div>
              <div className="w-px h-8 bg-neutral-300" />
            </div>
            <div className="flex-1 pb-6">
              <p className="font-medium tracking-tight text-neutral-900">Pesanan Dibuat</p>
              <p className="text-sm text-neutral-500 mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Payment Confirmed */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                order.payments[0]?.status === 'paid' ? 'bg-neutral-900' : 'bg-neutral-200'
              )}>
                <Icon icon="solar:wallet-money-linear" className={cn(
                  'w-4 h-4',
                  order.payments[0]?.status === 'paid' ? 'text-white' : 'text-neutral-400'
                )} />
              </div>
              <div className={cn(
                'w-px h-8',
                order.payments[0]?.status === 'paid' && ['shipped', 'delivered'].includes(order.status) ? 'bg-neutral-300' : 'bg-neutral-200'
              )} />
            </div>
            <div className="flex-1 pb-6">
              <p className={cn(
                'font-medium tracking-tight',
                order.payments[0]?.status === 'paid' ? 'text-neutral-900' : 'text-neutral-400'
              )}>
                Pembayaran Dikonfirmasi
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                {order.payments[0]?.paidAt ? formatDate(order.payments[0].paidAt) : 'Menunggu pembayaran'}
              </p>
            </div>
          </div>

          {/* Processing */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                order.payments[0]?.status === 'paid' && !['pending_payment'].includes(order.status) ? 'bg-neutral-900' : 'bg-neutral-200'
              )}>
                <Icon icon="solar:box-linear" className={cn(
                  'w-4 h-4',
                  order.payments[0]?.status === 'paid' && !['pending_payment'].includes(order.status) ? 'text-white' : 'text-neutral-400'
                )} />
              </div>
              <div className={cn(
                'w-px h-8',
                ['shipped', 'delivered'].includes(order.status) ? 'bg-neutral-300' : 'bg-neutral-200'
              )} />
            </div>
            <div className="flex-1 pb-6">
              <p className={cn(
                'font-medium tracking-tight',
                order.payments[0]?.status === 'paid' && !['pending_payment', 'cancelled', 'refunded'].includes(order.status) ? 'text-neutral-900' : 'text-neutral-400'
              )}>
                Sedang Dikemas
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                {order.payments[0]?.status === 'paid' && !['pending_payment', 'cancelled', 'refunded'].includes(order.status)
                  ? 'Pesanan sedang disiapkan'
                  : 'Menunggu konfirmasi pembayaran'}
              </p>
            </div>
          </div>

          {/* Shipped */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                ['shipped', 'delivered'].includes(order.status) ? 'bg-neutral-900' : 'bg-neutral-200'
              )}>
                <Icon icon="solar:delivery-linear" className={cn(
                  'w-4 h-4',
                  ['shipped', 'delivered'].includes(order.status) ? 'text-white' : 'text-neutral-400'
                )} />
              </div>
              <div className={cn(
                'w-px h-8',
                order.status === 'delivered' ? 'bg-neutral-300' : 'bg-neutral-200'
              )} />
            </div>
            <div className="flex-1 pb-6">
              <p className={cn(
                'font-medium tracking-tight',
                ['shipped', 'delivered'].includes(order.status) ? 'text-neutral-900' : 'text-neutral-400'
              )}>
                Dalam Pengiriman
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                {['shipped', 'delivered'].includes(order.status)
                  ? order.trackingNumber 
                    ? `Resi: ${order.trackingNumber}`
                    : 'Pesanan sedang dalam perjalanan'
                  : 'Menunggu pengiriman'}
              </p>
            </div>
          </div>

          {/* Delivered */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                order.status === 'delivered' ? 'bg-green-600' : 'bg-neutral-200'
              )}>
                <Icon icon="solar:check-circle-linear" className={cn(
                  'w-4 h-4',
                  order.status === 'delivered' ? 'text-white' : 'text-neutral-400'
                )} />
              </div>
            </div>
            <div className="flex-1">
              <p className={cn(
                'font-medium',
                order.status === 'delivered' ? 'text-neutral-900' : 'text-neutral-400'
              )}>
                Pesanan Diterima
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                {order.status === 'delivered'
                  ? 'Pesanan telah sampai'
                  : 'Menunggu pengiriman selesai'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout for Info Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Customer */}
        <div className="bg-neutral-50 rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Pelanggan</h3>
          <p className="font-medium tracking-tight text-neutral-900">{order.customer.firstName} {order.customer.lastName}</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Icon icon="solar:letter-linear" className="w-4 h-4 text-neutral-400" />
              <span className="truncate">{order.customer.email}</span>
            </div>
            {order.customer.phone && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Icon icon="solar:phone-linear" className="w-4 h-4 text-neutral-400" />
                <span>{order.customer.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-neutral-50 rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Pembayaran</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Status</span>
            <span className={cn(
              'text-sm font-medium',
              order.payments[0]?.status === 'paid' ? 'text-green-600' :
              order.payments[0]?.status === 'expired' || order.payments[0]?.status === 'failed' ? 'text-red-600' : 'text-amber-600'
            )}>
              {order.payments[0]?.status === 'paid' ? 'Dibayar' : order.payments[0]?.status === 'expired' ? 'Kadaluarsa' : order.payments[0]?.status === 'failed' ? 'Gagal' : 'Menunggu'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-neutral-500">Metode</span>
            <span className="text-sm text-neutral-700 capitalize">
              {order.payments[0]?.paymentMethod?.replace('_', ' ') || '-'}
            </span>
          </div>
          {order.payments[0]?.paidAt && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-neutral-500">Tanggal</span>
              <span className="text-sm text-neutral-700">{formatDate(order.payments[0].paidAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Alamat Pengiriman</h3>
        <p className="font-medium tracking-tight text-neutral-900">{order.shippingFirstName} {order.shippingLastName}</p>
        <p className="text-sm text-neutral-600 mt-2">
          {order.shippingAddress1}{order.shippingAddress2 && `, ${order.shippingAddress2}`}
        </p>
        <p className="text-sm text-neutral-600">
          {order.shippingCity}{order.shippingState && `, ${order.shippingState}`} {order.shippingPostalCode}
        </p>
        {order.shippingPhone && (
          <p className="text-sm text-neutral-600 mt-2">{order.shippingPhone}</p>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">Item Pesanan</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex-shrink-0 flex items-center justify-center">
                <Icon icon="solar:gallery-minimalistic-linear" className="w-5 h-5 text-neutral-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium tracking-tight text-neutral-900 truncate">{item.name}</p>
                <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-neutral-700">{formatRupiah(item.priceCents * item.quantity)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="text-neutral-700">{formatRupiah(order.subtotalCents)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Ongkos Kirim</span>
            <span className="text-neutral-700">{order.shippingCents === 0 ? 'Gratis' : formatRupiah(order.shippingCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Diskon</span>
              <span className="text-green-600">-{formatRupiah(order.discountCents)}</span>
            </div>
          )}
          <div className="pt-3 flex items-center justify-between">
            <span className="font-medium tracking-tight text-neutral-900">Total</span>
            <span className="text-lg font-semibold text-neutral-900">{formatRupiah(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {/* Status Update Button */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={isUpdatingStatus || availableTransitions.length === 0}
            className="w-full px-4 py-3 text-sm font-medium tracking-wide bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUpdatingStatus ? (
              <Icon icon="solar:spinner-line" className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Update Status
                <Icon icon="solar:alt-arrow-down-linear" className="w-4 h-4" />
              </>
            )}
          </button>
          
          {showStatusMenu && availableTransitions.length > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {availableTransitions.map((transition) => (
                  <button
                    key={transition.status}
                    onClick={() => handleStatusChange(transition.status)}
                    className={cn(
                      'w-full px-4 py-3 text-sm text-left hover:bg-neutral-50 transition-colors flex items-center gap-3',
                      transition.status === 'cancelled' && 'text-red-600',
                      transition.status === 'refunded' && 'text-red-600'
                    )}
                  >
                    <Icon icon={
                      transition.status === 'processing' ? 'solar:wallet-check-linear' :
                      transition.status === 'shipped' ? 'solar:delivery-linear' :
                      transition.status === 'delivered' ? 'solar:check-circle-linear' :
                      transition.status === 'cancelled' ? 'solar:close-circle-linear' :
                      transition.status === 'refunded' ? 'solar:refresh-linear' :
                      'solar:arrow-right-linear'
                    } className="w-4 h-4" />
                    {transition.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        <button className="px-4 py-3 text-sm font-medium text-neutral-700 bg-white rounded-xl hover:bg-neutral-100 transition-colors border border-neutral-200">
          Cetak
        </button>
      </div>
      </div>
    </div>
  );
}
