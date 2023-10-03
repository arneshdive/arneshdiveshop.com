# Search Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-featured search page with sticky search input, dynamic category banner, sidebar filters (category, price, brand), sort dropdown, and product results grid.

**Architecture:** Server-rendered search page using Next.js App Router. Client components for interactive filters and sticky search input. Mock data for development until backend search API is ready. Reuses existing `ProductCard` component for consistency.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS, Iconify icons, existing UI components

---

## File Structure

```
app/(store)/search/
  page.tsx                    - Main search page (server component)
  loading.tsx                 - Loading state for search results

components/search/
  search-input.tsx            - Sticky search input (client component)
  search-banner.tsx           - Dynamic category banner
  search-filters.tsx          - Sidebar filters (client component)
  search-results.tsx          - Results grid + sort dropdown
  empty-search.tsx            - Empty state component

lib/data/
  search-utils.ts             - Search/filter utility functions
```

---

### Task 1: Create Search Utils and Types

**Files:**
- Create: `lib/data/search-utils.ts`

- [ ] **Step 1: Create search utilities file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/data/search-utils.ts
git commit -m "feat(search): add search utilities and types"
```

---

### Task 2: Create Sticky Search Input Component

**Files:**
- Create: `components/search/search-input.tsx`

- [ ] **Step 1: Create the search input component**

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils/cn';

interface SearchInputProps {
  initialValue?: string;
  className?: string;
}

export function SearchInput({ initialValue = '', className }: SearchInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [isSticky, setIsSticky] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleScroll = () => {
      // Start sticking after scrolling past 100px (approx half of banner)
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Sync query with URL on initial load
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', query.trim());
      // Reset filters when submitting new search
      params.delete('category');
      params.delete('priceMin');
      params.delete('priceMax');
      params.delete('brands');
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 z-30',
        isSticky
          ? 'fixed top-[72px] left-0 right-0 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm'
          : 'bg-neutral-50',
        className
      )}
    >
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative">
          <Icon
            icon="solar:magnifer-linear"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-12 pr-10 py-3 text-lg border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Hapus pencarian"
            >
              <Icon icon="solar:close-circle-linear" className="w-5 h-5 text-neutral-400" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/search/search-input.tsx
git commit -m "feat(search): add sticky search input component"
```

---

### Task 3: Create Search Banner Component

**Files:**
- Create: `components/search/search-banner.tsx`

- [ ] **Step 1: Create the banner component**

```typescript
import { CATEGORY_CONFIG, type CategoryKey } from '@/lib/data/search-utils';
import { cn } from '@/lib/utils/cn';

interface SearchBannerProps {
  query: string;
  resultCount: number;
  activeCategory?: CategoryKey;
}

export function SearchBanner({ query, resultCount, activeCategory }: SearchBannerProps) {
  const config = activeCategory ? CATEGORY_CONFIG[activeCategory] : null;
  
  // Default neutral banner when no category filter
  const gradient = config?.gradient || 'from-neutral-700 to-neutral-500';
  const title = config ? `${config.label}: "${query}"` : `Hasil untuk "${query}"`;
  const description = config?.description || `Ditemukan ${resultCount} produk untuk pencarian Anda.`;

  return (
    <section
      className={cn(
        'bg-gradient-to-r text-white py-12 lg:py-16 px-4',
        gradient
      )}
    >
      <div className="max-w-[1440px] mx-auto">
        <h1 className="text-3xl lg:text-4xl font-semibold mb-2">{title}</h1>
        <p className="text-white/80 max-w-xl">{description}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/search/search-banner.tsx
git commit -m "feat(search): add dynamic category banner component"
```

---

### Task 4: Create Search Filters Component

**Files:**
- Create: `components/search/search-filters.tsx`

- [ ] **Step 1: Create the filters component**

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { CATEGORY_CONFIG, type CategoryKey, type SearchFilters } from '@/lib/data/search-utils';
import { cn } from '@/lib/utils/cn';

interface SearchFiltersProps {
  filters: SearchFilters;
  categoryDistribution: Record<CategoryKey, number>;
  availableBrands: string[];
  totalResults: number;
}

export function SearchFilters({
  filters,
  categoryDistribution,
  availableBrands,
  totalResults,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    router.push(`/search?${params.toString()}`);
  };

  const hasActiveFilters = filters.category || filters.priceMin || filters.priceMax || filters.brands?.length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="text-xs uppercase tracking-wider font-semibold mb-3 pb-2 border-b border-neutral-200">
          Kategori
        </h3>
        <div className="space-y-2">
          {(Object.keys(CATEGORY_CONFIG) as CategoryKey[]).map((key) => {
            const cat = CATEGORY_CONFIG[key];
            const count = categoryDistribution[key];
            if (count === 0) return null;
            return (
              <label
                key={key}
                className="flex items-center justify-between gap-2 text-sm cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === key}
                    onChange={() => updateFilter('category', filters.category === key ? null : key)}
                    className="accent-neutral-900"
                  />
                  <span className={cn(
                    'group-hover:text-neutral-900',
                    key === 'sale' ? 'text-red-500' : 'text-neutral-600'
                  )}>
                    {cat.label}
                  </span>
                </div>
                <span className="text-neutral-400 text-xs">{count}</span>
              </label>
            );
          })}
          {filters.category && (
            <button
              onClick={() => updateFilter('category', null)}
              className="text-xs text-neutral-400 hover:text-neutral-600 underline"
            >
              Hapus filter kategori
            </button>
          )}
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <h3 className="text-xs uppercase tracking-wider font-semibold mb-3 pb-2 border-b border-neutral-200">
          Harga
        </h3>
        <div className="flex gap-2 items-center text-sm">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin || ''}
            onChange={(e) => updateFilter('priceMin', e.target.value || null)}
            className="w-24 px-2 py-1.5 border border-neutral-300 rounded text-sm"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax || ''}
            onChange={(e) => updateFilter('priceMax', e.target.value || null)}
            className="w-24 px-2 py-1.5 border border-neutral-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Brand Filter */}
      {availableBrands.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider font-semibold mb-3 pb-2 border-b border-neutral-200">
            Merek
          </h3>
          <div className="space-y-2">
            {availableBrands.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer hover:text-neutral-900"
              >
                <input
                  type="checkbox"
                  checked={filters.brands?.includes(brand) || false}
                  onChange={(e) => {
                    const currentBrands = filters.brands || [];
                    const newBrands = e.target.checked
                      ? [...currentBrands, brand]
                      : currentBrands.filter((b) => b !== brand);
                    updateFilter('brands', newBrands.length > 0 ? newBrands.join(',') : null);
                  }}
                  className="accent-neutral-900"
                />
                {brand}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-xs text-neutral-400 hover:text-neutral-600 underline"
        >
          Hapus Semua Filter
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full border border-neutral-300 py-3 px-4 text-sm flex items-center justify-center gap-2 mb-4"
      >
        <Icon icon="solar:filter-linear" className="w-4 h-4" />
        Filter & Sort
        {hasActiveFilters && (
          <span className="bg-neutral-900 text-white text-xs px-1.5 py-0.5 rounded-full">
            !
          </span>
        )}
      </button>

      {/* Mobile Filter Panel */}
      {isOpen && (
        <div className="lg:hidden bg-white border border-neutral-200 rounded-lg p-4 mb-4">
          <FilterContent />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-40">
          <FilterContent />
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/search/search-filters.tsx
git commit -m "feat(search): add sidebar filters component"
```

---

### Task 5: Create Search Results Component

**Files:**
- Create: `components/search/search-results.tsx`

- [ ] **Step 1: Create the results component**

```typescript
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import type { MockProduct } from '@/lib/data/mock-products';

interface SearchResultsProps {
  products: MockProduct[];
  total: number;
  sortBy: string;
}

export function SearchResults({ products, total, sortBy }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex-1">
      {/* Header with count and sort */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-neutral-600">
          Menampilkan <span className="font-medium text-neutral-900">{total}</span> produk
        </p>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="border border-neutral-300 px-3 py-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          <option value="newest">Urutkan: Terbaru</option>
          <option value="price-asc">Harga: Rendah ke Tinggi</option>
          <option value="price-desc">Harga: Tinggi ke Rendah</option>
          <option value="popular">Paling Populer</option>
        </select>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg text-neutral-600 mb-2">Tidak ada produk ditemukan</p>
          <p className="text-sm text-neutral-400">
            Coba ubah filter atau kata kunci pencarian Anda.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/search/search-results.tsx
git commit -m "feat(search): add search results grid component"
```

---

### Task 6: Create Empty Search Component

**Files:**
- Create: `components/search/empty-search.tsx`

- [ ] **Step 1: Create the empty state component**

```typescript
import Link from 'next/link';
import { Icon } from '@iconify/react';

interface EmptySearchProps {
  query: string;
}

export function EmptySearch({ query }: EmptySearchProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
      <Icon icon="solar:magnifer-zoom-in-linear" className="w-16 h-16 text-neutral-300 mb-4" />
      <h2 className="text-xl font-semibold text-neutral-900 mb-2">
        Tidak ada hasil untuk "{query}"
      </h2>
      <p className="text-neutral-500 mb-8 max-w-md">
        Coba kata kunci lain atau jelajahi kategori kami untuk menemukan produk yang Anda cari.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/freediving"
          className="px-6 py-3 bg-cyan-700 text-white text-sm font-medium rounded hover:bg-cyan-800 transition-colors"
        >
          Freediving
        </Link>
        <Link
          href="/scuba"
          className="px-6 py-3 bg-blue-800 text-white text-sm font-medium rounded hover:bg-blue-900 transition-colors"
        >
          Scuba
        </Link>
        <Link
          href="/aksesoris"
          className="px-6 py-3 bg-neutral-700 text-white text-sm font-medium rounded hover:bg-neutral-800 transition-colors"
        >
          Aksesoris
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/search/empty-search.tsx
git commit -m "feat(search): add empty search state component"
```

---

### Task 7: Create Main Search Page

**Files:**
- Create: `app/(store)/search/page.tsx`

- [ ] **Step 1: Create the search page**

```typescript
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
        <span className="text-neutral-900">Pencarian{query ? ` "${query}"` : ''}</span>
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
```

- [ ] **Step 2: Commit**

```bash
git add app/\(store\)/search/page.tsx
git commit -m "feat(search): add main search page"
```

---

### Task 8: Create Loading State

**Files:**
- Create: `app/(store)/search/loading.tsx`

- [ ] **Step 1: Create the loading state**

```typescript
export default function SearchLoading() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8">
      {/* Search input skeleton */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
      </div>

      {/* Banner skeleton */}
      <div className="h-32 bg-neutral-100 rounded-lg animate-pulse mb-8" />

      {/* Content skeleton */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter skeleton */}
        <div className="hidden lg:block w-64 space-y-6">
          <div className="h-40 bg-neutral-100 rounded animate-pulse" />
          <div className="h-32 bg-neutral-100 rounded animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(store\)/search/loading.tsx
git commit -m "feat(search): add loading state"
```

---

### Task 9: Verify Build and Test

- [ ] **Step 1: Run TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: No errors

- [ ] **Step 2: Run lint check**

```bash
pnpm lint
```

Expected: No errors

- [ ] **Step 3: Run dev server and test manually**

```bash
pnpm dev
```

Test cases:
1. Navigate to `/search` - should show search prompt
2. Search for "masker" - should show results with banner
3. Apply category filter - banner should change color
4. Use price filter - results should filter
5. Test sort dropdown - products should reorder
6. Scroll page - search input should stick below header
7. Test on mobile viewport - filter toggle should work

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(search): complete search page implementation"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Sticky search input below header ✅ Task 2
- [x] Category banner (neutral default, color when filtered) ✅ Task 3
- [x] Sidebar filters (Category, Price, Brand) ✅ Task 4
- [x] Sort dropdown (newest, price asc/desc, popular) ✅ Task 5
- [x] Results grid with ProductCard ✅ Task 5
- [x] Empty state with category links ✅ Task 6
- [x] Mobile filter toggle ✅ Task 4
- [x] Loading state ✅ Task 8

**No placeholders:** All code is complete with no TBD/TODO.

**Type consistency:** All interfaces use `MockProduct`, `CategoryKey`, and `SearchFilters` from `search-utils.ts`.
