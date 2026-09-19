'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LOCALE_LABELS: Record<Locale, string> = {
  id: 'Indonesia',
  en: 'English',
  es: 'Español',
  ja: '日本語',
  fr: 'Français',
};

export function LanguageSwitcher({
  className = '',
  variant = 'dropdown',
}: {
  className?: string;
  variant?: 'dropdown' | 'inline';
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('nav');

  const handleChange = (nextLocale: string) => {
    const query = searchParams.toString();
    router.replace(
      { pathname, query: query ? Object.fromEntries(searchParams.entries()) : undefined },
      { locale: nextLocale }
    );
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{t('language')}</span>
        <select
          value={locale}
          onChange={(e) => handleChange(e.target.value)}
          aria-label={t('language')}
          className="text-base font-medium text-neutral-900 bg-transparent border border-neutral-200 rounded-full px-3 py-1.5"
        >
          {routing.locales.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABELS[code]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      aria-label={t('language')}
      className={`p-2 rounded-full transition-all text-sm font-medium bg-transparent border-none cursor-pointer ${className}`}
    >
      {routing.locales.map((code) => (
        <option key={code} value={code} className="text-neutral-900">
          {code.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
