import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link, getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Icon } from '@iconify/react';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { AnimatedButton } from '@/components/ui/animated-button';
import { USPSection } from '@/components/layout/usp-section';
import { JsonLd } from '@/components/seo/json-ld';
import { getPublicShopSettings } from '@/lib/queries/settings';
import { siteConfig } from '@/config/site';

interface FAQPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FAQPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faq' });
  const title = t('meta.title');
  const description = t('meta.description');
  const canonical = `${siteConfig.url}${getPathname({ href: '/faq', locale })}`;

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${siteConfig.url}${getPathname({ href: '/faq', locale: loc })}`;
  }
  languages['x-default'] = `${siteConfig.url}/faq`;

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

const FAQ_CATEGORY_IDS = ['pengiriman', 'pengembalian', 'pembayaran', 'produk', 'akun'] as const;
type FaqCategoryId = (typeof FAQ_CATEGORY_IDS)[number];

const faqCategoryIcons: Record<FaqCategoryId, string> = {
  pengiriman: 'solar:box-linear',
  pengembalian: 'solar:refresh-linear',
  pembayaran: 'solar:card-linear',
  produk: 'solar:bag-linear',
  akun: 'solar:user-linear',
};

const FAQ_ITEM_COUNT: Record<FaqCategoryId, number> = {
  pengiriman: 4,
  pengembalian: 4,
  pembayaran: 4,
  produk: 4,
  akun: 4,
};

export default async function FAQPage() {
  const settings = await getPublicShopSettings();
  const t = await getTranslations('faq');

  const faqCategories = FAQ_CATEGORY_IDS.map((id) => ({
    id,
    label: t(`categories.${id}`),
    icon: faqCategoryIcons[id],
  }));

  const faqData: Record<FaqCategoryId, { question: string; answer: string }[]> =
    Object.fromEntries(
      FAQ_CATEGORY_IDS.map((id) => [
        id,
        Array.from({ length: FAQ_ITEM_COUNT[id] }).map((_, index) => ({
          question: t(`items.${id}.${index}.question`),
          answer: t(`items.${id}.${index}.answer`),
        })),
      ])
    ) as Record<FaqCategoryId, { question: string; answer: string }[]>;

  const allFaqs = Object.values(faqData).flat();

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: allFaqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }}
      />
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            {t('header.title')}
          </h1>
          <p className="text-neutral-500 max-w-xl mx-auto mb-8">
            {t('header.description')}
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="search"
                placeholder={t('header.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
        </header>

        {/* Category Links */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {faqCategories.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-full text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Icon icon={cat.icon} className="w-4 h-4" />
              {cat.label}
            </a>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="max-w-3xl mx-auto space-y-12">
          {faqCategories.map((cat) => (
            <section key={cat.id} id={cat.id}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon icon={cat.icon} className="w-5 h-5 text-neutral-500" />
                {cat.label}
              </h2>
              <Accordion>
                {faqData[cat.id as keyof typeof faqData].map((item, index) => (
                  <AccordionItem key={index} title={item.question}>
                    {item.answer}
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-16 text-center">
          <p className="text-neutral-500 mb-4">{t('header.stillNeedHelp')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <AnimatedButton asChild variant="outline">
              <Link href="/kontak" className="inline-flex items-center gap-2.5 whitespace-nowrap">
                <Icon icon="solar:letter-linear" className="w-4 h-4" />
                {t('header.contactUs')}
              </Link>
            </AnimatedButton>
            <AnimatedButton asChild>
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer">
                <Icon icon="solar:chat-round-dots-linear" className="w-4 h-4" />
                WhatsApp
              </a>
            </AnimatedButton>
          </div>
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
