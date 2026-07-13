import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, products } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { getProductById } from '@/lib/queries/products';

const toggleSchema = z.object({
  field: z.enum(['isActive', 'isFeatured']),
  value: z.boolean(),
});

// PATCH /api/products/[id]/toggle - Toggle isActive or isFeatured
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const result = toggleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      );
    }

    const { field, value } = result.data;

    const [updatedProduct] = await db
      .update(products)
      .set({
        [field]: value,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      throw new Error('Failed to update product');
    }

    revalidatePath('/', 'layout');
    revalidatePath('/produk', 'page');
    revalidatePath(`/produk/${product.slug}`, 'page');

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error toggling product flag:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
