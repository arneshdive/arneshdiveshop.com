'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { orderStatusConfig, VALID_STATUS_TRANSITIONS } from '@/lib/constants/order-status';
import type { OrderStatus } from '@/lib/db/schema';

interface StatusUpdateDialogProps {
  orderId: string;
  currentStatus: OrderStatus;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StatusUpdateDialog({
  orderId,
  currentStatus,
  isOpen,
  onClose,
  onSuccess,
}: StatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, note: note || undefined }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Update Status Pesanan
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
              >
                <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
              </button>
            </div>
            
            {/* Current Status */}
            <div className="mb-4">
              <p className="text-sm text-neutral-500 mb-2">Status Saat Ini</p>
              <span className={`inline-flex text-sm font-medium px-3 py-1.5 rounded-full ${
                orderStatusConfig[currentStatus].color
              } ${orderStatusConfig[currentStatus].bgColor}`}>
                {orderStatusConfig[currentStatus].label}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 pt-2">
            {availableTransitions.length === 0 ? (
              <div className="bg-neutral-50 rounded-xl p-4 text-center">
                <Icon icon="solar:info-circle-linear" className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">
                  Tidak ada transisi status yang tersedia untuk status saat ini.
                </p>
              </div>
            ) : (
              <>
                {/* Status Options */}
                <div className="mb-4">
                  <p className="text-sm text-neutral-500 mb-2">Pilih Status Baru</p>
                  <div className="space-y-2">
                    {availableTransitions.map((status) => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          selectedStatus === status
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-transparent bg-neutral-50 hover:bg-neutral-100'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          orderStatusConfig[status].bgColor.replace('bg-', 'bg-')
                        }`} />
                        <span className={`font-medium ${
                          orderStatusConfig[status].color
                        }`}>
                          {orderStatusConfig[status].label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Note */}
                <div className="mb-4">
                  <label className="text-sm text-neutral-500 mb-2 block">
                    Catatan (opsional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Tambahkan catatan untuk perubahan status ini..."
                    className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 resize-none"
                    rows={3}
                  />
                </div>
                
                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 rounded-xl">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Footer */}
          {availableTransitions.length > 0 && (
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedStatus || isSubmitting}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <Icon icon="solar:spinner-line" className="w-4 h-4 animate-spin" />
                )}
                Update Status
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
