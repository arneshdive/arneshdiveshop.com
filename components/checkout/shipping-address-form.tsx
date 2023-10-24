'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useCheckoutStore } from '@/lib/store/checkout';
import { MapModal } from './map-modal';

export function ShippingAddressForm() {
  const { data, setField } = useCheckoutStore();
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div className="pb-8 mb-8 border-b border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Alamat Pengiriman
        </h2>
        {data.hasMapLocation && (
          <button
            type="button"
            onClick={() => setIsMapOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <Icon icon="solar:pen-linear" className="w-4 h-4" />
            Ubah Lokasi
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Full Name - always editable */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            placeholder="Nama penerima"
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>

        {!data.hasMapLocation ? (
          /* Before map selection - show prominent "Select location" UI */
          <div className="py-8 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                <Icon icon="solar:map-point-linear" className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-base font-medium mb-2">Pilih Lokasi Pengiriman</h3>
              <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                Tentukan lokasi pengiriman Anda dengan menandai di peta. Ini memastikan alamat akurat untuk pengiriman.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
            >
              <Icon icon="solar:map-point-linear" className="w-5 h-5" />
              Cari di Peta
            </button>
          </div>
        ) : (
          /* After map selection - show read-only address with optional details */
          <div className="space-y-6">
            {/* Selected Address - Read Only */}
            <div className="p-4 bg-neutral-50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
                  <Icon icon="solar:map-point-bold" className="w-5 h-5 text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-500 mb-1">Alamat Pengiriman</p>
                  <p className="text-sm font-medium leading-relaxed">
                    {data.formattedAddress || `${data.address1}, ${data.city}, ${data.postalCode}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Details - Optional */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Detail Tambahan <span className="text-neutral-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={data.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Nama gedung, nomor apartemen, RT/RW, patokan..."
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
              />
              <p className="text-xs text-neutral-400 mt-2">
                Tambahkan detail yang bisa membantu kurir menemukan lokasi Anda
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Map Modal */}
      <MapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />
    </div>
  );
}
