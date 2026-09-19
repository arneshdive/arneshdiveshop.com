import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['id', 'en', 'es', 'ja', 'fr'],
  defaultLocale: 'id',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
