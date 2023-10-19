'use client';

import { useCheckoutStore } from '@/lib/store/checkout';
import { provinces } from '@/lib/constants/provinces';

export function ShippingAddressForm() {
  const { data, setField } = useCheckoutStore();

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
      <h2 className="text-xl font-semibold tracking-tight mb-6">
        Alamat Pengiriman
      </h2>
      <div className="space-y-6">
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
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Alamat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.address1}
              onChange={(e) => setField('address1', e.target.value)}
              placeholder="Nama jalan, nomor rumah"
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-500 mb-2">
              Alamat Lengkap <span className="text-neutral-300">(opsional)</span>
            </label>
            <input
              type="text"
              value={data.address2}
              onChange={(e) => setField('address2', e.target.value)}
              placeholder="RT/RW, nama gedung, patokan"
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Kota <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => setField('city', e.target.value)}
              placeholder="Nama kota"
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Kode Pos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.postalCode}
              onChange={(e) => setField('postalCode', e.target.value)}
              placeholder="12345"
              maxLength={5}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Provinsi <span className="text-red-500">*</span>
            </label>
            <select
              value={data.province}
              onChange={(e) => setField('province', e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors bg-white"
            >
              <option value="">Pilih provinsi</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-500 mb-2">
              Catatan <span className="text-neutral-300">(opsional)</span>
            </label>
            <input
              type="text"
              value={data.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Instruksi pengiriman khusus"
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
