import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, products } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/admin';
import { slugify, generateUniqueSlug } from '@/lib/utils/slugify';
import { getProductById, getExistingSlugs } from '@/lib/queries/products';
import { DIVING_TYPES } from '@/lib/constants/diving-types';

const updateProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').max(200).optional(),
  slug: z.string().max(200).optional(),
  sku: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  priceCents: z.number().int().min(0).optional(),
  compareAtPriceCents: z.number().int().min(0).optional().nullable(),
  costPriceCents: z.number().int().min(0).optional().nullable(),
  categoryId: z.string().min(1).optional(),
  brandId: z.string().optional().nullable(),
  divingTypes: z.array(z.enum(DIVING_TYPES)).min(1, 'Pilih minimal satu tipe diving').optional(),
  images: z.array(z.string().url()).max(10).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isOnSale: z.boolean().optional(),
  weightGrams: z.number().int().min(1, 'Berat minimal 1 gram').optional(),
});

// GET /api/products/[id] - Get single product
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Update product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(await auth.error.json(), { status: auth.error.status });
    }

    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = updateProductSchema.safeParse(body);

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

    const updates = result.data;

    if (updates.compareAtPriceCents != null) {
      const effectivePriceCents = updates.priceCents ?? product.priceCents;
      if (updates.compareAtPriceCents <= effectivePriceCents) {
        return NextResponse.json(
          { error: 'Data tidak valid', details: { compareAtPriceCents: 'Harga coret harus lebih besar dari harga jual' } },
          { status: 400 }
        );
      }
    }

    // If name is being updated and slug not provided, regenerate slug
    if (updates.name && !updates.slug) {
      const baseSlug = slugify(updates.name);
      const existingSlugs = await getExistingSlugs(id);
      updates.slug = generateUniqueSlug(baseSlug, existingSlugs);
    }

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      throw new Error('Failed to update product');
    }

    // Revalidate storefront pages
    revalidatePath('/', 'layout');
    revalidatePath('/produk', 'page');
    revalidatePath(`/produk/${updatedProduct.slug}`, 'page');

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Soft delete product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(await auth.error.json(), { status: auth.error.status });
    }

    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    // Soft delete by setting deletedAt
    await db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(products.id, id));

    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
