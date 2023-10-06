import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import {
  searchProducts,
  getAvailableBrands,
  type SearchFilters as SearchFiltersType,
  type CategoryKey,
} from '@/lib/data/search-utils';
import { featuredProducts } from '@/lib/data/mock-products';

interface ProductListingProps {
  category?: CategoryKey;
  title: string;
  description: string;
  gradient: string;
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

export function ProductListing({ category, title, description, gradient }: ProductListingProps) {
  const sortBy = 'newest'; // Default sort, can be made dynamic with client component

  const filters: SearchFiltersType = {
    query: '',
    category,
  };

  const { products, total, categoryDistribution } = searchProducts(featuredProducts, filters);
  const sortedProducts = sortProducts(products, sortBy);
  const availableBrands = getAvailableBrands(featuredProducts);

  return (
    <>
      {/* Category Banner */}
      <section className={`bg-gradient-to-r ${gradient} text-white py-12 lg:py-16 px-4`}>
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-3xl lg:text-4xl font-semibold mb-2">{title}</h1>
          <p className="text-white/80 max-w-xl">{description}</p>
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
    </>
  );
}
