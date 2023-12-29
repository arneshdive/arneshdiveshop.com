import Link from 'next/link';
import { Icon } from '@iconify/react';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import { RecentlyViewed } from '@/components/product/recently-viewed';
import { valueProps } from '@/lib/data/mock-products';

interface ProdukPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    divingType?: string;
    newArrival?: string;
    onSale?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

// Sort products based on sort parameter
function sortProducts(products: any[], sortBy: string) {
  const sorted = [...products];
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => {
        const priceA = parsePriceToCents(a.price);
        const priceB = parsePriceToCents(b.price);
        return priceA - priceB;
      });
    case 'price-desc':
      return sorted.sort((a, b) => {
        const priceA = parsePriceToCents(a.price);
        const priceB = parsePriceToCents(b.price);
        return priceB - priceA;
      });
    case 'popular':
      return sorted.sort((a, b) => {
        if (a.badge && !b.badge) return -1;
        if (!a.badge && b.badge) return 1;
        return 0;
      });
    default:
      return sorted;
  }
}

// Parse price string to cents for comparison
function parsePriceToCents(priceStr: string): number {
  return parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
}

// Get banner config based on filters
function getBannerConfig(
  query: string,
  category: any | null,
  brand: any | null,
  divingType: string | undefined,
  isNewArrival: boolean | undefined,
  isOnSale: boolean | undefined
): { title: string; description: string; gradient: string } {
  if (isNewArrival) {
    return {
      title: query ? `New Arrivals: "${query}"` : 'New Arrivals',
      description: 'Produk terbaru untuk petualangan diving Anda.',
      gradient: 'from-emerald-600 to-emerald-500',
    };
  }

  if (isOnSale) {
    return {
      title: query ? `Promo: "${query}"` : 'Promo Spesial',
      description: 'Diskon spesial untuk produk terpilih.',
      gradient: 'from-red-600 to-red-500',
    };
  }

  if (divingType === 'freediving') {
    return {
      title: query ? `Freediving: "${query}"` : 'Koleksi Freediving',
      description: 'Peralatan freediving berkualitas untuk petualangan bawah laut.',
      gradient: 'from-blue-600 to-blue-500',
    };
  }

  if (divingType === 'scuba') {
    return {
      title: query ? `Scuba: "${query}"` : 'Koleksi Scuba',
      description: 'Peralatan scuba diving lengkap untuk eksplorasi laut dalam.',
      gradient: 'from-teal-600 to-teal-500',
    };
  }

  if (category) {
    return {
      title: query ? `${category.name}: "${query}"` : category.name,
      description: category.description || 'Jelajahi produk dalam kategori ini.',
      gradient: 'from-blue-600 to-blue-500',
    };
  }

  if (brand) {
    return {
      title: query ? `${brand.name}: "${query}"` : brand.name,
      description: brand.description || 'Produk dari merek terpercaya.',
      gradient: 'from-teal-600 to-teal-500',
    };
  }

  // No category or brand - show search results or all products
  if (query) {
    return {
      title: `Hasil untuk "${query}"`,
      description: 'Temukan produk yang Anda cari dari koleksi kami.',
      gradient: 'from-neutral-700 to-neutral-500',
    };
  }

  // All products
  return {
    title: 'Semua Produk',
    description: 'Jelajahi koleksi lengkap perlengkapan freediving, scuba, dan aksesoris berkualitas tinggi.',
    gradient: 'from-neutral-700 to-neutral-500',
  };
}

export default async function ProdukPage({ searchParams }: ProdukPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const sortBy = params.sort || 'newest';
  const categoryFilter = params.category || undefined;
  const brandFilter = params.brand || undefined;
  const divingTypeFilter = params.divingType || undefined;
  const newArrivalFilter = params.newArrival || undefined;
  const onSaleFilter = params.onSale || undefined;
  const minPrice = params.minPrice || undefined;
  const maxPrice = params.maxPrice || undefined;

  // Build search URL
  const searchUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/search`);
  if (query) searchUrl.searchParams.set('q', query);
  if (categoryFilter) searchUrl.searchParams.set('category', categoryFilter);
  if (brandFilter) searchUrl.searchParams.set('brand', brandFilter);
  if (divingTypeFilter) searchUrl.searchParams.set('divingType', divingTypeFilter);
  if (newArrivalFilter) searchUrl.searchParams.set('newArrival', newArrivalFilter);
  if (onSaleFilter) searchUrl.searchParams.set('onSale', onSaleFilter);
  if (minPrice) searchUrl.searchParams.set('minPrice', minPrice);
  if (maxPrice) searchUrl.searchParams.set('maxPrice', maxPrice);

  // Fetch search results
  const response = await fetch(searchUrl.toString(), {
    cache: 'no-store', // Always fetch fresh data
  });
  
  const data = await response.json();
  
  const products = data.products || [];
  const total = data.total || 0;
  const categories = data.categories || [];
  const brands = data.brands || [];
  const categoryDistribution = data.categoryDistribution || {};
  const brandDistribution = data.brandDistribution || {};

  // Find selected category and brand for banner
  const selectedCategory = categoryFilter 
    ? categories.find((c: any) => c.id === categoryFilter || c.slug === categoryFilter)
    : null;
  const selectedBrand = brandFilter
    ? brands.find((b: any) => b.id === brandFilter || b.slug === brandFilter)
    : null;

  // Sort products
  const sortedProducts = sortProducts(products, sortBy);
  
  // Get banner config
  const banner = getBannerConfig(
    query, 
    selectedCategory, 
    selectedBrand,
    divingTypeFilter,
    newArrivalFilter === 'true',
    onSaleFilter === 'true'
  );

  // Build breadcrumb
  const breadcrumb = [
    { label: 'Beranda', href: '/' },
    ...(selectedCategory ? [{ label: selectedCategory.name, href: `/produk?category=${selectedCategory.slug}` }] : []),
    ...(selectedBrand && !selectedCategory ? [{ label: selectedBrand.name, href: `/produk?brand=${selectedBrand.slug}` }] : []),
    ...(query ? [{ label: `"${query}"`, href: `/produk?q=${query}` }] : []),
  ];

  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 pt-4 text-xs text-neutral-500">
        {breadcrumb.map((item, i) => (
          <span key={item.href}>
            {i > 0 && ' / '}
            {i === breadcrumb.length - 1 ? (
              <span className="text-neutral-900">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-neutral-900">
                {item.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* Banner */}
      <section className={`bg-gradient-to-r ${banner.gradient} text-white py-12 lg:py-16 px-4 lg:px-12 mt-4`}>
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-2xl lg:text-4xl font-bold tracking-tight mb-2">{banner.title}</h1>
          <p className="text-white/80 max-w-xl">{banner.description}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <SearchFilters
            categories={categories}
            brands={brands}
            categoryDistribution={categoryDistribution}
            brandDistribution={brandDistribution}
            selectedCategory={categoryFilter}
            selectedBrand={brandFilter}
            selectedDivingType={divingTypeFilter}
            minPrice={minPrice}
            maxPrice={maxPrice}
            query={query}
            totalResults={total}
          />
          <SearchResults products={sortedProducts} total={total} sortBy={sortBy} />
        </div>
      </div>

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* USP / Value Props - overlaps the footer below it */}
      <section className="relative z-10 bg-white rounded-b-[2.5rem] shadow-[0_30px_50px_-35px_rgba(0,0,0,0.35)] -mb-16 lg:-mb-20 py-14 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
            {valueProps.map((prop) => (
              <div key={prop.title} className="text-center px-6 py-6 sm:py-0">
                <Icon icon={prop.icon} className="w-8 h-8 mx-auto mb-4 text-neutral-800" />
                <h4 className="font-semibold text-base mb-1.5">{prop.title}</h4>
                <p className="text-xs lg:text-sm text-neutral-500 max-w-[220px] mx-auto">{prop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
