import Link from 'next/link';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ProductSection } from '@/components/product/product-section';
import { WaveDivider } from '@/components/layout/wave-divider';
import { USPSection } from '@/components/layout/usp-section';
import { HeroBannerCarousel } from '@/components/store/hero-banner-carousel';
import { getProducts } from '@/lib/queries/products';
import { db, banners } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import type { MockProduct } from '@/lib/data/mock-products';

// Convert DB product to MockProduct format for ProductSection
function toMockProduct(product: any): MockProduct {
  const badge = product.isNewArrival 
    ? 'New Arrival' 
    : product.isOnSale 
      ? 'Sale' 
      : undefined;
  
  // Calculate price range from variants
  // Note: priceCents fields store whole Rupiah amounts (not actual cents)
  const variantPrices = (product.variants || [])
    .filter((v: any) => v.isActive && v.priceCents !== null)
    .map((v: any) => v.priceCents);
  
  let priceDisplay: string;
  
  if (variantPrices.length > 0) {
    // Variants have their own prices - show range or single price
    const minPrice = Math.min(...variantPrices);
    const maxPrice = Math.max(...variantPrices);
    
    // Use base price as minimum if it's lower than variant prices
    const effectiveMin = product.priceCents ? Math.min(product.priceCents, minPrice) : minPrice;
    const effectiveMax = Math.max(minPrice, product.priceCents || 0, maxPrice);
    
    if (effectiveMin === effectiveMax) {
      priceDisplay = `Rp ${effectiveMin.toLocaleString('id-ID')}`;
    } else {
      priceDisplay = `Rp ${effectiveMin.toLocaleString('id-ID')} - Rp ${effectiveMax.toLocaleString('id-ID')}`;
    }
  } else {
    // No variant prices - use base price
    priceDisplay = product.priceCents ? `Rp ${product.priceCents.toLocaleString('id-ID')}` : 'Rp 0';
  }
      
  return {
    id: product.id,
    handle: product.slug,
    title: product.name,
    vendor: product.brand?.name,
    price: priceDisplay,
    compareAtPrice: product.compareAtPriceCents 
      ? `Rp ${product.compareAtPriceCents.toLocaleString('id-ID')}` 
      : undefined,
    badge,
    image: product.images?.[0] || undefined,
    secondaryImage: product.images?.[1] || undefined,
  };
}

export default async function HomePage() {
  // Fetch new arrival products
  const newArrivals = await getProducts({ isActive: true, isNewArrival: true });
  const newArrivalProducts: MockProduct[] = newArrivals.slice(0, 4).map(toMockProduct);
  
  // Fetch on sale products
  const onSaleProducts = await getProducts({ isActive: true, isOnSale: true });
  const saleProducts: MockProduct[] = onSaleProducts.slice(0, 4).map(toMockProduct);
  
  // Fetch all latest products for the "explore" section
  const allProducts = await getProducts({ isActive: true });
  const latestProducts: MockProduct[] = allProducts.slice(0, 8).map(toMockProduct);
  
  // Fetch hero banners from DB
  const heroBanners = await db.query.banners.findMany({
    where: and(
      eq(banners.position, 'hero'),
      eq(banners.isActive, true)
    ),
    orderBy: (banners, { asc }) => [asc(banners.sortOrder)],
  });

  return (
    <>
      {/* Hero Section - Dynamic Banner Carousel */}
      <HeroBannerCarousel banners={heroBanners} />

      {/* New Arrivals */}
      {newArrivalProducts.length > 0 && (
        <ProductSection
          eyebrow="New Arrivals"
          headingPrefix="Produk"
          headingHighlight="Terbaru"
          description="Peralatan diving terbaru untuk petualangan bawah laut."
          ctaHref="/produk?newArrival=true"
          products={newArrivalProducts}
        />
      )}

      {/* Split Banner - Diving Types */}
      <section className="relative grid md:grid-cols-2 mt-20">
        <div className="relative min-h-[550px] lg:min-h-[650px] bg-neutral-200 flex items-end p-8 lg:p-12">
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest text-neutral-500 mb-2 block">Freediving</span>
            <h3 className="text-2xl lg:text-3xl font-semibold mb-4">Koleksi Freediving</h3>
            <AnimatedButton asChild variant="white">
              <Link href="/produk?divingType=freediving">
                Lihat Koleksi
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </Link>
            </AnimatedButton>
          </div>
        </div>
        <div className="relative min-h-[550px] lg:min-h-[650px] bg-neutral-300 flex items-end p-8 lg:p-12">
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest text-neutral-600 mb-2 block">Scuba</span>
            <h3 className="text-2xl lg:text-3xl font-semibold mb-4">Koleksi Scuba</h3>
            <AnimatedButton asChild variant="white">
              <Link href="/produk?divingType=scuba">
                Lihat Koleksi
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </Link>
            </AnimatedButton>
          </div>
        </div>
        <WaveDivider />
      </section>

      {/* On Sale */}
      {saleProducts.length > 0 && (
        <ProductSection
          eyebrow="Sale"
          headingPrefix="Promo"
          headingHighlight="Spesial"
          description="Diskon spesial untuk produk terpilih."
          ctaHref="/produk?onSale=true"
          products={saleProducts}
        />
      )}

      {/* All Products */}
      <ProductSection
        eyebrow="Semua Produk"
        headingPrefix="Eksplor"
        headingHighlight="Lainnya"
        description="Temukan perlengkapan diving untuk kebutuhan Anda."
        ctaHref="/produk"
        products={latestProducts.slice(0, 8)}
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
