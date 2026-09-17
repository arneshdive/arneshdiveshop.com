import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { USPSection } from '@/components/layout/usp-section';
import { JsonLd } from '@/components/seo/json-ld';
import { guides, getGuideBySlug, getGuideImagePath } from '@/lib/data/guides';
import { siteConfig } from '@/config/site';

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return { title: 'Panduan tidak ditemukan' };
  }

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: `${siteConfig.url}/panduan/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      publishedTime: guide.publishedAt,
      images: [`${siteConfig.url}${getGuideImagePath(guide)}`],
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const guideUrl = `${siteConfig.url}/panduan/${guide.slug}`;
  const guideImage = `${siteConfig.url}${getGuideImagePath(guide)}`;
  const productHref = guide.category
    ? `/produk?category=${guide.category}${guide.divingType ? `&divingType=${guide.divingType}` : ''}`
    : guide.divingType
      ? `/produk?divingType=${guide.divingType}`
      : '/produk';

  const otherGuides = guides.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.title,
          description: guide.description,
          image: [guideImage],
          datePublished: guide.publishedAt,
          dateModified: guide.publishedAt,
          author: { '@type': 'Organization', name: siteConfig.name },
          publisher: {
            '@type': 'Organization',
            name: siteConfig.name,
            logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon.png` },
          },
          url: guideUrl,
          mainEntityOfPage: guideUrl,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: 'Panduan', item: `${siteConfig.url}/panduan` },
            { '@type': 'ListItem', position: 3, name: guide.title, item: guideUrl },
          ],
        }}
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-4">
        <nav className="text-xs text-neutral-600">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Beranda</Link>
          <span className="mx-2">/</span>
          <Link href="/panduan" className="hover:text-neutral-900 transition-colors">Panduan</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900 font-medium">{guide.title}</span>
        </nav>
      </div>

      <article className="max-w-3xl mx-auto px-6 lg:px-12 py-8 lg:py-12">
        <header className="mb-10">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-4">
            <Icon icon={guide.icon} className="w-6 h-6 text-neutral-700" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">{guide.title}</h1>
          <p className="text-neutral-500 text-lg">{guide.intro}</p>
        </header>

        <div className="space-y-10">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                {section.body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 p-6 bg-neutral-50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-neutral-600">Siap belanja? Jelajahi pilihan produk yang sesuai.</p>
          <AnimatedButton asChild size="sm">
            <Link href={productHref}>
              <Icon icon="solar:bag-linear" className="w-4 h-4" />
              {guide.ctaLabel}
            </Link>
          </AnimatedButton>
        </div>

        {otherGuides.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-semibold mb-4">Panduan Lainnya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {otherGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/panduan/${g.slug}`}
                  className="p-4 border border-neutral-200 rounded-xl hover:border-neutral-400 transition-colors text-sm font-medium"
                >
                  {g.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}
