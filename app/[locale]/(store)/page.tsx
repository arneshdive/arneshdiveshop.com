import Image from 'next/image';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ProductSection } from '@/components/product/product-section';
import { USPSection } from '@/components/layout/usp-section';
import { HeroBannerCarousel } from '@/components/store/hero-banner-carousel';
import { DivingTypeGrid } from '@/components/store/diving-type-grid';
import { getProducts } from '@/lib/queries/products';
import type { MockProduct } from '@/lib/data/mock-products';
import type { Banner } from '@/lib/db/schema';
import { computeProductPriceDisplay } from '@/lib/utils/product-pricing';

export const revalidate = 3600;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

// Mirrors the DivingTypeGrid section below (components/store/diving-type-grid.tsx),
// which is the actual list of activities the catalog is organized around —
// not just the two the hero banner happens to lead with.
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

// Convert DB product to MockProduct format for ProductSection
function toMockProduct(product: any): MockProduct {
  const badges: string[] = [];
  if (product.isNewArrival) badges.push('Baru');
  if (product.isOnSale) badges.push('Sale');

  const priceInfo = computeProductPriceDisplay({
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents ?? null,
    variants: (product.variants || []).map((v: any) => ({
      isActive: v.isActive,
      priceCents: v.priceCents,
    })),
  });

  return {
    id: product.id,
    handle: product.slug,
    title: product.name,
    vendor: product.brand?.name,
    price: priceInfo.priceDisplay,
    priceRangeMin: priceInfo.priceRangeMin,
    priceRangeMax: priceInfo.priceRangeMax,
    compareAtPrice: priceInfo.compareAtPriceDisplay,
    badges,
    image: product.images?.[0] || undefined,
    secondaryImage: product.images?.[1] || undefined,
    variantId: (product.variants || []).find((v: any) => v.isActive)?.id,
  };
}

export default async function HomePage() {
  const t = await getTranslations('home');

  // Static hero banners — banner management isn't built yet, so this
  // carousel content is hardcoded rather than sourced from the DB.
  const heroBanners: Banner[] = [
    {
      id: 'hero-1',
      title: t('hero.title'),
      subtitle: t('hero.subtitle'),
      eyebrow: t('hero.eyebrow'),
      ctaText: t('hero.ctaText'),
      ctaLink: '/produk',
      link: '/produk',
      imageUrl: '/hero-diver.webp',
      position: 'hero',
      sortOrder: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Banner,
  ];

  // Fetch new arrival products
  const newArrivals = await getProducts({ isActive: true, isNewArrival: true, limit: 4 });
  const newArrivalProducts: MockProduct[] = newArrivals.map(toMockProduct);

  // Fetch on sale products
  const onSaleProducts = await getProducts({ isActive: true, isOnSale: true, limit: 4 });
  const saleProducts: MockProduct[] = onSaleProducts.map(toMockProduct);

  // Fetch all latest products for the "explore" section
  const allProducts = await getProducts({ isActive: true, limit: 8 });
  const latestProducts: MockProduct[] = allProducts.map(toMockProduct);

  return (
    <>
      {/* Hero Section - Dynamic Banner Carousel */}
      <HeroBannerCarousel banners={heroBanners} />

      {/* New Arrivals */}
      {newArrivalProducts.length > 0 && (
        <ProductSection
          eyebrow={t('newArrivals.eyebrow')}
          headingPrefix={t('newArrivals.headingPrefix')}
          headingHighlight={t('newArrivals.headingHighlight')}
          description={t('newArrivals.description')}
          ctaHref="/produk?newArrival=true"
          viewAllLabel={t('viewAll')}
          products={newArrivalProducts}
        />
      )}

      {/* Diving Type Grid */}
      <DivingTypeGrid />

      {/* On Sale */}
      {saleProducts.length > 0 && (
        <ProductSection
          eyebrow={t('sale.eyebrow')}
          headingPrefix={t('sale.headingPrefix')}
          headingHighlight={t('sale.headingHighlight')}
          description={t('sale.description')}
          ctaHref="/produk?onSale=true"
          viewAllLabel={t('viewAll')}
          products={saleProducts}
        />
      )}

      {/* All Products */}
      <ProductSection
        eyebrow={t('explore.eyebrow')}
        headingPrefix={t('explore.headingPrefix')}
        headingHighlight={t('explore.headingHighlight')}
        description={t('explore.description')}
        ctaHref="/produk"
        viewAllLabel={t('viewAll')}
        products={latestProducts}
      />

      {/* Community - Instagram Feed */}
      <section className="py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col justify-between items-end mb-8">
            <div className="flex flex-col w-full items-center justify-center max-w-3xl mx-auto text-center">
              <span className="text-xs uppercase tracking-widest text-neutral-500 mb-4">{t('community.eyebrow')}</span>
              <h2 className="text-3xl lg:text-6xl tracking-tighter font-bold mb-3">{t('community.heading')}</h2>
              <p className="text-lg font-semibold tracking-tight mb-6">{t('community.description1')}</p>
              <p className="text-lg tracking-tight mb-8">{t('community.description2')}</p>
              <AnimatedButton asChild variant="outline" size="sm">
                <a
                  href="https://www.instagram.com/arnesh.official"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon icon="mdi:instagram" className="w-4 h-4" />
                  {t('community.instagramCta')}
                </a>
              </AnimatedButton>
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
                <Image
                  src={post.image}
                  alt={t('community.instagramAlt')}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
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
