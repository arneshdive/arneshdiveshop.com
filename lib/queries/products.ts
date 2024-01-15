import { db, products, productVariants, categories, brands } from '@/lib/db';
import { eq, isNull, desc, ilike, and, SQL, sql, or, gte, lte, between } from 'drizzle-orm';

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
    orderBy: [desc(products.createdAt)],
    limit,
    offset,
  });
  
  return results;
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
 */
export async function getProductBySlug(slug: string) {
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
}

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
      },
      orderBy: [desc(products.createdAt)],
      limit: limit - results.length,
    });
    
    results.push(...otherProducts);
  }
  
  return results;
}
