import { NextRequest, NextResponse } from 'next/server';
import { searchProductsWithFacets, formatProductForStorefront } from '@/lib/queries/products';

/**
 * GET /api/search - Search products with filters
 *
 * Query parameters:
 * - q: Keyword search (searches product name and description)
 * - category: Category ID or slug
 * - brand: Brand ID or slug
 * - divingType: 'freediving' or 'scuba'
 * - newArrival: 'true' to filter new arrivals
 * - onSale: 'true' to filter on sale products
 * - minPrice: Minimum price in Rupiah (will be converted to cents)
 * - maxPrice: Maximum price in Rupiah (will be converted to cents)
 * - sort: 'newest' (default) | 'price-asc' | 'price-desc' | 'popular'
 * - page: Page number, 1-indexed (default 1)
 * - pageSize: Results per page (default 24)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse search parameters
    const query = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const divingType = searchParams.get('divingType') || undefined;
    const isNewArrival = searchParams.get('newArrival') === 'true' ? true : undefined;
    const isOnSale = searchParams.get('onSale') === 'true' ? true : undefined;
    const sort = searchParams.get('sort') || undefined;

    // Prices are provided in Rupiah (whole numbers), convert to cents
    const minPriceRupiah = searchParams.get('minPrice');
    const maxPriceRupiah = searchParams.get('maxPrice');
    const minPrice = minPriceRupiah ? parseInt(minPriceRupiah, 10) * 100 : undefined;
    const maxPrice = maxPriceRupiah ? parseInt(maxPriceRupiah, 10) * 100 : undefined;

    const page = searchParams.get('page') ? Math.max(1, parseInt(searchParams.get('page')!, 10)) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : 24;
    const offset = (page - 1) * pageSize;

    // Build filters
    const filters = {
      search: query,
      category,
      brand,
      divingType,
      isNewArrival,
      isOnSale,
      minPrice,
      maxPrice,
      sort,
      limit: pageSize,
      offset,
    };

    const { products, total, categories, brands, categoryDistribution, brandDistribution } =
      await searchProductsWithFacets(filters);

    const formattedProducts = products.map(formatProductForStorefront);

    return NextResponse.json({
      products: formattedProducts,
      total,
      categories,
      brands,
      categoryDistribution,
      brandDistribution,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      filters: {
        query,
        category,
        brand,
        minPrice: minPriceRupiah ? parseInt(minPriceRupiah, 10) : undefined,
        maxPrice: maxPriceRupiah ? parseInt(maxPriceRupiah, 10) : undefined,
      },
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
