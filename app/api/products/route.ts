import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, products, categories, brands } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/admin';
import { slugify, generateUniqueSlug } from '@/lib/utils/slugify';
import { getProducts, getExistingSlugs } from '@/lib/queries/products';
import { DIVING_TYPES } from '@/lib/constants/diving-types';

const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').max(200),
  slug: z.string().max(200).optional(),
  sku: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  priceCents: z.number().int().min(0).optional(),
  compareAtPriceCents: z.number().int().min(0).optional().nullable(),
  costPriceCents: z.number().int().min(0).optional().nullable(),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  brandId: z.string().optional().nullable(),
  divingTypes: z.array(z.enum(DIVING_TYPES)).min(1, 'Pilih minimal satu tipe diving'),
  images: z.array(z.string()).min(1, 'Minimal 1 gambar wajib diupload'),
  isActive: z.boolean().default(true),
  isNewArrival: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  weightGrams: z.number().int().min(1, 'Berat minimal 1 gram').optional(),
});

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      divingType: searchParams.get('divingType') || undefined,
      isActive: searchParams.get('isActive') === 'true' 
        ? true 
        : searchParams.get('isActive') === 'false' 
          ? false 
          : undefined,
      isNewArrival: searchParams.get('isNewArrival') === 'true' ? true : undefined,
      isOnSale: searchParams.get('isOnSale') === 'true' ? true : undefined,
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
    // Check admin authorization
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(await auth.error.json(), { status: auth.error.status });
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

    if (rest.compareAtPriceCents != null && rest.compareAtPriceCents <= (rest.priceCents ?? 0)) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: { compareAtPriceCents: 'Harga coret harus lebih besar dari harga jual' } },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const baseSlug = providedSlug || slugify(name);
    const existingSlugs = await getExistingSlugs();
    const slug = generateUniqueSlug(baseSlug, existingSlugs);

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
      priceCents: rest.priceCents || 0,
    }).returning();

    if (!newProduct) {
      throw new Error('Failed to create product');
    }

    // Revalidate storefront pages
    revalidatePath('/', 'layout');
    revalidatePath('/produk', 'page');

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}
