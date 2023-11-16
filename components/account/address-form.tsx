'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { MapModal } from '@/components/checkout/map-modal';
import type { Address } from '@/lib/data/mock-account';

interface AddressFormProps {
  initialData?: Address | null;
  onSave: (data: Partial<Address>) => void;
  onCancel: () => void;
}

export function AddressForm({ initialData, onSave, onCancel }: AddressFormProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [hasMapLocation, setHasMapLocation] = useState(!!initialData?.address1);

  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [fullName, setFullName] = useState(
    initialData ? `${initialData.firstName} ${initialData.lastName}` : ''
  );
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [notes, setNotes] = useState(initialData?.address2 || '');

  // Map-derived data (read-only after selection)
  const [address1, setAddress1] = useState(initialData?.address1 || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [postalCode, setPostalCode] = useState(initialData?.postalCode || '');
  const [formattedAddress, setFormattedAddress] = useState('');

  const handleMapSelect = (data: {
    address1: string;
    city: string;
    state: string;
    postalCode: string;
    formattedAddress?: string;
  }) => {
    setAddress1(data.address1);
    setCity(data.city);
    setState(data.state);
    setPostalCode(data.postalCode);
    setFormattedAddress(data.formattedAddress || '');
    setHasMapLocation(true);
  };

  const handleSave = () => {
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    onSave({
      name,
      firstName,
      lastName,
      phone,
      address1,
      address2: notes || undefined,
      city,
      state,
      postalCode,
    });
  };

  const isValid = name.trim() && fullName.trim() && phone.trim() && hasMapLocation;

  return (
    <div className="bg-neutral-50 p-8 rounded-xl">
      <h2 className="text-xl font-semibold tracking-tight mb-6">
        {initialData ? 'Ubah Alamat' : 'Tambah Alamat Baru'}
      </h2>

      <div className="space-y-6">
        {/* Address Name */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Nama Alamat <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="contoh: Rumah, Kantor, Kos"
            className="w-full max-w-xs px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Receiver Name */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Nama Penerima <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama lengkap penerima"
            className="w-full max-w-md px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Nomor Telepon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+62 812-XXXX-XXXX"
            className="w-full max-w-xs px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Map Selection */}
        {!hasMapLocation ? (
          <div className="py-8 text-center border-2 border-dashed border-neutral-200 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
              <Icon icon="solar:map-point-linear" className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-base font-medium mb-2">Pilih Lokasi Pengiriman</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-4">
              Tentukan lokasi pengiriman Anda dengan menandai di peta.
            </p>
            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
            >
              <Icon icon="solar:map-point-linear" className="w-5 h-5" />
              Cari di Peta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Address - Read Only */}
            <div className="p-4 bg-white border border-neutral-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <Icon icon="solar:map-point-bold" className="w-5 h-5 text-neutral-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-500 mb-1">Alamat Pengiriman</p>
                  <p className="text-sm font-medium leading-relaxed">
                    {formattedAddress || `${address1}, ${city}, ${state} ${postalCode}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Ubah
                </button>
              </div>
            </div>

            {/* Additional Details - Optional */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
                Detail Tambahan <span className="text-neutral-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nama gedung, nomor apartemen, RT/RW, patokan..."
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
              />
              <p className="text-xs text-neutral-400 mt-2">
                Tambahkan detail yang bisa membantu kurir menemukan lokasi Anda
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <AnimatedButton
          onClick={handleSave}
          disabled={!isValid}
          className="px-6 py-2.5 text-sm"
        >
          Simpan Alamat
        </AnimatedButton>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          Batal
        </button>
      </div>

      {/* Map Modal */}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onAddressSelect={handleMapSelect}
      />
    </div>
  );
}
