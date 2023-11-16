import { Icon } from '@iconify/react';
import { formatRupiah, formatDate } from '@/lib/utils/format';
import { orderStatusConfig } from '@/lib/constants/order-status';
import type { MockOrder } from '@/lib/data/mock-orders';

export function OrderDetail({ order }: { order: MockOrder | null }) {
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                order.payment.status === 'paid' ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}>
                <Icon icon="solar:wallet-money-linear" className={`w-4 h-4 ${
                  order.payment.status === 'paid' ? 'text-white' : 'text-neutral-400'
                }`} />
              </div>
              <div className={`w-px h-8 ${
                order.payment.status === 'paid' && ['shipped', 'delivered'].includes(order.status) ? 'bg-neutral-300' : 'bg-neutral-200'
              }`} />
            </div>
            <div className="flex-1 pb-6">
              <p className={`font-medium tracking-tight ${order.payment.status === 'paid' ? 'text-neutral-900' : 'text-neutral-400'}`}>
                Pembayaran Dikonfirmasi
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                {order.payment.paidAt ? formatDate(order.payment.paidAt) : 'Menunggu pembayaran'}
              </p>
            </div>
          </div>

          {/* Processing */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                order.payment.status === 'paid' && !['pending_payment'].includes(order.status) ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}>
                <Icon icon="solar:box-linear" className={`w-4 h-4 ${
                  order.payment.status === 'paid' && !['pending_payment'].includes(order.status) ? 'text-white' : 'text-neutral-400'
                }`} />
              </div>
              <div className={`w-px h-8 ${
                ['shipped', 'delivered'].includes(order.status) ? 'bg-neutral-300' : 'bg-neutral-200'
              }`} />
            </div>
            <div className="flex-1 pb-6">
              <p className={`font-medium tracking-tight ${
                order.payment.status === 'paid' && !['pending_payment', 'cancelled', 'refunded'].includes(order.status) ? 'text-neutral-900' : 'text-neutral-400'
              }`}>
                Sedang Dikemas
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                {order.payment.status === 'paid' && !['pending_payment', 'cancelled', 'refunded'].includes(order.status)
                  ? 'Pesanan sedang disiapkan'
                  : 'Menunggu konfirmasi pembayaran'}
              </p>
            </div>
          </div>

          {/* Shipped */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                ['shipped', 'delivered'].includes(order.status) ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}>
                <Icon icon="solar:delivery-linear" className={`w-4 h-4 ${
                  ['shipped', 'delivered'].includes(order.status) ? 'text-white' : 'text-neutral-400'
                }`} />
              </div>
              <div className={`w-px h-8 ${
                order.status === 'delivered' ? 'bg-neutral-300' : 'bg-neutral-200'
              }`} />
            </div>
            <div className="flex-1 pb-6">
              <p className={`font-medium tracking-tight ${
                ['shipped', 'delivered'].includes(order.status) ? 'text-neutral-900' : 'text-neutral-400'
              }`}>
                Dalam Pengiriman
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                {['shipped', 'delivered'].includes(order.status)
                  ? 'Pesanan sedang dalam perjalanan'
                  : 'Menunggu pengiriman'}
              </p>
            </div>
          </div>

          {/* Delivered */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                order.status === 'delivered' ? 'bg-green-600' : 'bg-neutral-200'
              }`}>
                <Icon icon="solar:check-circle-linear" className={`w-4 h-4 ${
                  order.status === 'delivered' ? 'text-white' : 'text-neutral-400'
                }`} />
              </div>
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                order.status === 'delivered' ? 'text-neutral-900' : 'text-neutral-400'
              }`}>
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
          <p className="font-medium tracking-tight text-neutral-900">{order.customer.name}</p>
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
            <span className={`text-sm font-medium ${
              order.payment.status === 'paid' ? 'text-green-600' :
              order.payment.status === 'expired' || order.payment.status === 'failed' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {order.payment.status === 'paid' ? 'Dibayar' : order.payment.status === 'expired' ? 'Kadaluarsa' : order.payment.status === 'failed' ? 'Gagal' : 'Menunggu'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-neutral-500">Metode</span>
            <span className="text-sm text-neutral-700 capitalize">
              {order.payment.paymentMethod?.replace('_', ' ') || '-'}
            </span>
          </div>
          {order.payment.paidAt && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-neutral-500">Tanggal</span>
              <span className="text-sm text-neutral-700">{formatDate(order.payment.paidAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Alamat Pengiriman</h3>
        <p className="font-medium tracking-tight text-neutral-900">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
        <p className="text-sm text-neutral-600 mt-2">
          {order.shippingAddress.address1}{order.shippingAddress.address2 && `, ${order.shippingAddress.address2}`}
        </p>
        <p className="text-sm text-neutral-600">
          {order.shippingAddress.city}{order.shippingAddress.state && `, ${order.shippingAddress.state}`} {order.shippingAddress.postalCode}
        </p>
        {order.shippingAddress.phone && (
          <p className="text-sm text-neutral-600 mt-2">{order.shippingAddress.phone}</p>
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
        <button className="flex-1 px-4 py-3 text-sm font-medium tracking-wide bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors">
          Update Status
        </button>
        <button className="px-4 py-3 text-sm font-medium text-neutral-700 bg-white rounded-xl hover:bg-neutral-100 transition-colors">
          Cetak
        </button>
      </div>
      </div>
    </div>
  );
}
