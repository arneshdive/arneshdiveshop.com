import type { OrderStatus } from '@/lib/db/schema';

export const orderStatusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending_payment: { label: 'Dipesan', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  processing: { label: 'Dibayar', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  shipped: { label: 'Dikirim', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  delivered: { label: 'Selesai', color: 'text-green-700', bgColor: 'bg-green-50' },
  cancelled: { label: 'Dibatalkan', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  refunded: { label: 'Dikembalikan', color: 'text-red-700', bgColor: 'bg-red-50' },
};

// Valid status transitions
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [], // Terminal state
  refunded: [], // Terminal state
};

// Check if a transition is valid
export function isValidTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed.includes(newStatus);
}

// Get available transitions for a status
export function getAvailableTransitions(
  currentStatus: OrderStatus,
  _isAdmin: boolean = false
): OrderStatus[] {
  const baseTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  
  // Admin-only transitions (like full cancel from any state)
  // For now, the transitions already defined are comprehensive
  return baseTransitions;
}
