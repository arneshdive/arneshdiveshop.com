import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, categories } from '@/lib/db';
import { eq } from 'drizzle-orm';

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100).optional(),
  slug: z.string().min(1, 'Slug wajib diisi').max(100).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung').optional(),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
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

    // Check if category exists
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    // If slug is being updated, check for duplicates
    if (result.data.slug && result.data.slug !== existingCategory.slug) {
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

    // If parentId is provided, verify it's not creating a circular reference
    if (result.data.parentId) {
      if (result.data.parentId === id) {
        return NextResponse.json(
          { error: 'Kategori tidak dapat menjadi induk dari dirinya sendiri' },
          { status: 400 }
        );
      }
      // Could add more circular reference checks for deeper hierarchies
      const parent = await db.query.categories.findFirst({
        where: eq(categories.id, result.data.parentId),
      });
      if (!parent) {
        return NextResponse.json(
          { error: 'Kategori induk tidak ditemukan' },
          { status: 400 }
        );
      }
    }

    // Update category
    const [updatedCategory] = await db
      .update(categories)
      .set(result.data)
      .where(eq(categories.id, id))
      .returning();

    if (!updatedCategory) {
      throw new Error('Failed to update category');
    }

    return NextResponse.json({ category: updatedCategory });
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

    // Check if category exists
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    // Check if category has children
    const children = await db.query.categories.findMany({
      where: eq(categories.parentId, id),
      limit: 1,
    });

    if (children.length > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus kategori yang memiliki subkategori' },
        { status: 400 }
      );
    }

    // Check if category has products
    const productsWithCategory = await db.query.products.findMany({
      where: (products, { eq }) => eq(products.categoryId, id),
      limit: 1,
    });

    if (productsWithCategory.length > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus kategori yang memiliki produk terkait' },
        { status: 400 }
      );
    }

    // Delete category
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
