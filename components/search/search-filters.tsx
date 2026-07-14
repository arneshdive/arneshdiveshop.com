'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface SearchFiltersProps {
  categories: Category[];
  brands: Brand[];
  categoryDistribution: Record<string, number>;
  brandDistribution: Record<string, number>;
  selectedCategory?: string;
  selectedBrand?: string;
  selectedDivingType?: string;
  minPrice?: string;
  maxPrice?: string;
  query?: string;
  totalResults: number;
}

interface FilterContentProps {
  categories: Category[];
  brands: Brand[];
  categoryDistribution: Record<string, number>;
  brandDistribution: Record<string, number>;
  selectedCategory?: string;
  selectedBrand?: string;
  selectedDivingType?: string;
  minPrice?: string;
  maxPrice?: string;
  updateFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterContent({
  categories,
  brands,
  categoryDistribution,
  brandDistribution,
  selectedCategory,
  selectedBrand,
  selectedDivingType,
  minPrice,
  maxPrice,
  updateFilter,
  clearFilters,
  hasActiveFilters,
}: FilterContentProps) {
  return (
    <div className="space-y-8">
      {/* Diving Type Filter */}
      <div>
        <h3 className="text-sm uppercase tracking-wider font-semibold mb-4 pb-3 border-b border-neutral-200">
          Tipe Diving
        </h3>
        <div className="space-y-3">
          <label
            className="flex items-center justify-between gap-3 text-base cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="divingType"
                checked={selectedDivingType === 'freediving'}
                onChange={() => updateFilter('divingType', selectedDivingType === 'freediving' ? '' : 'freediving')}
                className="accent-neutral-900 w-4 h-4"
              />
              <span className="text-neutral-600 group-hover:text-neutral-900">
                Freediving
              </span>
            </div>
          </label>
          <label
            className="flex items-center justify-between gap-3 text-base cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="divingType"
                checked={selectedDivingType === 'scuba'}
                onChange={() => updateFilter('divingType', selectedDivingType === 'scuba' ? '' : 'scuba')}
                className="accent-neutral-900 w-4 h-4"
              />
              <span className="text-neutral-600 group-hover:text-neutral-900">
                Scuba
              </span>
            </div>
          </label>
          {selectedDivingType && (
            <button
              onClick={() => updateFilter('divingType', '')}
              className="text-sm text-neutral-400 hover:text-neutral-600 underline"
            >
              Hapus filter tipe diving
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider font-semibold mb-4 pb-3 border-b border-neutral-200">
            Kategori
          </h3>
          <div className="space-y-3">
            {categories.map((category) => {
              const count = categoryDistribution[category.id] || 0;
              const isSelected = selectedCategory === category.id || selectedCategory === category.slug;
              if (count === 0) return null;
              return (
                <label
                  key={category.id}
                  className="flex items-center justify-between gap-3 text-base cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="category"
                      checked={isSelected}
                      onChange={() => updateFilter('category', isSelected ? '' : category.slug)}
                      className="accent-neutral-900 w-4 h-4"
                    />
                    <span className="text-neutral-600 group-hover:text-neutral-900">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-neutral-400 text-sm">{count}</span>
                </label>
              );
            })}
            {selectedCategory && (
              <button
                onClick={() => updateFilter('category', '')}
                className="text-sm text-neutral-400 hover:text-neutral-600 underline"
              >
                Hapus filter kategori
              </button>
            )}
          </div>
        </div>
      )}

      {/* Brand Filter */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider font-semibold mb-4 pb-3 border-b border-neutral-200">
            Merek
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {brands.map((brand) => {
              const count = brandDistribution[brand.id] || 0;
              const isSelected = selectedBrand === brand.id || selectedBrand === brand.slug;
              if (count === 0) return null;
              return (
                <label
                  key={brand.id}
                  className="flex items-center justify-between gap-3 text-base cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="brand"
                      checked={isSelected}
                      onChange={() => updateFilter('brand', isSelected ? '' : brand.slug)}
                      className="accent-neutral-900 w-4 h-4"
                    />
                    <span className="text-neutral-600 group-hover:text-neutral-900">
                      {brand.name}
                    </span>
                  </div>
                  <span className="text-neutral-400 text-sm">{count}</span>
                </label>
              );
            })}
            {selectedBrand && (
              <button
                onClick={() => updateFilter('brand', '')}
                className="text-sm text-neutral-400 hover:text-neutral-600 underline"
              >
                Hapus filter merek
              </button>
            )}
          </div>
        </div>
      )}

      {/* Price Filter */}
      <div>
        <h3 className="text-sm uppercase tracking-wider font-semibold mb-4 pb-3 border-b border-neutral-200">
          Harga
        </h3>
        <div className="flex gap-3 items-center text-base">
          <input
            type="number"
            placeholder="Min"
            value={minPrice || ''}
            onChange={(e) => updateFilter('minPrice', e.target.value || '')}
            className="w-28 px-3 py-2 border border-neutral-300 rounded text-base focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice || ''}
            onChange={(e) => updateFilter('maxPrice', e.target.value || '')}
            className="w-28 px-3 py-2 border border-neutral-300 rounded text-base focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-neutral-400 hover:text-neutral-600 underline"
        >
          Hapus Semua Filter
        </button>
      )}
    </div>
  );
}

export function SearchFilters({
  categories,
  brands,
  categoryDistribution,
  brandDistribution,
  selectedCategory,
  selectedBrand,
  selectedDivingType,
  minPrice,
  maxPrice,
  query,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const hasActiveFilters = selectedCategory || selectedBrand || selectedDivingType || minPrice || maxPrice;
  const activeFilterCount = [
    selectedCategory,
    selectedBrand,
    selectedDivingType,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/produk?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/produk?${params.toString()}`);
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-full py-3 px-4 text-base border border-neutral-200 rounded-lg flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 transition-colors"
        >
          <Icon icon="solar:filter-linear" className="w-5 h-5" />
          Filter
          {activeFilterCount > 0 && (
            <span className="bg-neutral-900 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-full max-w-xs bg-white z-50 transform transition-transform duration-300 ease-out lg:hidden shadow-2xl ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold">Filter</h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Icon icon="solar:close-circle-linear" className="w-6 h-6 text-neutral-500" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-140px)]">
          <FilterContent
            categories={categories}
            brands={brands}
            categoryDistribution={categoryDistribution}
            brandDistribution={brandDistribution}
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            selectedDivingType={selectedDivingType}
            minPrice={minPrice}
            maxPrice={maxPrice}
            updateFilter={(key, value) => {
              updateFilter(key, value);
            }}
            clearFilters={clearFilters}
            hasActiveFilters={!!hasActiveFilters}
          />
        </div>

        {/* Drawer Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 bg-white flex gap-3">
          {hasActiveFilters && (
            <button
              onClick={() => {
                clearFilters();
                setIsDrawerOpen(false);
              }}
              className="flex-1 py-3 px-4 border border-neutral-300 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Hapus Filter
            </button>
          )}
          <button
            onClick={() => setIsDrawerOpen(false)}
            className={`${hasActiveFilters ? 'flex-1' : 'w-full'} py-3 px-4 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors`}
          >
            Terapkan
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24">
          <FilterContent
            categories={categories}
            brands={brands}
            categoryDistribution={categoryDistribution}
            brandDistribution={brandDistribution}
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            selectedDivingType={selectedDivingType}
            minPrice={minPrice}
            maxPrice={maxPrice}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            hasActiveFilters={!!hasActiveFilters}
          />
        </div>
      </aside>
    </>
  );
}
