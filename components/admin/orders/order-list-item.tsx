import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatRupiah } from '@/lib/utils/format';
import { orderStatusConfig } from '@/lib/constants/order-status';
import type { OrderStatus } from '@/lib/db/schema';

interface ApiOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
}

interface OrderListItemProps {
  order: ApiOrder;
  isSelected: boolean;
  onClick: () => void;
}

export function OrderListItem({
  order,
  isSelected,
  onClick,
}: OrderListItemProps) {
  const status = orderStatusConfig[order.status];
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl transition-all ${
        isSelected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium tracking-tight text-neutral-900 truncate">{customerName}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{order.orderNumber}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color} ${status.bgColor}`}>
          {status.label}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium tracking-tight text-neutral-700">{formatRupiah(order.totalCents)}</span>
        <span className="text-xs text-neutral-500">
          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: id })}
        </span>
      </div>
    </button>
  );
}
