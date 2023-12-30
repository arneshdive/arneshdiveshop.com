'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { DestinationSearch } from '@/components/checkout/destination-search';

interface Address {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2?: string;
  rajaongkirCityId: string;
  rajaongkirCityName: string;
  rajaongkirProvince?: string;
  rajaongkirCity?: string;
  rajaongkirDistrict?: string;
  rajaongkirSubdistrict?: string;
  rajaongkirPostalCode?: string;
}

interface AddressFormProps {
  initialData?: Address | null;
  onSave: (data: Partial<Address>) => void;
  onCancel: () => void;
}

export function AddressForm({ initialData, onSave, onCancel }: AddressFormProps) {
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [fullName, setFullName] = useState(
    initialData ? `${initialData.firstName} ${initialData.lastName}` : ''
  );
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address1, setAddress1] = useState(initialData?.address1 || '');
  const [address2, setAddress2] = useState(initialData?.address2 || '');

  // RajaOngkir destination
  const [destination, setDestination] = useState<{
    id: string;
    name: string;
    province: string;
    city?: string;
    district?: string;
    fullName: string;
  } | null>(
    initialData?.rajaongkirCityId ? {
      id: initialData.rajaongkirCityId,
      name: initialData.rajaongkirSubdistrict || '',
      province: initialData.rajaongkirProvince || '',
      city: initialData.rajaongkirCity,
      district: initialData.rajaongkirDistrict,
      fullName: initialData.rajaongkirCityName || '',
    } : null
  );

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
      address2: address2 || undefined,
      rajaongkirCityId: destination?.id,
      rajaongkirCityName: destination?.fullName,
      rajaongkirProvince: destination?.province,
      rajaongkirCity: destination?.city,
      rajaongkirDistrict: destination?.district,
      rajaongkirSubdistrict: destination?.name,
    });
  };

  const isValid = name.trim() && fullName.trim() && phone.trim() && destination && address1.trim();

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

        {/* Destination Search */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Kelurahan/Kecamatan <span className="text-red-500">*</span>
          </label>
          <DestinationSearch
            value={destination?.fullName}
            onSelect={(dest) => setDestination(dest)}
            placeholder="Cari kelurahan atau kecamatan..."
          />
          <p className="text-xs text-neutral-400 mt-2">
            Ketik nama kelurahan atau kecamatan tujuan pengiriman
          </p>
        </div>

        {/* Selected Destination */}
        {destination && (
          <div className="p-4 bg-white border border-neutral-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                <Icon icon="solar:map-point-bold" className="w-5 h-5 text-neutral-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-500 mb-1">Tujuan Pengiriman</p>
                <p className="text-sm font-medium leading-relaxed">
                  {destination.fullName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Street Address */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Alamat Lengkap <span className="text-red-500">*</span>
          </label>
          <textarea
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            placeholder="Jalan, nomor rumah, nama gedung, RT/RW..."
            rows={2}
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Additional Details */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Detail Tambahan <span className="text-neutral-400 font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="Patokan, catatan untuk kurir..."
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>
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
    </div>
  );
}
