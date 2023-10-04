import type { MockProduct } from './mock-products';

export interface SearchFilters {
  query: string;
  category?: 'freediving' | 'scuba' | 'aksesoris' | 'sale';
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
}

export interface SearchResult {
  products: MockProduct[];
  total: number;
  categoryDistribution: {
    freediving: number;
    scuba: number;
    aksesoris: number;
    sale: number;
  };
}

// Mock category assignment based on product handle/title
function inferCategory(product: MockProduct): 'freediving' | 'scuba' | 'aksesoris' | 'sale' {
  if (product.badge === 'Sale') return 'sale';
  const title = product.title.toLowerCase();
  const handle = product.handle.toLowerCase();

  if (title.includes('fin') || title.includes('masker') || title.includes('snorkel') || title.includes('wetsuit')) {
    if (handle.includes('scuba') || title.includes('scuba')) return 'scuba';
    return 'freediving';
  }
  return 'aksesoris';
}

// Parse price string to number (e.g., "Rp 850.000" -> 850000)
function parsePrice(priceStr: string): number {
  return parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
}

export function searchProducts(
  allProducts: MockProduct[],
  filters: SearchFilters
): SearchResult {
  let filtered = [...allProducts];

  // Filter by search query (title and handle)
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.handle.toLowerCase().includes(query) ||
        p.vendor?.toLowerCase().includes(query)
    );
  }

  // Filter by category
  if (filters.category) {
    filtered = filtered.filter((p) => inferCategory(p) === filters.category);
  }

  // Filter by price range
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    filtered = filtered.filter((p) => {
      const price = parsePrice(p.price);
      if (filters.priceMin !== undefined && price < filters.priceMin) return false;
      if (filters.priceMax !== undefined && price > filters.priceMax) return false;
      return true;
    });
  }

  // Filter by brands
  if (filters.brands && filters.brands.length > 0) {
    filtered = filtered.filter(
      (p) => p.vendor && filters.brands!.includes(p.vendor)
    );
  }

  // Calculate category distribution from original filtered results (before category filter)
  const baseFiltered = filters.query
    ? allProducts.filter(
        (p) =>
          p.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          p.handle.toLowerCase().includes(filters.query.toLowerCase()) ||
          p.vendor?.toLowerCase().includes(filters.query.toLowerCase())
      )
    : allProducts;

  const categoryDistribution = {
    freediving: baseFiltered.filter((p) => inferCategory(p) === 'freediving').length,
    scuba: baseFiltered.filter((p) => inferCategory(p) === 'scuba').length,
    aksesoris: baseFiltered.filter((p) => inferCategory(p) === 'aksesoris').length,
    sale: baseFiltered.filter((p) => p.badge === 'Sale').length,
  };

  return {
    products: filtered,
    total: filtered.length,
    categoryDistribution,
  };
}

export function getAvailableBrands(products: MockProduct[]): string[] {
  const brands = new Set<string>();
  products.forEach((p) => {
    if (p.vendor) brands.add(p.vendor);
  });
  return Array.from(brands).sort();
}

export const CATEGORY_CONFIG = {
  freediving: {
    label: 'Freediving',
    gradient: 'from-cyan-900 to-cyan-700',
    description: 'Peralatan freediving berkualitas tinggi untuk petualangan bawah laut.',
  },
  scuba: {
    label: 'Scuba',
    gradient: 'from-blue-900 to-blue-700',
    description: 'Perlengkapan scuba diving profesional untuk eksplorasi laut dalam.',
  },
  aksesoris: {
    label: 'Aksesoris',
    gradient: 'from-slate-700 to-slate-500',
    description: 'Aksesoris dan perlengkapan pendukung diving.',
  },
  sale: {
    label: 'Sale',
    gradient: 'from-red-700 to-red-500',
    description: 'Diskon spesial untuk produk terpilih.',
  },
} as const;

export type CategoryKey = keyof typeof CATEGORY_CONFIG;
