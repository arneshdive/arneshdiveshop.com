'use client';

import { useCheckoutStore } from '@/lib/store/checkout';
import { provinces } from '@/lib/constants/provinces';

export function ShippingAddressForm() {
  const { data, setField } = useCheckoutStore();

  return (
    <div className="bg-white p-6 mb-6 border border-neutral-200">
      <h2 className="font-semibold text-lg mb-6 pb-3 border-b border-neutral-200">
        Alamat Pengiriman
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            placeholder="Nama penerima"
            className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Alamat <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.address1}
            onChange={(e) => setField('address1', e.target.value)}
            placeholder="Nama jalan, nomor rumah"
            className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Alamat Lengkap (opsional)
          </label>
          <input
            type="text"
            value={data.address2}
            onChange={(e) => setField('address2', e.target.value)}
            placeholder="RT/RW, nama gedung, patokan"
            className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Kota <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => setField('city', e.target.value)}
              placeholder="Nama kota"
              className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Kode Pos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.postalCode}
              onChange={(e) => setField('postalCode', e.target.value)}
              placeholder="12345"
              maxLength={5}
              className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Provinsi <span className="text-red-500">*</span>
          </label>
          <select
            value={data.province}
            onChange={(e) => setField('province', e.target.value)}
            className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none bg-white"
          >
            <option value="">Pilih provinsi</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Catatan (opsional)</label>
          <input
            type="text"
            value={data.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Instruksi pengiriman khusus"
            className="w-full px-3 py-3 border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
