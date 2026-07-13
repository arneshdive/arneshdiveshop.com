'use client';

import { Input } from '@/components/admin/input';
import { useCheckoutStore } from '@/lib/store/checkout';
import { isValidEmail, isValidPhone } from '@/lib/utils/validators';
import { formatPhoneInput } from '@/lib/utils/format';

export function ContactForm() {
  const { data, setField, touched, setTouched } = useCheckoutStore();

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
          <Input
            type="email"
            value={data.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => setTouched('email')}
            placeholder="email@contoh.com"
            className={`py-3 rounded-xl ${
              touched.email && (!data.email || !isValidEmail(data.email))
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : data.email && !isValidEmail(data.email)
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : ''
            }`}
          />
          {touched.email && !data.email && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Email wajib diisi
            </p>
          )}
          {data.email && !isValidEmail(data.email) && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Format email tidak valid
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            No. Telepon <span className="text-red-500">*</span>
          </label>
          <Input
            type="tel"
            value={data.phone}
            onChange={(e) => {
              const formatted = formatPhoneInput(e.target.value);
              setField('phone', formatted);
            }}
            onBlur={() => setTouched('phone')}
            placeholder="0812-3456-7890"
            className={`py-3 rounded-xl ${
              touched.phone && (!data.phone || !isValidPhone(data.phone))
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : data.phone && !isValidPhone(data.phone)
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : ''
            }`}
          />
          {touched.phone && !data.phone && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              No. Telepon wajib diisi
            </p>
          )}
          {data.phone && !isValidPhone(data.phone) && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Format nomor telepon tidak valid
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
