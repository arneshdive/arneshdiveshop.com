'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/product/product-card';
import { Pagination } from '@/components/ui/pagination';

interface Product {
  id: string;
  handle: string;
  title: string;
  vendor?: string;
  price: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  compareAtPrice?: string;
  badges?: string[];
  image?: string;
  secondaryImage?: string;
  variantId?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
}

interface SearchResultsProps {
  products: Product[];
  total: number;
  sortBy: string;
  page?: number;
  pageSize?: number;
}

export function SearchResults({ products, total, sortBy, page, pageSize }: SearchResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = pageSize ? Math.ceil(total / pageSize) : 1;

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex-1">
      {/* Header with count and sort */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <p className="text-sm sm:text-base text-neutral-600">
          Menampilkan <span className="font-medium text-neutral-900">{total}</span> produk
        </p>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="border border-neutral-300 px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base rounded focus:outline-none focus:ring-1 focus:ring-neutral-900 w-full sm:w-auto"
        >
          <option value="newest">Terbaru</option>
          <option value="price-asc">Harga: Rendah ke Tinggi</option>
          <option value="price-desc">Harga: Tinggi ke Rendah</option>
          <option value="popular">Paling Populer</option>
        </select>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {pageSize && (
            <Pagination
              currentPage={page || 1}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
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
