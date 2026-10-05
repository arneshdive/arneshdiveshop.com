import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import Script from 'next/script';
import './globals.css';
import { siteConfig } from '@/config/site';
import { JsonLd } from '@/components/seo/json-ld';
import { getPublicShopSettings } from '@/lib/queries/settings';
import { getBusinessJsonLd } from '@/lib/seo/business';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Force light mode: the storefront/admin UI has no dark theme, so native
// browser UI (scrollbars, form controls) shouldn't switch on OS/browser dark
// mode either.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.shortName,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const settings = await getPublicShopSettings();

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={getBusinessJsonLd(settings)} />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: siteConfig.name,
            url: siteConfig.url,
            publisher: { '@id': `${siteConfig.url}/#store` },
            potentialAction: {
              '@type': 'SearchAction',
              target: `${siteConfig.url}/produk?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }}
        />
        {children}
        {process.env.NODE_ENV === 'production' && (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id="632b2566-7f7a-4148-9693-21a50c6487d7"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
