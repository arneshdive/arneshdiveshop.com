'use client';

import { useCheckoutStore } from '@/lib/store/checkout';
import { isValidEmail, isValidPhone } from '@/lib/utils/validators';

export function ContactForm() {
  const { data, setField } = useCheckoutStore();

  return (
    <div className="pb-8 mb-8 border-b border-neutral-200">
      <h2 className="text-lg font-semibold tracking-tight mb-6">
        Informasi Kontak
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="email@contoh.com"
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors ${
              data.email && !isValidEmail(data.email)
                ? 'border-red-300 focus:border-red-500'
                : 'border-neutral-200 focus:border-neutral-900'
            }`}
          />
          {data.email && !isValidEmail(data.email) && (
            <p className="text-xs text-red-500 mt-1">Format email tidak valid</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            No. Telepon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="08xxxxxxxxxx"
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors ${
              data.phone && !isValidPhone(data.phone)
                ? 'border-red-300 focus:border-red-500'
                : 'border-neutral-200 focus:border-neutral-900'
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
