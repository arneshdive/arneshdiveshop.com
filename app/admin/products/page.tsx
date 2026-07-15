'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Plus, Loader } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AnimatedButton } from '@/components/ui/animated-button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductFilters, type ProductFilterState } from '@/components/admin/product-filters';
import { formatRupiah } from '@/lib/utils/format';

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

function getPriceDisplay(product: Product): { main: string; compare?: string } {
  const activeVariants = (product.variants || []).filter(v => v.isActive && v.priceCents);

  if (activeVariants.length === 0) {
    const hasDiscount = !!product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents;
    return {
      main: formatRupiah(product.priceCents),
      compare: hasDiscount ? formatRupiah(product.compareAtPriceCents!) : undefined,
    };
  }
  
  const prices = activeVariants.map(v => v.priceCents!);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  if (minPrice === maxPrice) {
    return { main: formatRupiah(minPrice) };
  }
  
  return { main: `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}` };
}

async function fetchProducts(filters: ProductFilterState): Promise<{ products: Product[] }> {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.brand) params.set('brand', filters.brand);
  if (filters.divingType) params.set('divingType', filters.divingType);
  if (filters.status) params.set('isActive', filters.status === 'active' ? 'true' : 'false');
  if (filters.isNewArrival) params.set('isNewArrival', 'true');
  if (filters.isOnSale) params.set('isOnSale', 'true');

  const response = await fetch(`/api/products?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export default function ProductsPage() {
  const router = useRouter();
  
  const [filters, setFilters] = useState<ProductFilterState>({
    category: '',
    brand: '',
    divingType: '',
    status: '',
    isNewArrival: false,
    isOnSale: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });

  const products = data?.products ?? [];
  const activeFilterCount = [
    filters.category,
    filters.brand,
    filters.divingType,
    filters.status,
    filters.isNewArrival,
    filters.isOnSale,
  ].filter((v) => v && v !== '').length;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Produk</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {products.length > 0 ? `${products.length} produk` : 'Kelola katalog produk toko Anda'}
          </p>
        </div>
        <AnimatedButton onClick={() => router.push('/admin/products/new')} size="xs">
          <Plus className="w-4 h-4" />
          Tambah Produk
        </AnimatedButton>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden mb-6">
        <ProductFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Content: Filters + List */}
      <div className="flex gap-6">
        {/* Desktop Filters */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <ProductFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
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
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden">
                    {product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <Icon icon="solar:gallery-minimalistic-linear" className="w-6 h-6" />
                      </div>
                    )}
                  </div>

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

                  <div className="hidden sm:flex items-center">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 group-hover:text-neutral-900 group-hover:bg-neutral-100 transition-colors">
                      <Icon icon="solar:pen-linear" className="w-4 h-4" />
                    </div>
                  </div>

                  <Icon icon="solar:alt-arrow-right-linear" className="w-5 h-5 text-neutral-900 flex-shrink-0 sm:hidden" />
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && products.length === 0 && (
            <EmptyState
              icon="solar:box-linear"
              title={activeFilterCount > 0 ? "Tidak ada produk yang cocok" : "Belum ada produk"}
              description={activeFilterCount > 0 ? "Coba ubah filter pencarian" : "Mulai tambahkan produk ke katalog toko Anda"}
              ctaLabel={activeFilterCount > 0 ? undefined : "Tambah Produk"}
              onClick={activeFilterCount > 0 ? undefined : () => router.push('/admin/products/new')}
              ctaIcon={activeFilterCount > 0 ? undefined : <Plus className="w-4 h-4" />}
              size="xs"
            />
          )}
        </div>
      </div>
    </div>
  );
}
