'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Plus, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AnimatedButton } from '@/components/ui/animated-button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductFilters, type ProductFilterState } from '@/components/admin/product-filters';
import { ProductBadge } from '@/components/ui/product-badge';
import { formatRupiah } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

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
  
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilterState>({
    category: '',
    brand: '',
    divingType: '',
    status: 'active',
    isNewArrival: false,
    isOnSale: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });

  const products = data?.products ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus produk');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produk berhasil dihapus');
      setDeleteConfirm(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };
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
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <ProductFilters filters={filters} onChange={setFilters} />
          </div>
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
            <div className="space-y-2 pb-8">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => router.push(`/admin/products/${product.id}`)}
                  className={cn(
                    "flex items-center gap-4 p-4 bg-white rounded-xl hover:bg-neutral-50 transition-colors group cursor-pointer",
                    !product.isActive && "opacity-50"
                  )}
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
                        <ProductBadge type="inactive" context="card">Nonaktif</ProductBadge>
                      )}
                      {product.isNewArrival && (
                        <ProductBadge type="new" context="card">Baru</ProductBadge>
                      )}
                      {product.isOnSale && (
                        <ProductBadge type="sale" context="card">Sale</ProductBadge>
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

                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(product.id); }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                    aria-label="Hapus produk"
                  >
                    <Icon icon="solar:trash-bin-minimalistic-linear" className="w-4 h-4" />
                  </button>

                  <div className="hidden sm:flex items-center">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 group-hover:text-neutral-900 group-hover:bg-neutral-100 transition-colors">
                      <Icon icon="solar:pen-linear" className="w-4 h-4" />
                    </div>
                  </div>

                  <Icon icon="solar:alt-arrow-right-linear" className="w-5 h-5 text-neutral-900 flex-shrink-0 sm:hidden" />
                </div>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:trash-bin-minimalistic-linear" className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Hapus Produk?</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Produk akan dinonaktifkan dan disembunyikan dari toko. Data order yang sudah ada tetap aman.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleteMutation.isPending}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
