import type { OrderStatus } from '@/lib/data/mock-orders';

export const orderStatusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending_payment: { label: 'Dipesan', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  processing: { label: 'Dibayar', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  shipped: { label: 'Dikirim', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  delivered: { label: 'Selesai', color: 'text-green-700', bgColor: 'bg-green-50' },
  cancelled: { label: 'Dibatalkan', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  refunded: { label: 'Dikembalikan', color: 'text-red-700', bgColor: 'bg-red-50' },
};
