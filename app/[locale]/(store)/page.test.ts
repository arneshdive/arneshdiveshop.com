import { describe, expect, it, vi } from 'vitest';
import { createTranslator } from 'next-intl';
import id from '@/messages/id.json';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import ja from '@/messages/ja.json';
import fr from '@/messages/fr.json';
import { routing } from '@/i18n/routing';
import { siteConfig } from '@/config/site';

const messages = { id, en, es, ja, fr };

vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale, namespace }: { locale: keyof typeof messages; namespace: 'home' | 'tentangKami' }) =>
    createTranslator({ locale, namespace, messages: messages[locale] }),
}));
// Metadata must remain independent of live product/database availability.
vi.mock('@/lib/queries/products', () => ({ getProducts: vi.fn(() => { throw new Error('DB unavailable'); }) }));
// Next's navigation requires a Next runtime. Keep the routing adapter at the
// module boundary, while exercising the actual page's metadata generation.
vi.mock('@/i18n/navigation', async () => {
  const { routing } = await import('@/i18n/routing');
  return {
    Link: () => null,
    getPathname: ({ href, locale }: { href: string; locale: string }) =>
      locale === routing.defaultLocale ? href : `/${locale}${href === '/' ? '' : href}`,
  };
});

import { generateMetadata } from './page';
import { generateMetadata as generateAboutMetadata } from './tentang-kami/page';

describe('localized homepage metadata', () => {
  it.each(routing.locales)('self-canonicalizes %s and emits reciprocal alternates for all configured locales', async (locale) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale }) });
    const path = locale === routing.defaultLocale ? '/' : `/${locale}`;
    expect(new URL(String(metadata.alternates?.canonical)).pathname).toBe(path);
    expect(metadata.openGraph).toMatchObject({ url: metadata.alternates?.canonical });
    expect(metadata.title).toBe(messages[locale].home.meta.title);
    expect(metadata.description).toBe(messages[locale].home.meta.description);
    const languages = metadata.alternates?.languages as Record<string, string>;
    expect(Object.keys(languages).sort()).toEqual([...routing.locales, 'x-default'].sort());
    expect(languages[locale]).toBe(metadata.alternates?.canonical);
    expect(new URL(languages['x-default']!).pathname).toBe('/');
    for (const otherLocale of routing.locales) {
      const other = await generateMetadata({ params: Promise.resolve({ locale: otherLocale }) });
      expect(languages[otherLocale]).toBe(other.alternates?.canonical);
      expect(other.alternates?.languages).toEqual(languages);
      expect(new URL(languages[otherLocale]!).origin).toBe(new URL(siteConfig.url).origin);
    }
  });
});

describe('official about route metadata', () => {
  it.each(routing.locales)('advertises the %s about route with a self-canonical and locale alternates', async (locale) => {
    const metadata = await generateAboutMetadata({ params: Promise.resolve({ locale }) });
    const path = `${locale === routing.defaultLocale ? '' : `/${locale}`}/tentang-kami`;
    expect(new URL(String(metadata.alternates?.canonical)).pathname).toBe(path);
    expect(metadata.alternates?.languages?.[locale]).toBe(metadata.alternates?.canonical);
    expect(Object.keys(metadata.alternates?.languages || {}).sort()).toEqual([...routing.locales, 'x-default'].sort());
    expect(metadata.openGraph).toMatchObject({ url: metadata.alternates?.canonical });
    expect(metadata.title).toBe(messages[locale].tentangKami.meta.title);
    expect(metadata.description).toBe(messages[locale].tentangKami.meta.description);
  });
});
