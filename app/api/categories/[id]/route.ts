import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, categories, products } from '@/lib/db';
import { eq } from 'drizzle-orm';

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100).optional(),
  slug: z.string().min(1, 'Slug wajib diisi').max(100).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung').optional(),
  description: z.string().max(500).optional().nullable(),
});

type Params = Promise<{ id: string }>;

// GET /api/categories/[id] - Get single category
export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateCategorySchema.safeParse(body);

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

    const existing = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    // If slug is being updated, check for duplicates
    if (result.data.slug && result.data.slug !== existing.slug) {
      const slugExists = await db.query.categories.findFirst({
        where: eq(categories.slug, result.data.slug),
      });
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug sudah digunakan' },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(categories)
      .set(result.data)
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const existing = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    // Check if category has products
    const hasProducts = await db.query.products.findFirst({
      where: eq(products.categoryId, id),
    });

    if (hasProducts) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus kategori yang memiliki produk terkait' },
        { status: 400 }
      );
    }

    await db.delete(categories).where(eq(categories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
