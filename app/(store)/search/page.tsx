import { Suspense } from 'react';
import Link from 'next/link';
import { SearchInput } from '@/components/search/search-input';
import { SearchBanner } from '@/components/search/search-banner';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import { EmptySearch } from '@/components/search/empty-search';
import {
  searchProducts,
  getAvailableBrands,
  type SearchFilters as SearchFiltersType,
  type CategoryKey,
} from '@/lib/data/search-utils';
import { featuredProducts } from '@/lib/data/mock-products';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    priceMin?: string;
    priceMax?: string;
    brands?: string;
    sort?: string;
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
      // Mock: prioritize products with badges
      return sorted.sort((a, b) => {
        if (a.badge && !b.badge) return -1;
        if (!a.badge && b.badge) return 1;
        return 0;
      });
    default: // 'newest'
      return sorted;
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const sortBy = params.sort || 'newest';

  const filters: SearchFiltersType = {
    query,
    category: params.category as CategoryKey | undefined,
    priceMin: params.priceMin ? parseInt(params.priceMin, 10) : undefined,
    priceMax: params.priceMax ? parseInt(params.priceMax, 10) : undefined,
    brands: params.brands?.split(',').filter(Boolean),
  };

  const { products, total, categoryDistribution } = searchProducts(featuredProducts, filters);
  const sortedProducts = sortProducts(products, sortBy);
  const availableBrands = getAvailableBrands(featuredProducts);

  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 pt-4 text-xs text-neutral-500">
        <Link href="/" className="hover:text-neutral-900">
          Beranda
        </Link>
        {' / '}
        <span className="text-neutral-900">Pencarian{query ? ` &quot;${query}&quot;` : ''}</span>
      </div>

      {/* Sticky Search Input */}
      <Suspense fallback={<div className="h-[72px] bg-neutral-50" />}>
        <SearchInput initialValue={query} />
      </Suspense>

      {/* Banner - only show if there's a query */}
      {query && (
        <div className="mt-4">
          <SearchBanner
            query={query}
            resultCount={total}
            activeCategory={filters.category}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8">
        {query ? (
          total > 0 ? (
            <div className="flex flex-col lg:flex-row gap-8">
              <SearchFilters
                filters={filters}
                categoryDistribution={categoryDistribution}
                availableBrands={availableBrands}
                totalResults={total}
              />
              <SearchResults products={sortedProducts} total={total} sortBy={sortBy} />
            </div>
          ) : (
            <EmptySearch query={query} />
          )
        ) : (
          // No query yet - show search prompt
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
              Cari produk favorit Anda
            </h2>
            <p className="text-neutral-500 max-w-md">
              Ketik kata kunci di kolom pencarian untuk menemukan produk freediving, scuba, dan aksesoris.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
