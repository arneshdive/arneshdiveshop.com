import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { USPSection } from '@/components/layout/usp-section';
import { siteConfig } from '@/config/site';

interface SyaratPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SyaratPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'syarat' });
  const title = t('meta.title');
  const description = t('meta.description');
  const canonical = `${siteConfig.url}${getPathname({ href: '/syarat', locale })}`;

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${siteConfig.url}${getPathname({ href: '/syarat', locale: loc })}`;
  }
  languages['x-default'] = `${siteConfig.url}/syarat`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: 'website',
    },
  };
}

export default async function SyaratPage() {
  const t = await getTranslations('syarat');

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            {t('header.title')}
          </h1>
          <p className="text-neutral-500">
            {t('header.lastUpdated')}
          </p>
        </header>

        {/* Content */}
        <div className="prose prose-neutral max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.general.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.general.body')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.account.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              {t('sections.account.intro')}
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>{t('sections.account.items.0')}</li>
              <li>{t('sections.account.items.1')}</li>
              <li>{t('sections.account.items.2')}</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.purchase.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              {t('sections.purchase.intro')}
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>{t('sections.purchase.items.0')}</li>
              <li>{t('sections.purchase.items.1')}</li>
              <li>{t('sections.purchase.items.2')}</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-4">
              {t('sections.purchase.priceNote')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.payment.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.payment.body')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.shipping.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              {t('sections.shipping.intro')}
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li><strong>{t('sections.shipping.standardLabel')}</strong> {t('sections.shipping.standardValue')}</li>
              <li><strong>{t('sections.shipping.expressLabel')}</strong> {t('sections.shipping.expressValue')}</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-4">
              {t('sections.shipping.note')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.returns.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              {t('sections.returns.intro')}
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>{t('sections.returns.items.0')}</li>
              <li>{t('sections.returns.items.1')}</li>
              <li>{t('sections.returns.items.2')}</li>
              <li>{t('sections.returns.items.3')}</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-4">
              <strong>{t('sections.returns.exclusionsLabel')}</strong> {t('sections.returns.exclusionsText')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.warranty.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.warranty.body')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.ip.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.ip.body')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.liability.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.liability.body')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('sections.changes.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.changes.body')}
            </p>
          </section>
        </div>
      </div>

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* USP Section - overlaps the footer below it */}
      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}
