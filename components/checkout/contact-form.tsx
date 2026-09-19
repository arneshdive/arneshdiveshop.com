'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/admin/input';
import { useCheckoutStore } from '@/lib/store/checkout';
import { checkoutFormSchema, getFieldI18nKey } from '@/lib/validations/checkout';
import { formatPhoneInput } from '@/lib/utils/format';

// Shared field-error markup: shown once a field is touched (blurred) and
// still fails, or immediately if it fails on a format rule (not "required")
// while the person is still typing — matches ContactForm's original behavior
// of giving live feedback on format without nagging about empty fields
// before they've left them.
function FieldError({ message }: { message: string }) {
  return (
    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
}

export function ContactForm() {
  const t = useTranslations('checkout');
  const { data, setField, touched, setTouched } = useCheckoutStore();
  const validation = checkoutFormSchema.safeParse(data);
  const emailErrorKey = getFieldI18nKey(validation, 'email');
  const phoneErrorKey = getFieldI18nKey(validation, 'phone');
  const showEmailError = (touched.email && !!emailErrorKey) || emailErrorKey === 'contact.emailInvalid';
  const showPhoneError = (touched.phone && !!phoneErrorKey) || phoneErrorKey === 'contact.phoneInvalid';

  return (
    <div className="pb-8 mb-8 border-b border-neutral-200">
      <h2 className="text-lg font-semibold tracking-tight mb-6">
        {t('contact.title')}
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('contact.emailLabel')} <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={data.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => setTouched('email')}
            placeholder={t('contact.emailPlaceholder')}
            className={`py-3 rounded-xl ${
              showEmailError ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''
            }`}
          />
          {showEmailError && emailErrorKey && <FieldError message={t(emailErrorKey)} />}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('contact.phoneLabel')} <span className="text-red-500">*</span>
          </label>
          <Input
            type="tel"
            value={data.phone}
            onChange={(e) => {
              const formatted = formatPhoneInput(e.target.value);
              setField('phone', formatted);
            }}
            onBlur={() => setTouched('phone')}
            placeholder={t('contact.phonePlaceholder')}
            className={`py-3 rounded-xl ${
              showPhoneError ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''
            }`}
          />
          {showPhoneError && phoneErrorKey && <FieldError message={t(phoneErrorKey)} />}
        </div>
      </div>
    </div>
  );
}
