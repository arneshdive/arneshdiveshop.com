'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils/cn';
import { AnimatedButton } from '@/components/ui/animated-button';
import { EmptyState } from '@/components/ui/empty-state';
import { mockOrders, statusConfig, formatRupiah, formatDate, type OrderStatus } from '@/lib/data/mock-account';

const statusFilters: { label: string; status?: OrderStatus }[] = [
  { label: 'Semua' },
  { label: 'Perlu Dibayar', status: 'pending_payment' },
  { label: 'Diproses', status: 'processing' },
  { label: 'Dikirim', status: 'shipped' },
  { label: 'Selesai', status: 'delivered' },
];

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | undefined>(undefined);

  const filteredOrders = activeFilter
    ? mockOrders.filter((order) => order.status === activeFilter)
    : mockOrders;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">Pesanan Saya</h1>

      {/* Status Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => setActiveFilter(filter.status)}
            className={cn(
              'px-4 py-2 text-sm whitespace-nowrap rounded-full transition-colors',
              (activeFilter === filter.status || (!activeFilter && !filter.status))
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon="solar:bag-3-linear"
          title="Belum Ada Pesanan"
          description="Pesanan dengan status ini belum ditemukan. Yuk mulai belanja dan temukan perlengkapan diving terbaik!"
          ctaLabel="Mulai Belanja"
          ctaHref="/produk"
        />
      ) : (
        <div className="space-y-8">
          {filteredOrders.map((order, index) => (
            <div key={order.id} className={index !== filteredOrders.length - 1 ? 'border-b border-neutral-200 pb-8' : ''}>
              <OrderCard order={order} />
            </div>
          ))}
        </div>
      )}

      {/* Orders List */}
    </div>
  );
}

interface OrderCardProps {
  order: typeof mockOrders[0];
}

function OrderCard({ order }: OrderCardProps) {
  const status = statusConfig[order.status];

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.orderNumber);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={copyOrderId}
            className="font-mono font-medium text-base hover:text-neutral-600 transition-colors cursor-pointer"
            title="Klik untuk salin"
          >
            #{order.orderNumber}
          </button>
          <span className={cn('inline-flex items-center gap-2 text-sm font-medium leading-tight', status.textClass)}>
            <span className="relative flex h-2 w-2">
              <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', status.pingClass)} />
              <span className={cn('relative inline-flex rounded-full h-2 w-2', status.dotClass)} />
            </span>
            {status.label}
          </span>
        </div>
        <p className="text-sm text-neutral-500">{formatDate(order.createdAt)}</p>
      </div>

      {/* Items */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 bg-neutral-50 rounded-xl p-4 sm:min-w-[280px] sm:flex-1 sm:max-w-md">
            {/* Image */}
            <div className="w-20 h-20 bg-neutral-100 flex-shrink-0 rounded-lg overflow-hidden">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover mix-blend-multiply"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <Icon icon="solar:box-linear" className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-center py-0.5">
              <p className="font-medium tracking-tight">{item.name}</p>
              <p className="text-sm text-neutral-400">
                {item.variant?.color && `Warna: ${item.variant.color}`}
                {item.variant?.size && `${item.variant?.color ? ' • ' : ''}Ukuran: ${item.variant.size}`}
                {item.variant ? ' • ' : ''}Qty: {item.quantity}
              </p>
              <p className="text-base font-semibold tracking-tight mt-1">{formatRupiah(item.priceCents)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
        <p className="text-sm">
          Total: <strong className="text-lg font-semibold tracking-tight">{formatRupiah(order.totalCents)}</strong>
        </p>
        <div className="flex gap-2">
          {order.status === 'pending_payment' && (
            <AnimatedButton className="px-5 py-2.5 text-sm">
              Bayar Sekarang
            </AnimatedButton>
          )}
          {order.status === 'shipped' && (
            <AnimatedButton variant="outline" className="px-4 py-2 text-sm">
              Lacak Pengiriman
            </AnimatedButton>
          )}
          <AnimatedButton variant="outline" className="px-4 py-2 text-sm">
            Lihat Detail
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
