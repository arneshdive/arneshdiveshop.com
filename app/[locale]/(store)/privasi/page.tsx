import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { USPSection } from '@/components/layout/usp-section';
import { siteConfig } from '@/config/site';

interface PrivasiPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PrivasiPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privasi' });
  const title = t('meta.title');
  const description = t('meta.description');
  const canonical = `${siteConfig.url}${getPathname({ href: '/privasi', locale })}`;

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${siteConfig.url}${getPathname({ href: '/privasi', locale: loc })}`;
  }
  languages['x-default'] = `${siteConfig.url}/privasi`;

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

export default async function PrivasiPage() {
  const t = await getTranslations('privasi');

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
            <h2 className="text-xl font-semibold mb-4">{t('sections.intro.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.intro.body')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.dataCollected.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              {t('sections.dataCollected.intro')}
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li><strong>{t('sections.dataCollected.items.personal.label')}</strong> {t('sections.dataCollected.items.personal.text')}</li>
              <li><strong>{t('sections.dataCollected.items.payment.label')}</strong> {t('sections.dataCollected.items.payment.text')}</li>
              <li><strong>{t('sections.dataCollected.items.device.label')}</strong> {t('sections.dataCollected.items.device.text')}</li>
              <li><strong>{t('sections.dataCollected.items.navigation.label')}</strong> {t('sections.dataCollected.items.navigation.text')}</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.usage.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              {t('sections.usage.intro')}
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>{t('sections.usage.items.0')}</li>
              <li>{t('sections.usage.items.1')}</li>
              <li>{t('sections.usage.items.2')}</li>
              <li>{t('sections.usage.items.3')}</li>
              <li>{t('sections.usage.items.4')}</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.security.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.security.body')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.cookies.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.cookies.body')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.sharing.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.sharing.intro')}
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>{t('sections.sharing.items.0')}</li>
              <li>{t('sections.sharing.items.1')}</li>
              <li>{t('sections.sharing.items.2')}</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.rights.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              {t('sections.rights.intro')}
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>{t('sections.rights.items.0')}</li>
              <li>{t('sections.rights.items.1')}</li>
              <li>{t('sections.rights.items.2')}</li>
              <li>{t('sections.rights.items.3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('sections.contact.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.contact.intro')}
            </p>
            <ul className="list-none text-neutral-700 space-y-1 mt-3">
              <li>Email: support@arneshdive.com</li>
              <li>WhatsApp: +62 812-3456-7890</li>
            </ul>
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
