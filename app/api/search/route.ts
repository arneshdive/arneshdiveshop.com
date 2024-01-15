import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, searchProductsCount } from '@/lib/queries/products';
import { db, categories, brands } from '@/lib/db';
import { desc } from 'drizzle-orm';

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
 * - limit: Number of results (default 50)
 * - offset: Pagination offset (default 0)
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
    
    // Prices are provided in Rupiah (whole numbers), convert to cents
    const minPriceRupiah = searchParams.get('minPrice');
    const maxPriceRupiah = searchParams.get('maxPrice');
    const minPrice = minPriceRupiah ? parseInt(minPriceRupiah, 10) * 100 : undefined;
    const maxPrice = maxPriceRupiah ? parseInt(maxPriceRupiah, 10) * 100 : undefined;
    
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;
    
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
      limit,
      offset,
    };
    
    // Execute search
    const [products, total, allCategories, allBrands] = await Promise.all([
      searchProducts(filters),
      searchProductsCount(filters),
      // Get all categories for filter UI
      db.query.categories.findMany({
        orderBy: [desc(categories.createdAt)],
      }),
      // Get all brands for filter UI
      db.query.brands.findMany({
        orderBy: [desc(brands.createdAt)],
      }),
    ]);
    
    // Calculate category distribution (count products per category for current search)
    const categoryDistribution: Record<string, number> = {};
    for (const cat of allCategories) {
      const count = await searchProductsCount({ ...filters, category: cat.id });
      if (count > 0) {
        categoryDistribution[cat.id] = count;
      }
    }
    
    // Calculate brand distribution
    const brandDistribution: Record<string, number> = {};
    for (const brandItem of allBrands) {
      const count = await searchProductsCount({ ...filters, brand: brandItem.id });
      if (count > 0) {
        brandDistribution[brandItem.id] = count;
      }
    }
    
    // Format products for storefront
    const formattedProducts = products.map(product => {
      const badge = product.isNewArrival 
        ? 'New Arrival' 
        : product.isOnSale 
          ? 'Sale' 
          : undefined;
      
      // Calculate price range from variants
      // Note: priceCents stores actual cents (100 cents = 1 Rupiah)
      const variantPrices = (product.variants || [])
        .filter((v: any) => v.isActive && v.priceCents !== null)
        .map((v: any) => v.priceCents);
      
      let priceDisplay: string;
      let priceRangeMin: number | undefined;
      let priceRangeMax: number | undefined;
      
      if (variantPrices.length > 0) {
        // Variants have their own prices - show only minimum price
        priceRangeMin = Math.min(...variantPrices);
        priceRangeMax = Math.max(...variantPrices);
        
        // Use base price as minimum if it's lower than variant prices
        const effectiveMin = product.priceCents ? Math.min(product.priceCents, priceRangeMin) : priceRangeMin;
        const effectiveMax = Math.max(priceRangeMin, product.priceCents || 0, priceRangeMax);
        
        priceRangeMin = effectiveMin;
        priceRangeMax = effectiveMax;
        
        priceDisplay = `Rp ${(effectiveMin / 100).toLocaleString('id-ID')}`;
      } else {
        // No variant prices - use base price
        priceDisplay = product.priceCents ? `Rp ${(product.priceCents / 100).toLocaleString('id-ID')}` : 'Rp 0';
      }
      
      return {
        id: product.id,
        handle: product.slug,
        title: product.name,
        vendor: product.brand?.name,
        price: priceDisplay,
        priceRangeMin,
        priceRangeMax,
        compareAtPrice: product.compareAtPriceCents 
          ? `Rp ${(product.compareAtPriceCents / 100).toLocaleString('id-ID')}` 
          : undefined,
        badge,
        image: product.images?.[0] || undefined,
        secondaryImage: product.images?.[1] || undefined,
        categoryId: product.categoryId,
        brandId: product.brandId,
        divingTypes: product.divingTypes,
        isNewArrival: product.isNewArrival,
        isOnSale: product.isOnSale,
        isActive: product.isActive,
        category: product.category,
        brand: product.brand,
      };
    });
    
    return NextResponse.json({
      products: formattedProducts,
      total,
      categories: allCategories,
      brands: allBrands,
      categoryDistribution,
      brandDistribution,
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
