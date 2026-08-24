import { cache } from 'react';
import { db, products, productVariants, categories, brands } from '@/lib/db';
import { eq, isNull, desc, ilike, and, SQL, sql, or, gte, lte, between } from 'drizzle-orm';
import { computeProductPriceDisplay } from '@/lib/utils/product-pricing';

export interface ProductFilters {
  category?: string;        // Category ID or slug
  brand?: string;           // Brand ID or slug
  divingType?: string;      // 'freediving' or 'scuba'
  isActive?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  isFeatured?: boolean;
  search?: string;          // Keyword search (name and description)
  minPrice?: number;        // Price in cents
  maxPrice?: number;        // Price in cents
  sort?: string;            // 'newest' (default) | 'price-asc' | 'price-desc' | 'popular'
  limit?: number;
  offset?: number;
}

/**
 * Resolve category filter to ID (handles both ID and slug)
 */
async function resolveCategoryId(categoryFilter: string): Promise<string | null> {
  // Check if it's a valid UUID format (ID)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryFilter);
  
  if (isUuid) {
    return categoryFilter;
  }
  
  // Otherwise, look up by slug
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, categoryFilter),
  });
  
  return category?.id || null;
}

/**
 * Resolve brand filter to ID (handles both ID and slug)
 */
async function resolveBrandId(brandFilter: string): Promise<string | null> {
  // Check if it's a valid UUID format (ID)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandFilter);
  
  if (isUuid) {
    return brandFilter;
  }
  
  // Otherwise, look up by slug
  const brand = await db.query.brands.findFirst({
    where: eq(brands.slug, brandFilter),
  });
  
  return brand?.id || null;
}

/**
 * Search products with filters (excluding soft-deleted)
 * For storefront: only returns active products by default
 */
export async function searchProducts(filters?: ProductFilters) {
  const conditions: SQL[] = [isNull(products.deletedAt)];
  
  // For storefront, default to active products only
  if (filters?.isActive === undefined) {
    conditions.push(eq(products.isActive, true));
  } else if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  
  // Keyword search - search in both name and description (case-insensitive)
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(products.name, searchTerm),
        ilike(products.description, searchTerm)
      )!
    );
  }
  
  // Category filter (supports both ID and slug)
  if (filters?.category) {
    const categoryId = await resolveCategoryId(filters.category);
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
  }
  
  // Brand filter (supports both ID and slug)
  if (filters?.brand) {
    const brandId = await resolveBrandId(filters.brand);
    if (brandId) {
      conditions.push(eq(products.brandId, brandId));
    }
  }
  
  // Featured filter
  if (filters?.isFeatured !== undefined) {
    conditions.push(eq(products.isFeatured, filters.isFeatured));
  }
  
  // Diving type filter (array contains)
  if (filters?.divingType) {
    conditions.push(sql`${products.divingTypes} @> ARRAY[${filters.divingType}]::diving_type[]`);
  }
  
  // New arrival filter
  if (filters?.isNewArrival !== undefined) {
    conditions.push(eq(products.isNewArrival, filters.isNewArrival));
  }
  
  // On sale filter
  if (filters?.isOnSale !== undefined) {
    conditions.push(eq(products.isOnSale, filters.isOnSale));
  }
  
  // Price range filters
  if (filters?.minPrice !== undefined && filters?.maxPrice !== undefined) {
    conditions.push(between(products.priceCents, filters.minPrice, filters.maxPrice));
  } else if (filters?.minPrice !== undefined) {
    conditions.push(gte(products.priceCents, filters.minPrice));
  } else if (filters?.maxPrice !== undefined) {
    conditions.push(lte(products.priceCents, filters.maxPrice));
  }
  
  // Build query with pagination
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const results = await db.query.products.findMany({
    where: and(...conditions),
    with: {
      category: true,
      brand: true,
      variants: true,
    },
    orderBy: getProductOrderBy(filters?.sort),
    limit,
    offset,
  });

  return results;
}

/**
 * Resolve a storefront sort key to a DB order-by clause. Sorting must
 * happen here (not client-side on an already-paginated page) so that
 * page 2+ reflects the true global order instead of just re-sorting
 * whatever 24 rows happened to land on that page.
 */
function getProductOrderBy(sort?: string) {
  switch (sort) {
    case 'price-asc':
      return [sql`${products.priceCents} ASC`];
    case 'price-desc':
      return [sql`${products.priceCents} DESC`];
    case 'popular':
      return [
        sql`(CASE WHEN ${products.isNewArrival} OR ${products.isOnSale} THEN 1 ELSE 0 END) DESC`,
        desc(products.createdAt),
      ];
    default:
      return [desc(products.createdAt)];
  }
}

/**
 * Get count of products matching filters
 */
export async function searchProductsCount(filters?: ProductFilters): Promise<number> {
  const conditions: SQL[] = [isNull(products.deletedAt)];
  
  // For storefront, default to active products only
  if (filters?.isActive === undefined) {
    conditions.push(eq(products.isActive, true));
  } else if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  
  // Keyword search
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(products.name, searchTerm),
        ilike(products.description, searchTerm)
      )!
    );
  }
  
  // Category filter
  if (filters?.category) {
    const categoryId = await resolveCategoryId(filters.category);
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
  }
  
  // Brand filter
  if (filters?.brand) {
    const brandId = await resolveBrandId(filters.brand);
    if (brandId) {
      conditions.push(eq(products.brandId, brandId));
    }
  }
  
  // Featured filter
  if (filters?.isFeatured !== undefined) {
    conditions.push(eq(products.isFeatured, filters.isFeatured));
  }
  
  // Diving type filter (array contains)
  if (filters?.divingType) {
    conditions.push(sql`${products.divingTypes} @> ARRAY[${filters.divingType}]::diving_type[]`);
  }
  
  // New arrival filter
  if (filters?.isNewArrival !== undefined) {
    conditions.push(eq(products.isNewArrival, filters.isNewArrival));
  }
  
  // On sale filter
  if (filters?.isOnSale !== undefined) {
    conditions.push(eq(products.isOnSale, filters.isOnSale));
  }
  
  // Price range filters
  if (filters?.minPrice !== undefined && filters?.maxPrice !== undefined) {
    conditions.push(between(products.priceCents, filters.minPrice, filters.maxPrice));
  } else if (filters?.minPrice !== undefined) {
    conditions.push(gte(products.priceCents, filters.minPrice));
  } else if (filters?.maxPrice !== undefined) {
    conditions.push(lte(products.priceCents, filters.maxPrice));
  }
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(...conditions));

  return Number(result[0]?.count || 0);
}

/**
 * Search products plus everything the storefront PLP/search UI needs
 * around them: total count, the full category/brand lists (for filter
 * facets), and per-category/per-brand result counts for the current
 * filters. Shared by /api/search and the /produk page so both stay
 * in sync instead of maintaining two copies of this fan-out.
 */
export async function searchProductsWithFacets(filters?: ProductFilters) {
  const [productResults, total, allCategories, allBrands] = await Promise.all([
    searchProducts(filters),
    searchProductsCount(filters),
    db.query.categories.findMany({
      orderBy: [desc(categories.createdAt)],
    }),
    db.query.brands.findMany({
      orderBy: [desc(brands.createdAt)],
    }),
  ]);

  const categoryDistribution: Record<string, number> = {};
  for (const cat of allCategories) {
    const count = await searchProductsCount({ ...filters, category: cat.id });
    if (count > 0) {
      categoryDistribution[cat.id] = count;
    }
  }

  const brandDistribution: Record<string, number> = {};
  for (const brandItem of allBrands) {
    const count = await searchProductsCount({ ...filters, brand: brandItem.id });
    if (count > 0) {
      brandDistribution[brandItem.id] = count;
    }
  }

  return {
    products: productResults,
    total,
    categories: allCategories,
    brands: allBrands,
    categoryDistribution,
    brandDistribution,
  };
}

/**
 * Shape a DB product (as returned by searchProducts/searchProductsWithFacets)
 * into the flat, display-ready format the storefront PLP/search UI expects.
 */
export function formatProductForStorefront(product: Awaited<ReturnType<typeof searchProducts>>[number]) {
  const badges: string[] = [];
  if (product.isNewArrival) badges.push('Baru');
  if (product.isOnSale) badges.push('Sale');

  const priceInfo = computeProductPriceDisplay({
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents ?? null,
    variants: (product.variants || []).map((v) => ({
      isActive: v.isActive,
      priceCents: v.priceCents,
    })),
  });

  return {
    id: product.id,
    handle: product.slug,
    title: product.name,
    vendor: product.brand?.name,
    price: priceInfo.priceDisplay,
    priceRangeMin: priceInfo.priceRangeMin,
    priceRangeMax: priceInfo.priceRangeMax,
    compareAtPrice: priceInfo.compareAtPriceDisplay,
    badges,
    image: product.images?.[0] || undefined,
    secondaryImage: product.images?.[1] || undefined,
    variantId: (product.variants || []).find((v) => v.isActive)?.id,
    categoryId: product.categoryId,
    brandId: product.brandId ?? undefined,
    divingTypes: product.divingTypes,
    isNewArrival: product.isNewArrival,
    isOnSale: product.isOnSale,
    isActive: product.isActive,
    category: product.category,
    brand: product.brand,
  };
}

/**
 * Get all products (excluding soft-deleted)
 * @deprecated Use searchProducts for storefront
 */
export async function getProducts(filters?: ProductFilters) {
  const conditions: SQL[] = [isNull(products.deletedAt)];
  
  if (filters?.category) {
    conditions.push(eq(products.categoryId, filters.category));
  }
  if (filters?.brand) {
    conditions.push(eq(products.brandId, filters.brand));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  if (filters?.isFeatured !== undefined) {
    conditions.push(eq(products.isFeatured, filters.isFeatured));
  }
  if (filters?.isNewArrival !== undefined) {
    conditions.push(eq(products.isNewArrival, filters.isNewArrival));
  }
  if (filters?.isOnSale !== undefined) {
    conditions.push(eq(products.isOnSale, filters.isOnSale));
  }
  if (filters?.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`));
  }
  
  return db.query.products.findMany({
    where: and(...conditions),
    with: {
      category: true,
      brand: true,
      variants: true,
    },
    orderBy: [desc(products.createdAt)],
    limit: filters?.limit,
  });
}

/**
 * Get a single product by ID (excluding soft-deleted)
 */
export async function getProductById(id: string) {
  return db.query.products.findFirst({
    where: and(
      eq(products.id, id),
      isNull(products.deletedAt)
    ),
    with: {
      category: true,
      brand: true,
      variants: true,
    },
  });
}

/**
 * Get a single product by slug (excluding soft-deleted)
 * Wrapped in React's cache() so generateMetadata and the page component
 * share one DB query per request instead of fetching twice.
 */
export const getProductBySlug = cache(async (slug: string) => {
  return db.query.products.findFirst({
    where: and(
      eq(products.slug, slug),
      isNull(products.deletedAt)
    ),
    with: {
      category: true,
      brand: true,
      variants: {
        where: eq(productVariants.isActive, true),
      },
    },
  });
});

/**
 * Get all existing slugs for uniqueness check
 */
export async function getExistingSlugs(excludeId?: string) {
  const result = await db
    .select({ slug: products.slug })
    .from(products)
    .where(
      excludeId 
        ? and(isNull(products.deletedAt), sql`${products.id} != ${excludeId}`)
        : isNull(products.deletedAt)
    );
  return result.map(r => r.slug);
}

/**
 * Get related products (same category, excluding current product)
 * Limited to 4 products for the related products section
 */
export async function getRelatedProducts(productId: string, categoryId: string | null, brandId?: string | null, limit = 4) {
  const conditions: SQL[] = [
    isNull(products.deletedAt),
    eq(products.isActive, true),
    sql`${products.id} != ${productId}`,
  ];
  
  // Prefer products from the same category
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }
  
  const results = await db.query.products.findMany({
    where: and(...conditions),
    with: {
      category: true,
      brand: true,
      variants: {
        where: eq(productVariants.isActive, true),
      },
    },
    orderBy: [desc(products.createdAt)],
    limit,
  });
  
  // If we don't have enough products from the same category, get more from the same brand
  if (results.length < limit && brandId && !categoryId) {
    const brandProducts = await db.query.products.findMany({
      where: and(
        isNull(products.deletedAt),
        eq(products.isActive, true),
        sql`${products.id} != ${productId}`,
        eq(products.brandId, brandId),
        // Exclude products we already have
        ...results.map(r => sql`${products.id} != ${r.id}`),
      ),
      with: {
        category: true,
        brand: true,
        variants: {
          where: eq(productVariants.isActive, true),
        },
      },
      orderBy: [desc(products.createdAt)],
      limit: limit - results.length,
    });
    
    results.push(...brandProducts);
  }
  
  // If still not enough, get any active products
  if (results.length < limit) {
    const existingIds = results.map(r => r.id);
    const otherProducts = await db.query.products.findMany({
      where: and(
        isNull(products.deletedAt),
        eq(products.isActive, true),
        sql`${products.id} != ${productId}`,
        ...existingIds.map(id => sql`${products.id} != ${id}`),
      ),
      with: {
        category: true,
        brand: true,
        variants: {
          where: eq(productVariants.isActive, true),
        },
      },
      orderBy: [desc(products.createdAt)],
      limit: limit - results.length,
    });
    
    results.push(...otherProducts);
  }
  
  return results;
}
