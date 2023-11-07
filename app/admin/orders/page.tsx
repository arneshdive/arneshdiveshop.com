'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { mockOrders, type MockOrder, type OrderStatus } from '@/lib/data/mock-orders';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(cents);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending_payment: { label: 'Dipesan', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  processing: { label: 'Dibayar', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  shipped: { label: 'Dikirim', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  delivered: { label: 'Selesai', color: 'text-green-700', bgColor: 'bg-green-50' },
  cancelled: { label: 'Dibatalkan', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  refunded: { label: 'Dikembalikan', color: 'text-red-700', bgColor: 'bg-red-50' },
};

type DateFilter = '' | 'today' | 'this_week' | 'this_month';

const statusTabs: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'pending_payment', label: 'Dipesan' },
  { value: 'processing', label: 'Dibayar' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'delivered', label: 'Selesai' },
];

const dateFilterOptions: { value: DateFilter; label: string }[] = [
  { value: '', label: 'Semua Tanggal' },
  { value: 'today', label: 'Hari Ini' },
  { value: 'this_week', label: 'Minggu Ini' },
  { value: 'this_month', label: 'Bulan Ini' },
];

function OrderListItem({ order, isSelected, onClick }: { order: MockOrder; isSelected: boolean; onClick: () => void }) {
  const status = statusConfig[order.status];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl transition-all ${
        isSelected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium tracking-tight text-neutral-900 truncate">{order.customer.name}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{order.orderNumber}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color} ${status.bgColor}`}>
          {status.label}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium tracking-tight text-neutral-700">{formatPrice(order.totalCents)}</span>
        <span className="text-xs text-neutral-500">{formatRelativeTime(order.createdAt)}</span>
      </div>
    </button>
  );
}

function OrderDetail({ order }: { order: MockOrder | null }) {
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

  const status = statusConfig[order.status];

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
              <p className="text-sm font-medium text-neutral-700">{formatPrice(item.priceCents * item.quantity)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="text-neutral-700">{formatPrice(order.subtotalCents)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Ongkos Kirim</span>
            <span className="text-neutral-700">{order.shippingCents === 0 ? 'Gratis' : formatPrice(order.shippingCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Diskon</span>
              <span className="text-green-600">-{formatPrice(order.discountCents)}</span>
            </div>
          )}
          <div className="pt-3 flex items-center justify-between">
            <span className="font-medium tracking-tight text-neutral-900">Total</span>
            <span className="text-lg font-semibold text-neutral-900">{formatPrice(order.totalCents)}</span>
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

export default function OrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = mockOrders.filter((order) => {
    // Status filter
    if (statusFilter && order.status !== statusFilter) return false;
    
    // Date filter
    if (dateFilter) {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateFilter === 'today') {
        if (orderDate < today) return false;
      } else if (dateFilter === 'this_week') {
        // Start of this week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        if (orderDate < startOfWeek) return false;
      } else if (dateFilter === 'this_month') {
        // Start of this month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (orderDate < startOfMonth) return false;
      }
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.customer.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const selectedOrder = selectedOrderId ? mockOrders.find((o) => o.id === selectedOrderId) ?? null : null;

  return (
    <div className="max-w-7xl flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pesanan</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola dan pantau pesanan pelanggan</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Periode:</span>
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-colors text-neutral-700 cursor-pointer"
            >
              {dateFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon icon="solar:alt-arrow-down-linear" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Order List */}
      <div className="w-[360px] flex-shrink-0 flex flex-col bg-white rounded-2xl">
        {/* Filters */}
        <div className="p-4 pb-0 space-y-3">
          {/* Status Tabs */}
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                  statusFilter === tab.value
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Icon icon="solar:magnifer-linear" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="search"
              placeholder="Cari pesanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-colors"
            />
          </div>
        </div>

        {/* Order List */}
        <div className="flex-1 overflow-y-auto p-4 pt-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 text-sm">Tidak ada pesanan</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderListItem
                key={order.id}
                order={order}
                isSelected={selectedOrderId === order.id}
                onClick={() => setSelectedOrderId(order.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right: Order Detail */}
      <div className="flex-1 min-w-0 bg-white rounded-2xl overflow-hidden">
        <OrderDetail order={selectedOrder} />
      </div>
    </div>
  </div>
  );
}
