import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { USPSection } from '@/components/layout/usp-section';
import { siteConfig } from '@/config/site';

interface TentangKamiPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TentangKamiPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tentangKami' });
  const title = t('meta.title');
  const description = t('meta.description');
  const canonical = `${siteConfig.url}${getPathname({ href: '/tentang-kami', locale })}`;

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${siteConfig.url}${getPathname({ href: '/tentang-kami', locale: loc })}`;
  }
  languages['x-default'] = `${siteConfig.url}/tentang-kami`;

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

export default async function TentangKamiPage() {
  const t = await getTranslations('tentangKami');

  const channels = [
    { label: t('sections.channels.website'), href: siteConfig.url, icon: 'solar:global-linear' },
    { label: t('sections.channels.shopee'), href: siteConfig.links.shopee, icon: 'simple-icons:shopee' },
    { label: t('sections.channels.tokopedia'), href: siteConfig.links.tokopedia, icon: 'simple-icons:tokopedia' },
    { label: `${t('sections.channels.instagram')} · Arnesh Dive`, href: siteConfig.links.instagram, icon: 'mdi:instagram' },
    { label: `${t('sections.channels.instagram')} · Haeste Diveshop`, href: siteConfig.links.haesteInstagram, icon: 'mdi:instagram' },
  ];

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            {t('header.title')}
          </h1>
          <p className="text-neutral-500 max-w-xl">
            {t('header.description')}
          </p>
        </header>

        {/* Content */}
        <div className="prose prose-neutral max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.brand.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.brand.body')}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t('sections.seller.heading')}</h2>
            <p className="text-neutral-700 leading-relaxed">
              {t('sections.seller.body')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-6">{t('sections.channels.heading')}</h2>
            <div className="flex flex-wrap gap-3 not-prose">
              {channels.map((channel) => (
                <AnimatedButton key={channel.label} asChild variant="outline" size="sm">
                  <a href={channel.href} target="_blank" rel="noopener noreferrer">
                    <Icon icon={channel.icon} className="w-4 h-4" />
                    {channel.label}
                  </a>
                </AnimatedButton>
              ))}
            </div>
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
