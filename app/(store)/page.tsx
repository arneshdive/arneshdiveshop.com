import Link from 'next/link';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ProductSection } from '@/components/product/product-section';
import { WaveDivider } from '@/components/layout/wave-divider';
import { USPSection } from '@/components/layout/usp-section';
import { featuredProducts } from '@/lib/data/mock-products';

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[650px] lg:min-h-[740px]">
        {/* Background Image - full width */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-image.webp"
            alt="Freediving"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 min-h-[650px] lg:min-h-[740px] items-center gap-8 lg:gap-12">
              <div className="py-12 lg:py-0">
                <span className="inline-block text-xs uppercase tracking-widest text-white/70 mb-4">
                  Freediving & Scuba
                </span>
                <h1 className="text-4xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tighter">
                  Berjelajah di kedalaman
                </h1>
                <p className="text-white/80 text-lg mb-8 max-w-md leading-relaxed">
                  Temukan perlengkapan freediving yang Anda butuhkan.
                </p>
                <div className="flex flex-wrap gap-3">
                  <AnimatedButton
                    asChild
                    variant="white"
                    className="px-8 py-4 text-sm uppercase tracking-wider"
                  >
                    <Link href="/freediving">Lihat Koleksi</Link>
                  </AnimatedButton>
                </div>
              </div>
              <div className="hidden lg:block" />
            </div>
          </div>
        </div>

        <WaveDivider className="z-20" />
      </section>

      {/* Latest Products */}
      <ProductSection
        eyebrow="Latest Products"
        headingPrefix="Produk"
        headingHighlight="Terbaru"
        description="Peralatan diving berkualitas untuk petualangan bawah laut."
        ctaHref="/freediving"
        products={featuredProducts.slice(0, 4)}
      />

      {/* Split Banner */}
      <section className="relative grid md:grid-cols-2 mt-20">
        <div className="relative min-h-[550px] lg:min-h-[650px] bg-neutral-200 flex items-end p-8 lg:p-12">
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest text-neutral-500 mb-2 block">Freediving</span>
            <h3 className="text-2xl lg:text-3xl font-semibold mb-4">Koleksi Freediving</h3>
            <Link
              href="/freediving"
              className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Lihat Koleksi
              <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="relative min-h-[550px] lg:min-h-[650px] bg-neutral-300 flex items-end p-8 lg:p-12">
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest text-neutral-600 mb-2 block">Scuba</span>
            <h3 className="text-2xl lg:text-3xl font-semibold mb-4">Koleksi Scuba</h3>
            <Link
              href="/scuba"
              className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Lihat Koleksi
              <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <WaveDivider />
      </section>

      {/* Sale */}
      <ProductSection
        eyebrow="Sale"
        headingPrefix="Promo"
        headingHighlight="Spesial"
        description="Diskon spesial untuk produk terpilih."
        ctaHref="/produk?category=sale"
        products={featuredProducts.filter((p) => p.badge === 'Sale')}
      />

      {/* All Products */}
      <ProductSection
        eyebrow="Semua Produk"
        headingPrefix="Eksplor"
        headingHighlight="Lainnya"
        description="Temukan perlengkapan diving untuk kebutuhan Anda."
        ctaHref="/produk"
        products={featuredProducts.slice(0, 8)}
      />

      {/* Community - Instagram Feed */}
      <section className="py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col justify-between items-end mb-8">
            <div className="flex flex-col w-full items-center justify-center max-w-3xl mx-auto text-center">
              <span className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Passion, Freedom, Performance</span>
              <h2 className="text-2xl lg:text-6xl tracking-tighter font-bold mb-3">Visit Our Feed</h2>
              <p className="text-lg font-semibold tracking-tight mb-6">Flowers & Saints is an Australian streetwear brand built on purpose, not trends.</p>
              <p className="text-lg tracking-tight">Inspired by real moments and real people, these looks reflect modern Australian apparel — understated, confident, and designed to last.</p>
            </div>
            <a
              href="https://www.instagram.com/arnesh.official"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 text-sm hover:text-neutral-600 transition-colors hidden sm:flex items-center gap-1"
            >
              @arnesh.official
              <Icon icon="solar:arrow-right-up-linear" className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { image: '/instagram-1.jpg', url: 'https://www.instagram.com/p/DZhCEvySGyy/' },
              { image: '/instagram-2.jpg', url: 'https://www.instagram.com/p/DZ48gW2EhBO/' },
              { image: '/instagram-3.jpg', url: 'https://www.instagram.com/p/DaMfDOxyy6v/' },
              { image: '/instagram-4.jpg', url: 'https://www.instagram.com/p/DZ_3EsyS7CZ/' },
            ].map((post, index) => (
              <a
                key={index}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-[4/6] bg-neutral-100 rounded-lg overflow-hidden group relative"
              >
                <img
                  src={post.image}
                  alt="Instagram post"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Icon icon="mdi:instagram" className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* USP / Value Props - overlaps the footer below it */}
      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}
