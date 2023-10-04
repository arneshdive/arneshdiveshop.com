'use client';

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

interface FilterContentProps {
  filters: SearchFilters;
  categoryDistribution: Record<CategoryKey, number>;
  availableBrands: string[];
  updateFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterContent({
  filters,
  categoryDistribution,
  availableBrands,
  updateFilter,
  clearFilters,
  hasActiveFilters,
}: FilterContentProps) {
  const isCategoryActive = (key: CategoryKey) => filters.category === key;

  return (
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
                    checked={isCategoryActive(key)}
                    onChange={() => updateFilter('category', isCategoryActive(key) ? '' : key)}
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
              onClick={() => updateFilter('category', '')}
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
            onChange={(e) => updateFilter('priceMin', e.target.value || '')}
            className="w-24 px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax || ''}
            onChange={(e) => updateFilter('priceMax', e.target.value || '')}
            className="w-24 px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
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
                    updateFilter('brands', newBrands.length > 0 ? newBrands.join(',') : '');
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
}

export function SearchFilters({
  filters,
  categoryDistribution,
  availableBrands,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasActiveFilters = filters.category || filters.priceMin || filters.priceMax || filters.brands?.length;

  const updateFilter = (key: string, value: string) => {
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

  return (
    <>
      {/* Mobile Filter */}
      <div className="lg:hidden mb-4">
        <details className="border border-neutral-200 rounded-lg">
          <summary className="py-3 px-4 text-sm cursor-pointer flex items-center gap-2">
            <Icon icon="solar:filter-linear" className="w-4 h-4" />
            Filter
            {hasActiveFilters && (
              <span className="bg-neutral-900 text-white text-xs px-1.5 py-0.5 rounded-full">
                !
              </span>
            )}
          </summary>
          <div className="p-4 pt-0 border-t border-neutral-200 mt-3">
            <FilterContent
              filters={filters}
              categoryDistribution={categoryDistribution}
              availableBrands={availableBrands}
              updateFilter={updateFilter}
              clearFilters={clearFilters}
              hasActiveFilters={!!hasActiveFilters}
            />
          </div>
        </details>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-40">
          <FilterContent
            filters={filters}
            categoryDistribution={categoryDistribution}
            availableBrands={availableBrands}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            hasActiveFilters={!!hasActiveFilters}
          />
        </div>
      </aside>
    </>
  );
}
