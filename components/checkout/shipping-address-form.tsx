'use client';

import { Input, Textarea } from '@/components/admin/input';
import { useCheckoutStore } from '@/lib/store/checkout';
import { DestinationSearch } from './destination-search';

export function ShippingAddressForm() {
  const { data, setField, touched, setTouched } = useCheckoutStore();

  return (
    <div className="pb-8 mb-8 border-b border-neutral-200">
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Alamat Pengiriman
        </h2>
      </div>

      <div className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={data.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            onBlur={() => setTouched('fullName')}
            placeholder="Nama penerima paket"
            className={`py-3 rounded-xl ${
              touched.fullName && !data.fullName.trim()
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : ''
            }`}
          />
          {touched.fullName && !data.fullName.trim() && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Nama lengkap wajib diisi
            </p>
          )}
        </div>

        {/* Destination Search (Kelurahan/Kecamatan) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Kelurahan/Kecamatan <span className="text-red-500">*</span>
          </label>
          <div
            onFocus={() => setTouched('rajaongkirCityId')}
            onClick={() => setTouched('rajaongkirCityId')}
          >
            <DestinationSearch
              value={data.rajaongkirCityName || ''}
              onSelect={(destination) => {
                setField('rajaongkirCityId', destination.id);
                setField('rajaongkirCityName', destination.fullName);
                setField('rajaongkirProvince', destination.province);
                setField('rajaongkirCity', destination.city || null);
                setField('rajaongkirDistrict', destination.district || null);
                setField('rajaongkirSubdistrict', destination.name);
              }}
              placeholder="Cari kelurahan atau kecamatan..."
              className={touched.rajaongkirCityId && !data.rajaongkirCityId ? 'border-red-400' : ''}
            />
          </div>
          {touched.rajaongkirCityId && !data.rajaongkirCityId && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Kelurahan/Kecamatan wajib dipilih
            </p>
          )}
          <p className="text-xs text-neutral-400 mt-2">
            Ketik nama kelurahan atau kecamatan tujuan pengiriman
          </p>
        </div>

        {/* Selected Destination Display */}
        {data.rajaongkirCityId && (
          <div className="p-4 bg-neutral-50 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-500 mb-1">Tujuan Pengiriman</p>
                <p className="text-sm font-medium leading-relaxed">
                  {data.rajaongkirCityName}
                </p>
                {data.rajaongkirCity && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {data.rajaongkirCity}, {data.rajaongkirProvince}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Street Address */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Alamat Lengkap <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={data.address1}
            onChange={(e) => setField('address1', e.target.value)}
            onBlur={() => setTouched('address1')}
            placeholder="Jalan, nomor rumah, nama gedung, RT/RW..."
            rows={2}
            className={`py-3 rounded-xl ${
              touched.address1 && !data.address1.trim()
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : ''
            }`}
          />
          {touched.address1 && !data.address1.trim() && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Alamat lengkap wajib diisi
            </p>
          )}
        </div>

        {/* Additional Details */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Detail Tambahan <span className="text-neutral-400 font-normal">(opsional)</span>
          </label>
          <Input
            type="text"
            value={data.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Patokan, catatan untuk kurir..."
            className="py-3 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
