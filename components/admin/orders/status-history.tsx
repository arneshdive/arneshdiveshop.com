'use client';

import { Icon } from '@iconify/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { orderStatusConfig } from '@/lib/constants/order-status';

interface StatusHistoryEntry {
  id: string;
  status: string;
  note: string | null;
  changedBy: string | null;
  createdAt: string | Date;
}

interface StatusHistoryProps {
  history: StatusHistoryEntry[];
  isLoading?: boolean;
}

export function StatusHistory({ history, isLoading }: StatusHistoryProps) {
  if (isLoading) {
    return (
      <div className="bg-neutral-50 rounded-2xl p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
          Riwayat Status
        </h3>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="w-8 h-8 rounded-full bg-neutral-200" />
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
                <div className="h-3 bg-neutral-200 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-50 rounded-2xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
        Riwayat Status
      </h3>
      
      <div className="space-y-4">
        {history.map((entry, index) => {
          const statusConfig = orderStatusConfig[entry.status as keyof typeof orderStatusConfig];
          const isLatest = index === 0;
          
          return (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isLatest ? 'bg-neutral-900' : 'bg-neutral-200'
                }`}>
                  <Icon 
                    icon={getStatusIcon(entry.status)} 
                    className={`w-4 h-4 ${isLatest ? 'text-white' : 'text-neutral-400'}`} 
                  />
                </div>
                {index < history.length - 1 && (
                  <div className="w-px h-8 bg-neutral-200" />
                )}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className={`font-medium tracking-tight ${
                    isLatest ? 'text-neutral-900' : 'text-neutral-600'
                  }`}>
                    {statusConfig?.label || entry.status}
                  </span>
                  {isLatest && (
                    <span className="text-xs px-2 py-0.5 bg-neutral-900 text-white rounded-full">
                      Terbaru
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-neutral-500 mt-0.5">
                  {formatDistanceToNow(new Date(entry.createdAt), { 
                    addSuffix: true, 
                    locale: id 
                  })}
                </p>
                
                {entry.note && (
                  <p className="text-sm text-neutral-600 mt-2 italic">
                    "{entry.note}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getStatusIcon(status: string): string {
  const iconMap: Record<string, string> = {
    pending_payment: 'solar:cart-check-linear',
    processing: 'solar:box-linear',
    shipped: 'solar:delivery-linear',
    delivered: 'solar:check-circle-linear',
    cancelled: 'solar:close-circle-linear',
    refunded: 'solar:undo-left-round-linear',
  };
  return iconMap[status] || 'solar:circle-linear';
}
