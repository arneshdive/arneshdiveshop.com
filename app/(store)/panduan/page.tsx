import Link from 'next/link';
import type { Metadata } from 'next';
import { Icon } from '@iconify/react';
import { JsonLd } from '@/components/seo/json-ld';
import { USPSection } from '@/components/layout/usp-section';
import { guides } from '@/lib/data/guides';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Panduan Diving',
  description:
    'Panduan memilih dan merawat perlengkapan freediving dan scuba diving — masker, fin, wetsuit, BCD, dan regulator.',
  alternates: {
    canonical: `${siteConfig.url}/panduan`,
  },
};

export default function PanduanIndexPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: 'Panduan', item: `${siteConfig.url}/panduan` },
          ],
        }}
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <header className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Panduan Diving</h1>
          <p className="text-neutral-500 max-w-xl mx-auto">
            Tips memilih dan merawat perlengkapan freediving dan scuba diving, ditulis untuk membantu Anda
            memilih produk yang tepat sebelum membeli.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/panduan/${guide.slug}`}
              className="group flex flex-col p-6 border border-neutral-200 rounded-2xl hover:border-neutral-400 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-4">
                <Icon icon={guide.icon} className="w-6 h-6 text-neutral-700" />
              </div>
              <h2 className="text-lg font-semibold mb-2 group-hover:underline">{guide.title}</h2>
              <p className="text-sm text-neutral-500 mb-4">{guide.description}</p>
              <span className="mt-auto text-sm font-medium inline-flex items-center gap-1 text-neutral-900">
                Baca panduan
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}
