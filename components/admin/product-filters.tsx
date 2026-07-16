'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { DIVING_TYPE_OPTIONS } from '@/lib/constants/diving-types';

export interface ProductFilterState {
  category: string;
  brand: string;
  divingType: string;
  status: string;
  isNewArrival: boolean;
  isOnSale: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

const STATUS_OPTIONS = [
  { id: 'active', name: 'Aktif' },
  { id: 'inactive', name: 'Nonaktif' },
];

interface ProductFiltersProps {
  filters: ProductFilterState;
  onChange: (filters: ProductFilterState) => void;
}

async function fetchAllCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories?all=true');
  if (!response.ok) throw new Error('Failed to fetch categories');
  const data = await response.json();
  return data.categories;
}

async function fetchAllBrands(): Promise<Brand[]> {
  const response = await fetch('/api/brands?all=true');
  if (!response.ok) throw new Error('Failed to fetch brands');
  const data = await response.json();
  return data.brands;
}

export function ProductFilters({ filters, onChange }: ProductFiltersProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-all'],
    queryFn: fetchAllCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands-all'],
    queryFn: fetchAllBrands,
    staleTime: 5 * 60 * 1000,
  });

  const activeFilterCount = [
    filters.category,
    filters.brand,
    filters.divingType,
    filters.status,
    filters.isNewArrival,
    filters.isOnSale,
  ].filter((v) => v && v !== '').length;

  const handleChange = (key: keyof ProductFilterState, value: string | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  const handleClearAll = () => {
    onChange({ category: '', brand: '', divingType: '', status: '', isNewArrival: false, isOnSale: false });
  };

  return (
    <>
      {/* Mobile: Filter Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="lg:hidden w-full py-2.5 px-4 text-sm border border-neutral-200 rounded-lg flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 transition-colors"
      >
        <Icon icon="solar:filter-linear" className="w-4 h-4" />
        Filter
        {activeFilterCount > 0 && (
          <span className="bg-neutral-900 text-white text-xs px-1.5 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile: Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="lg:hidden flex flex-wrap gap-2 mt-3">
          {filters.status && <FilterPill label={STATUS_OPTIONS.find(o => o.id === filters.status)?.name!} onRemove={() => handleChange('status', '')} />}
          {filters.category && <FilterPill label={categories.find(c => c.id === filters.category)?.name!} onRemove={() => handleChange('category', '')} />}
          {filters.brand && <FilterPill label={brands.find(b => b.id === filters.brand)?.name!} onRemove={() => handleChange('brand', '')} />}
          {filters.divingType && <FilterPill label={DIVING_TYPE_OPTIONS.find(o => o.id === filters.divingType)?.name!} onRemove={() => handleChange('divingType', '')} />}
          {filters.isNewArrival && <FilterPill label="Produk Baru" onRemove={() => handleChange('isNewArrival', false)} />}
          {filters.isOnSale && <FilterPill label="Sedang Sale" onRemove={() => handleChange('isOnSale', false)} />}
        </div>
      )}

      {/* Mobile: Drawer */}
      {isDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setIsDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white z-50 shadow-2xl lg:hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold">Filter Produk</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <Icon icon="solar:close-circle-linear" className="w-6 h-6 text-neutral-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterSections filters={filters} onChange={handleChange} categories={categories} brands={brands} />
            </div>
            <div className="p-4 border-t border-neutral-200 bg-white flex gap-3">
              {activeFilterCount > 0 && (
                <button onClick={() => { handleClearAll(); setIsDrawerOpen(false); }} className="flex-1 py-3 px-4 border border-neutral-300 rounded-lg text-neutral-600 hover:bg-neutral-50">
                  Hapus Filter
                </button>
              )}
              <button onClick={() => setIsDrawerOpen(false)} className={`${activeFilterCount > 0 ? 'flex-1' : 'w-full'} py-3 px-4 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800`}>
                Terapkan
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop: Sidebar Content Only */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-neutral-900 uppercase tracking-wider">Filter</h3>
            {activeFilterCount > 0 && (
              <button onClick={handleClearAll} className="text-xs text-neutral-500 hover:text-neutral-700 underline">
                Reset
              </button>
            )}
          </div>
          <FilterSections filters={filters} onChange={handleChange} categories={categories} brands={brands} />
        </div>
      </div>
    </>
  );
}

function FilterSections({
  filters,
  onChange,
  categories,
  brands,
}: {
  filters: ProductFilterState;
  onChange: (key: keyof ProductFilterState, value: string | boolean) => void;
  categories: Category[];
  brands: Brand[];
}) {
  return (
    <div className="space-y-5">
      <FilterGroup label="Status" value={filters.status} onChange={(v) => onChange('status', v)} options={STATUS_OPTIONS} />
      
      {/* Special Flags */}
      <div>
        <h4 className="text-xs font-medium text-neutral-900 tracking-tight mb-3">Label Khusus</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 text-sm cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.isNewArrival}
              onChange={() => onChange('isNewArrival', !filters.isNewArrival)}
              className="accent-neutral-900 w-4 h-4 rounded"
            />
            <span className="text-neutral-600 group-hover:text-neutral-900">Produk Baru</span>
          </label>
          <label className="flex items-center gap-3 text-sm cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.isOnSale}
              onChange={() => onChange('isOnSale', !filters.isOnSale)}
              className="accent-neutral-900 w-4 h-4 rounded"
            />
            <span className="text-neutral-600 group-hover:text-neutral-900">Sedang Sale</span>
          </label>
        </div>
      </div>
      
      <FilterGroup label="Tipe Diving" value={filters.divingType} onChange={(v) => onChange('divingType', v)} options={DIVING_TYPE_OPTIONS} />
      {categories.length > 0 && (
        <CollapsibleFilterGroup label="Kategori" value={filters.category} onChange={(v) => onChange('category', v)} options={categories.map(c => ({ id: c.id, name: c.name }))} defaultOpen={false} />
      )}
      {brands.length > 0 && (
        <CollapsibleFilterGroup label="Merek" value={filters.brand} onChange={(v) => onChange('brand', v)} options={brands.map(b => ({ id: b.id, name: b.name }))} defaultOpen={false} />
      )}
    </div>
  );
}

function FilterGroup({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { id: string; name: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-neutral-900 tracking-tight mb-3">{label}</h4>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-3 text-sm cursor-pointer group">
            <input type="radio" name={label} checked={value === opt.id} onChange={() => onChange(value === opt.id ? '' : opt.id)} className="accent-neutral-900 w-4 h-4" />
            <span className="text-neutral-600 group-hover:text-neutral-900">{opt.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function CollapsibleFilterGroup({ label, value, onChange, options, defaultOpen = true }: { label: string; value: string; onChange: (v: string) => void; options: { id: string; name: string }[]; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasSelection = !!value;
  
  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-1"
      >
        <span className="text-xs font-medium text-neutral-900 tracking-tight">{label}</span>
        <div className="flex items-center gap-2">
          {hasSelection && <span className="w-2 h-2 rounded-full bg-neutral-900" />}
          <Icon icon={isOpen ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} className="w-4 h-4 text-neutral-400" />
        </div>
      </button>
      {isOpen && (
        <div className="space-y-2 mt-3">
          {options.map((opt) => (
            <label key={opt.id} className="flex items-center gap-3 text-sm cursor-pointer group">
              <input type="radio" name={label} checked={value === opt.id} onChange={() => onChange(value === opt.id ? '' : opt.id)} className="accent-neutral-900 w-4 h-4" />
              <span className="text-neutral-600 group-hover:text-neutral-900">{opt.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-neutral-900">
        <Icon icon="solar:close-circle-linear" className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}
