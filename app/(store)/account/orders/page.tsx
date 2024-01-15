'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { AnimatedButton } from '@/components/ui/animated-button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRupiah, formatDate } from '@/lib/utils/format';
import type { OrderStatus } from '@/lib/db/schema';

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

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
  payments: {
    status: string;
    paymentMethod: string | null;
  }[];
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

const statusFilters: { label: string; status?: OrderStatus }[] = [
  { label: 'Semua' },
  { label: 'Perlu Dibayar', status: 'pending_payment' },
  { label: 'Diproses', status: 'processing' },
  { label: 'Dikirim', status: 'shipped' },
  { label: 'Selesai', status: 'delivered' },
];

// Fetch orders from API
async function fetchOrders(status?: OrderStatus): Promise<{ orders: Order[] }> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  
  const response = await fetch(`/api/orders?${params.toString()}`);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Silakan login untuk melihat pesanan Anda');
    }
    throw new Error('Gagal memuat pesanan');
  }
  
  return response.json();
}

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | undefined>(undefined);

  // Fetch orders with TanStack Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', activeFilter],
    queryFn: () => fetchOrders(activeFilter),
  });

  const orders = data?.orders ?? [];

  // Loading state
  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">Pesanan Saya</h1>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-500">Memuat pesanan...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - not logged in
  if (error?.message.includes('login')) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">Pesanan Saya</h1>
        <EmptyState
          icon="solar:lock-linear"
          title="Silakan Login"
          description="Login untuk melihat riwayat pesanan Anda"
          ctaLabel="Login"
          ctaHref="/auth"
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">Pesanan Saya</h1>
        <EmptyState
          icon="solar:danger-triangle-linear"
          title="Gagal Memuat"
          description={error.message}
          ctaLabel="Coba Lagi"
          onClick={() => refetch()}
        />
      </div>
    );
  }

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
      {orders.length === 0 ? (
        <EmptyState
          icon="solar:bag-3-linear"
          title="Belum Ada Pesanan"
          description="Pesanan dengan status ini belum ditemukan. Yuk mulai belanja dan temukan perlengkapan diving terbaik!"
          ctaLabel="Mulai Belanja"
          ctaHref="/produk"
        />
      ) : (
        <div className="space-y-8">
          {orders.map((order, index) => (
            <div key={order.id} className={index !== orders.length - 1 ? 'border-b border-neutral-200 pb-8' : ''}>
              <OrderCard order={order} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface OrderCardProps {
  order: Order;
}

function OrderCard({ order }: OrderCardProps) {
  const status = customerStatusConfig[order.status];
  const isPendingPayment = order.status === 'pending_payment';

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
              {isPendingPayment && (
                <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', status.pingClass)} />
              )}
              <span className={cn('relative inline-flex rounded-full h-2 w-2', status.dotClass)} />
            </span>
            {status.label}
          </span>
        </div>
        <p className="text-sm text-neutral-500">{formatDate(order.createdAt)}</p>
      </div>

      {/* Items */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex gap-4 bg-neutral-50 rounded-xl p-4 sm:min-w-[280px] sm:flex-1 sm:max-w-md">
            {/* Image */}
            <div className="w-20 h-20 bg-neutral-100 flex-shrink-0 rounded-lg overflow-hidden">
              {item.product.images?.[0] ? (
                <Image
                  src={item.product.images[0]}
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
                {item.variant?.name && `${item.variant.name} • `}Qty: {item.quantity}
              </p>
              <p className="text-base font-semibold tracking-tight mt-1">{formatRupiah(item.priceCents)}</p>
            </div>
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="flex items-center justify-center bg-neutral-50 rounded-xl p-4 sm:min-w-[140px] text-sm text-neutral-500">
            +{order.items.length - 3} item lainnya
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
        <p className="text-sm">
          Total: <strong className="text-lg font-semibold tracking-tight">{formatRupiah(order.totalCents)}</strong>
        </p>
        <div className="flex gap-2">
          {isPendingPayment && (
            <AnimatedButton className="px-5 py-2.5 text-sm">
              Bayar Sekarang
            </AnimatedButton>
          )}
          {order.status === 'shipped' && (
            <AnimatedButton variant="outline" className="px-4 py-2 text-sm">
              Lacak Pengiriman
            </AnimatedButton>
          )}
          <AnimatedButton variant="outline" asChild className="px-4 py-2 text-sm">
            <Link href={`/account/orders/${order.id}`}>
              Lihat Detail
            </Link>
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
