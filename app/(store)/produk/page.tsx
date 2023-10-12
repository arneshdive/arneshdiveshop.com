import Link from 'next/link';
import { ParallaxShowcase } from '@/components/parallax-showcase';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import {
  searchProducts,
  getAvailableBrands,
  CATEGORY_CONFIG,
  type SearchFilters as SearchFiltersType,
  type CategoryKey,
} from '@/lib/data/search-utils';
import { featuredProducts } from '@/lib/data/mock-products';

interface ProdukPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    priceMin?: string;
    priceMax?: string;
    brands?: string;
  }>;
}

// Sort products based on sort parameter
function sortProducts(products: typeof featuredProducts, sortBy: string) {
  const sorted = [...products];
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => {
        const priceA = parseInt(a.price.replace(/[^\d]/g, ''), 10) || 0;
        const priceB = parseInt(b.price.replace(/[^\d]/g, ''), 10) || 0;
        return priceA - priceB;
      });
    case 'price-desc':
      return sorted.sort((a, b) => {
        const priceA = parseInt(a.price.replace(/[^\d]/g, ''), 10) || 0;
        const priceB = parseInt(b.price.replace(/[^\d]/g, ''), 10) || 0;
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

// Get banner config based on filters
function getBannerConfig(
  query: string,
  category: CategoryKey | undefined
): { title: string; description: string; gradient: string } {
  if (category && CATEGORY_CONFIG[category]) {
    const config = CATEGORY_CONFIG[category];
    return {
      title: query ? `${config.label}: "${query}"` : config.label,
      description: config.description,
      gradient: config.gradient,
    };
  }

  // No category - show search results or all products
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
  const category = params.category as CategoryKey | undefined;

  const filters: SearchFiltersType = {
    query,
    category,
    priceMin: params.priceMin ? parseInt(params.priceMin, 10) : undefined,
    priceMax: params.priceMax ? parseInt(params.priceMax, 10) : undefined,
    brands: params.brands?.split(',').filter(Boolean),
  };

  const { products, total, categoryDistribution } = searchProducts(featuredProducts, filters);
  const sortedProducts = sortProducts(products, sortBy);
  const availableBrands = getAvailableBrands(featuredProducts);
  const banner = getBannerConfig(query, category);

  // Build breadcrumb
  const breadcrumb = [
    { label: 'Beranda', href: '/' },
    ...(category ? [{ label: CATEGORY_CONFIG[category].label, href: `/produk?category=${category}` }] : []),
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
      <section className={`bg-gradient-to-r ${banner.gradient} text-white py-12 lg:py-16 px-4 mt-4`}>
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-3xl lg:text-4xl font-semibold mb-2">{banner.title}</h1>
          <p className="text-white/80 max-w-xl">{banner.description}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <SearchFilters
            filters={filters}
            categoryDistribution={categoryDistribution}
            availableBrands={availableBrands}
            totalResults={total}
          />
          <SearchResults products={sortedProducts} total={total} sortBy={sortBy} />
        </div>
      </div>

      {/* Parallax Showcase */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 pb-16 lg:pb-24">
        <ParallaxShowcase />
      </div>
    </>
  );
}
