'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Plus } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Select } from '@/components/admin/input';
import { categories, brands, diveTypes } from '@/lib/constants/product-options';
import { featuredProducts as products } from '@/lib/data/mock-products';

// Filter state type
type FilterState = {
  category: string;
  brand: string;
  diveType: string;
  status: string;
  stock: string;
};

function getLabelById(items: { id: string; name: string }[], id: string | undefined): string {
  if (!id) return '-';
  return items.find(item => item.id === id)?.name || id;
}

export default function ProductsPage() {
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    brand: '',
    diveType: '',
    status: '',
    stock: '',
  });

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const clearFilters = () => {
    setFilters({ category: '', brand: '', diveType: '', status: '', stock: '' });
  };

  return (
    <div className="max-w-7xl">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Produk</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola katalog produk toko Anda</p>
        </div>
        <AnimatedButton asChild className="px-6 py-3">
          <Link href="/admin/products/new" className="flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Tambah Produk</span>
          </Link>
        </AnimatedButton>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            options={categories}
            placeholder="Semua Kategori"
            inline
          />

          <Select
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
            options={brands}
            placeholder="Semua Merek"
            inline
          />

          <Select
            value={filters.diveType}
            onChange={(e) => setFilters({ ...filters, diveType: e.target.value })}
            options={diveTypes}
            placeholder="Semua Tipe"
            inline
          />

          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            placeholder="Semua Status"
            inline
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </Select>

          <Select
            value={filters.stock}
            onChange={(e) => setFilters({ ...filters, stock: e.target.value })}
            placeholder="Semua Stok"
            inline
          >
            <option value="">Semua Stok</option>
            <option value="in_stock">Tersedia</option>
            <option value="out_of_stock">Habis</option>
          </Select>
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors whitespace-nowrap"
          >
            Reset
          </button>
        )}
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/${product.id}`}
            className="flex items-center gap-4 p-4 bg-white rounded-xl hover:bg-neutral-50 transition-colors group"
          >
            {/* Product Image */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-neutral-100 flex-shrink-0 flex items-center justify-center text-neutral-900">
              <Icon icon="solar:gallery-minimalistic-linear" className="w-6 h-6" />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                  {getLabelById(categories, product.category)}
                </span>
                <span className="text-[10px] text-neutral-300">•</span>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                  {getLabelById(brands, product.brand)}
                </span>
                <span className="text-[10px] text-neutral-300">•</span>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                  {getLabelById(diveTypes, product.diveType)}
                </span>
                {!product.isActive && (
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-neutral-200 text-neutral-600 rounded-full">
                    Nonaktif
                  </span>
                )}
              </div>
              <h3 className="text-base font-medium tracking-tight text-neutral-900 truncate">
                {product.title}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm text-neutral-700">
                  {product.price}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm text-neutral-400 line-through">
                    {product.compareAtPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Availability & Actions */}
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-neutral-500 mb-0.5">Ketersediaan</p>
                <p className={`text-sm ${
                  product.stockStatus === 'in_stock' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {product.stockStatus === 'in_stock' ? 'Tersedia' : 'Habis'}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle edit
                  }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-900 hover:bg-neutral-100 transition-colors"
                  aria-label="Edit produk"
                >
                  <Icon icon="solar:pen-linear" className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle delete
                  }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-900 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Hapus produk"
                >
                  <Icon icon="solar:trash-bin-minimalistic-linear" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Arrow */}
            <Icon icon="solar:alt-arrow-right-linear" className="w-5 h-5 text-neutral-900 flex-shrink-0 sm:hidden" />
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Icon icon="solar:box-linear" className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium tracking-tight mb-1">Belum ada produk</p>
          <p className="text-sm text-neutral-500 mb-6">
            Mulai tambahkan produk ke katalog toko Anda
          </p>
          <AnimatedButton asChild className="px-6 py-3">
            <Link href="/admin/products/new" className="flex items-center gap-2 whitespace-nowrap">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide">Tambah Produk</span>
            </Link>
          </AnimatedButton>
        </div>
      )}
    </div>
  );
}
