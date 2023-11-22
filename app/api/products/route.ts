import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, products, categories, brands } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { slugify, generateUniqueSlug } from '@/lib/utils/slugify';
import { getProducts, getExistingSlugs } from '@/lib/queries/products';

const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').max(200),
  slug: z.string().max(200).optional(),
  sku: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  priceCents: z.number().int().min(0, 'Harga tidak boleh negatif'),
  compareAtPriceCents: z.number().int().min(0).optional().nullable(),
  costPriceCents: z.number().int().min(0).optional().nullable(),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  brandId: z.string().optional().nullable(),
  images: z.array(z.string().url()).max(10).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      isActive: searchParams.get('isActive') === 'true' 
        ? true 
        : searchParams.get('isActive') === 'false' 
          ? false 
          : undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
    };

    const productList = await getProducts(filters);
    return NextResponse.json({ products: productList });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
      return NextResponse.json(
        { error: 'Data tidak valid', details: errors },
        { status: 400 }
      );
    }

    const { name, slug: providedSlug, categoryId, brandId, ...rest } = result.data;

    // Generate slug if not provided
    const baseSlug = providedSlug || slugify(name);
    const existingSlugs = await getExistingSlugs();
    const slug = generateUniqueSlug(baseSlug, existingSlugs);

    // Check if SKU already exists
    if (rest.sku) {
      const existingSku = await db.query.products.findFirst({
        where: eq(products.sku, rest.sku),
      });
      if (existingSku && !existingSku.deletedAt) {
        return NextResponse.json(
          { error: 'SKU sudah digunakan', details: { sku: 'SKU sudah digunakan' } },
          { status: 409 }
        );
      }
    }

    // Verify category exists
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });
    if (!category) {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan' },
        { status: 400 }
      );
    }

    // Verify brand exists if provided
    if (brandId) {
      const brand = await db.query.brands.findFirst({
        where: eq(brands.id, brandId),
      });
      if (!brand) {
        return NextResponse.json(
          { error: 'Brand tidak ditemukan' },
          { status: 400 }
        );
      }
    }

    // Create product
    const [newProduct] = await db.insert(products).values({
      name,
      slug,
      categoryId,
      brandId: brandId || null,
      ...rest,
    }).returning();

    if (!newProduct) {
      throw new Error('Failed to create product');
    }

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
