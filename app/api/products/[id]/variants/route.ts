import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, productVariants } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { getProductById } from '@/lib/queries/products';

const createVariantSchema = z.object({
  sku: z.string().max(100).optional().nullable(),
  name: z.string().min(1, 'Nama varian wajib diisi').max(200),
  options: z.record(z.string(), z.string()).refine(
    (opts) => Object.keys(opts).length > 0,
    { message: 'Opsi varian wajib diisi' }
  ),
  priceCents: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
});

// GET /api/products/[id]/variants - List variants for a product
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

    return NextResponse.json({ variants: product.variants || [] });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/variants - Create a new variant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(await auth.error.json(), { status: auth.error.status });
    }

    const { id: productId } = await params;
    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = createVariantSchema.safeParse(body);

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

    const { sku, name, options, priceCents, isActive } = result.data;

    const [newVariant] = await db.insert(productVariants).values({
      productId,
      sku: sku || null,
      name,
      options: options as Record<string, string>,
      priceCents: priceCents ?? null,
      isActive: isActive ?? true,
    }).returning();

    if (!newVariant) {
      throw new Error('Failed to create variant');
    }

    revalidatePath('/', 'layout');
    revalidatePath('/produk', 'page');
    revalidatePath(`/produk/${product.slug}`, 'page');

    return NextResponse.json({ variant: newVariant }, { status: 201 });
  } catch (error) {
    console.error('Error creating variant:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
