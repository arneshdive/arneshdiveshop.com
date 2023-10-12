'use client';

import { useCheckoutStore } from '@/lib/store/checkout';
import { isValidEmail, isValidPhone } from '@/lib/utils/validators';

export function ContactForm() {
  const { data, setField } = useCheckoutStore();

  return (
    <div className="bg-white p-6 mb-6 border border-neutral-200">
      <h2 className="font-semibold text-lg mb-6 pb-3 border-b border-neutral-200">
        Informasi Kontak
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="email@contoh.com"
            className={`w-full px-3 py-3 border text-sm focus:outline-none ${
              data.email && !isValidEmail(data.email)
                ? 'border-red-500 focus:border-red-500'
                : 'border-neutral-300 focus:border-neutral-900'
            }`}
          />
          {data.email && !isValidEmail(data.email) && (
            <p className="text-xs text-red-500 mt-1">Format email tidak valid</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Nomor Telepon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="08xxxxxxxxxx"
            className={`w-full px-3 py-3 border text-sm focus:outline-none ${
              data.phone && !isValidPhone(data.phone)
                ? 'border-red-500 focus:border-red-500'
                : 'border-neutral-300 focus:border-neutral-900'
            }`}
          />
          {data.phone && !isValidPhone(data.phone) && (
            <p className="text-xs text-red-500 mt-1">Format nomor telepon tidak valid</p>
          )}
        </div>
      </div>
    </div>
  );
}
