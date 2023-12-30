'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Plus, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatedButton } from '@/components/ui/animated-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/admin/input';
import { categories } from '@/lib/constants/product-options';

// Types
type Brand = {
  id: string;
  name: string;
};

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
  divingTypes: string[];
  images: string[];
  isActive: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  variants: { id: string; name: string; priceCents: number | null; isActive: boolean }[];
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

// Get price display - shows range for products with variants
function getPriceDisplay(product: Product): { main: string; compare?: string } {
  const activeVariants = (product.variants || []).filter(v => v.isActive && v.priceCents);
  
  if (activeVariants.length === 0) {
    return {
      main: formatPrice(product.priceCents),
      compare: product.compareAtPriceCents ? formatPrice(product.compareAtPriceCents) : undefined,
    };
  }
  
  const prices = activeVariants.map(v => v.priceCents!);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  if (minPrice === maxPrice) {
    return { main: formatPrice(minPrice) };
  }
  
  return { main: `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}` };
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

// Fetch brands from API
async function fetchBrands(): Promise<{ brands: Brand[] }> {
  const response = await fetch('/api/brands');
  if (!response.ok) throw new Error('Failed to fetch brands');
  return response.json();
}

// Delete product mutation
async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete product');
}

export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    brand: '',
    status: '',
  });

  // Fetch brands for filter dropdown
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });
  const brands = brandsData?.brands ?? [];

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

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const clearFilters = () => {
    setFilters({ category: '', brand: '', status: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const products = data?.products ?? [];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Produk</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola katalog produk toko Anda</p>
        </div>
        <AnimatedButton onClick={() => router.push('/admin/products/new')} size="xs">
          <Plus className="w-4 h-4" />
          Tambah Produk
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
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 text-neutral-400 animate-spin" />
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
                  {product.isNewArrival && (
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-full">
                      New
                    </span>
                  )}
                  {product.isOnSale && (
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-red-100 text-red-700 rounded-full">
                      Sale
                    </span>
                  )}
                </div>
                <h3 className="text-base font-medium tracking-tight text-neutral-900 truncate">
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-neutral-700">
                    {getPriceDisplay(product).main}
                  </span>
                  {getPriceDisplay(product).compare && (
                    <span className="text-sm text-neutral-400 line-through">
                      {getPriceDisplay(product).compare}
                    </span>
                  )}
                </div>
              </div>

              {/* Availability & Actions */}
              <div className="hidden sm:flex items-center gap-1">
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

              {/* Mobile Arrow */}
              <Icon icon="solar:alt-arrow-right-linear" className="w-5 h-5 text-neutral-900 flex-shrink-0 sm:hidden" />
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <EmptyState
          icon="solar:box-linear"
          title="Belum ada produk"
          description="Mulai tambahkan produk ke katalog toko Anda"
          ctaLabel="Tambah Produk"
          onClick={() => router.push('/admin/products/new')}
          ctaIcon={<Plus className="w-4 h-4" />}
          size="xs"
        />
      )}
    </div>
  );
}
