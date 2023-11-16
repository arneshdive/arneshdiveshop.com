import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, brands } from '@/lib/db';
import { eq } from 'drizzle-orm';

const updateBrandSchema = z.object({
  name: z.string().min(1, 'Nama merek wajib diisi').max(100).optional(),
  slug: z.string().min(1, 'Slug wajib diisi').max(100).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung').optional(),
  description: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal('')),
});

type Params = Promise<{ id: string }>;

// GET /api/brands/[id] - Get single brand
export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, id),
    });

    if (!brand) {
      return NextResponse.json({ error: 'Merek tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PUT /api/brands/[id] - Update brand
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateBrandSchema.safeParse(body);

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

    // Check if brand exists
    const existingBrand = await db.query.brands.findFirst({
      where: eq(brands.id, id),
    });

    if (!existingBrand) {
      return NextResponse.json({ error: 'Merek tidak ditemukan' }, { status: 404 });
    }

    // If slug is being updated, check for duplicates
    if (result.data.slug && result.data.slug !== existingBrand.slug) {
      const slugExists = await db.query.brands.findFirst({
        where: eq(brands.slug, result.data.slug),
      });
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug sudah digunakan' },
          { status: 409 }
        );
      }
    }

    // Update brand
    const [updatedBrand] = await db
      .update(brands)
      .set(result.data)
      .where(eq(brands.id, id))
      .returning();

    if (!updatedBrand) {
      throw new Error('Failed to update brand');
    }

    return NextResponse.json({ brand: updatedBrand });
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id] - Delete brand
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    // Check if brand exists
    const existingBrand = await db.query.brands.findFirst({
      where: eq(brands.id, id),
    });

    if (!existingBrand) {
      return NextResponse.json({ error: 'Merek tidak ditemukan' }, { status: 404 });
    }

    // Check if brand has products
    const productsWithBrand = await db.query.products.findMany({
      where: (products, { eq }) => eq(products.brandId, id),
      limit: 1,
    });

    if (productsWithBrand.length > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus merek yang memiliki produk terkait' },
        { status: 400 }
      );
    }

    // Delete brand
    await db.delete(brands).where(eq(brands.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
