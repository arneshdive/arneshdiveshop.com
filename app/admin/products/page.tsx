'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Select } from '@/components/admin/input';
import { categories, brands } from '@/lib/constants/product-options';

// Types
type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  categoryId: string;
  brandId: string | null;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
};

type FilterState = {
  category: string;
  brand: string;
  status: string;
};

// Format price from cents to Rupiah
function formatPrice(cents: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// Fetch products from API
async function fetchProducts(filters: FilterState): Promise<{ products: Product[] }> {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.brand) params.set('brand', filters.brand);
  if (filters.status) params.set('isActive', filters.status);

  const response = await fetch(`/api/products?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

// Delete product mutation
async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete product');
}

// Toggle product status mutation
async function toggleProduct(id: string, field: 'isActive' | 'isFeatured', value: boolean): Promise<void> {
  const response = await fetch(`/api/products/${id}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value }),
  });
  if (!response.ok) throw new Error('Failed to toggle product');
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    brand: '',
    status: '',
  });

  // Fetch products
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: 'isActive' | 'isFeatured'; value: boolean }) =>
      toggleProduct(id, field, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const clearFilters = () => {
    setFilters({ category: '', brand: '', status: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: string, currentValue: boolean) => {
    toggleMutation.mutate({ id, field: 'isActive', value: !currentValue });
  };

  const products = data?.products ?? [];

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
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
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
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            placeholder="Semua Status"
            inline
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
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

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Icon icon="solar:box-linear" className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500">Memuat produk...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-600">Gagal memuat produk. Silakan coba lagi.</p>
        </div>
      )}

      {/* Product List */}
      {!isLoading && !error && (
        <div className="space-y-2">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/admin/products/${product.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-xl hover:bg-neutral-50 transition-colors group"
            >
              {/* Product Image */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden">
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Icon icon="solar:gallery-minimalistic-linear" className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                    {product.category?.name ?? '-'}
                  </span>
                  {product.brand && (
                    <>
                      <span className="text-[10px] text-neutral-300">•</span>
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                        {product.brand.name}
                      </span>
                    </>
                  )}
                  {!product.isActive && (
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-neutral-200 text-neutral-600 rounded-full">
                      Nonaktif
                    </span>
                  )}
                </div>
                <h3 className="text-base font-medium tracking-tight text-neutral-900 truncate">
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-neutral-700">
                    {formatPrice(product.priceCents)}
                  </span>
                  {product.compareAtPriceCents && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formatPrice(product.compareAtPriceCents)}
                    </span>
                  )}
                </div>
              </div>

              {/* Availability & Actions */}
              <div className="hidden sm:flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-neutral-500 mb-0.5">Status</p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleActive(product.id, product.isActive);
                    }}
                    className={`text-sm px-2 py-0.5 rounded transition-colors ${
                      product.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    {product.isActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Navigate to edit page (handled by link)
                    }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-900 hover:bg-neutral-100 transition-colors"
                    aria-label="Edit produk"
                  >
                    <Icon icon="solar:pen-linear" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(product.id);
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
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
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
