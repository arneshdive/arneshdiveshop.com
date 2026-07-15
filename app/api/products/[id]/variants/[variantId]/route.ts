import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, productVariants } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/admin';
import { getProductById } from '@/lib/queries/products';

const updateVariantSchema = z.object({
  sku: z.string().max(100).optional().nullable(),
  name: z.string().min(1, 'Nama varian wajib diisi').max(200).optional(),
  options: z.record(z.string(), z.string()).optional(),
  priceCents: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/products/[id]/variants/[variantId] - Get single variant
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id: productId, variantId } = await params;

    const variant = await db.query.productVariants.findFirst({
      where: and(
        eq(productVariants.id, variantId),
        eq(productVariants.productId, productId)
      ),
    });

    if (!variant) {
      return NextResponse.json(
        { error: 'Varian tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ variant });
  } catch (error) {
    console.error('Error fetching variant:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id]/variants/[variantId] - Update variant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(await auth.error.json(), { status: auth.error.status });
    }

    const { id: productId, variantId } = await params;

    const variant = await db.query.productVariants.findFirst({
      where: and(
        eq(productVariants.id, variantId),
        eq(productVariants.productId, productId)
      ),
    });

    if (!variant) {
      return NextResponse.json(
        { error: 'Varian tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = updateVariantSchema.safeParse(body);

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

    // Build update object with correct types
    const updateData: {
      sku?: string | null;
      name?: string;
      options?: Record<string, string>;
      priceCents?: number | null;
      isActive?: boolean;
    } = {};
    
    if (updates.sku !== undefined) updateData.sku = updates.sku;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.options !== undefined) updateData.options = updates.options as Record<string, string>;
    if (updates.priceCents !== undefined) updateData.priceCents = updates.priceCents;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    const [updatedVariant] = await db
      .update(productVariants)
      .set(updateData)
      .where(eq(productVariants.id, variantId))
      .returning();

    if (!updatedVariant) {
      throw new Error('Failed to update variant');
    }

    const product = await getProductById(productId);
    revalidatePath('/', 'layout');
    revalidatePath('/produk', 'page');
    if (product) {
      revalidatePath(`/produk/${product.slug}`, 'page');
    }

    return NextResponse.json({ variant: updatedVariant });
  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/variants/[variantId] - Delete variant
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(await auth.error.json(), { status: auth.error.status });
    }

    const { id: productId, variantId } = await params;

    const variant = await db.query.productVariants.findFirst({
      where: and(
        eq(productVariants.id, variantId),
        eq(productVariants.productId, productId)
      ),
    });

    if (!variant) {
      return NextResponse.json(
        { error: 'Varian tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.delete(productVariants).where(eq(productVariants.id, variantId));

    const product = await getProductById(productId);
    revalidatePath('/', 'layout');
    revalidatePath('/produk', 'page');
    if (product) {
      revalidatePath(`/produk/${product.slug}`, 'page');
    }

    return NextResponse.json({ success: true, message: 'Varian berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
