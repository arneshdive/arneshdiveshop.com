import { db, products, categories, brands } from '@/lib/db';
import { eq, isNull, desc, ilike, and, SQL, sql } from 'drizzle-orm';

export interface ProductFilters {
  category?: string;
  brand?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
}

/**
 * Get all products (excluding soft-deleted)
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
  if (filters?.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`));
  }
  
  return db.query.products.findMany({
    where: and(...conditions),
    with: {
      category: true,
      brand: true,
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
