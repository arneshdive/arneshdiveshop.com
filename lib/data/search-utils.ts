import type { MockProduct } from './mock-products';

export type CategoryKey = 'masker' | 'fin' | 'wetsuit' | 'sabuk-pemberat' | 'aksesoris' | 'freediving' | 'scuba' | 'sale' | 'search';

export interface SearchFilters {
  query: string;
  category?: CategoryKey;
  diveType?: 'freediving' | 'scuba' | 'both';
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
}

export interface SearchResult {
  products: MockProduct[];
  total: number;
  categoryDistribution: Record<CategoryKey, number>;
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
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  // Filter by dive type
  if (filters.diveType) {
    filtered = filtered.filter((p) => 
      p.diveType === filters.diveType || p.diveType === 'both'
    );
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

  const categoryDistribution: Record<CategoryKey, number> = {
    masker: baseFiltered.filter((p) => p.category === 'masker').length,
    fin: baseFiltered.filter((p) => p.category === 'fin').length,
    wetsuit: baseFiltered.filter((p) => p.category === 'wetsuit').length,
    'sabuk-pemberat': baseFiltered.filter((p) => p.category === 'sabuk-pemberat').length,
    aksesoris: baseFiltered.filter((p) => p.category === 'aksesoris').length,
    freediving: 0,
    scuba: 0,
    sale: 0,
    search: 0,
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

export const CATEGORY_CONFIG: Record<CategoryKey, { label: string; description: string; gradient: string }> = {
  masker: { label: 'Masker', description: 'Koleksi masker freediving dan scuba berkualitas tinggi untuk visibilitas optimal.', gradient: 'from-blue-600 to-blue-500' },
  fin: { label: 'Fin', description: 'Fin freediving dan scuba dengan berbagai pilihan material dan desain.', gradient: 'from-teal-600 to-teal-500' },
  wetsuit: { label: 'Wetsuit', description: 'Wetsuit dan rashguard untuk kenyamanan dan perlindungan saat menyelam.', gradient: 'from-indigo-600 to-indigo-500' },
  'sabuk-pemberat': { label: 'Sabuk Pemberat', description: 'Sabuk pemberat dan aksesoris pendukung untuk keseimbangan saat menyelam.', gradient: 'from-neutral-700 to-neutral-500' },
  aksesoris: { label: 'Aksesoris', description: 'Berbagai aksesoris freediving dan scuba untuk melengkapi peralatan Anda.', gradient: 'from-neutral-700 to-neutral-500' },
  freediving: { label: 'Freediving', description: 'Koleksi peralatan freediving lengkap untuk penyelaman tanpa tabung.', gradient: 'from-blue-700 to-cyan-500' },
  scuba: { label: 'Scuba', description: 'Peralatan scuba diving berkualitas untuk eksplorasi bawah laut.', gradient: 'from-teal-700 to-emerald-500' },
  sale: { label: 'Sale', description: 'Penawaran spesial peralatan diving dengan harga terbaik.', gradient: 'from-red-600 to-rose-500' },
  search: { label: 'Cari', description: 'Cari peralatan diving sesuai kebutuhan Anda.', gradient: 'from-neutral-700 to-neutral-500' },
};

export const DIVE_TYPE_CONFIG = {
  freediving: { label: 'Freediving' },
  scuba: { label: 'Scuba' },
  both: { label: 'Freediving & Scuba' },
} as const;
