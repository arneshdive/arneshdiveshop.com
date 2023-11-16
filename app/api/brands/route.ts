import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, brands } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

const createBrandSchema = z.object({
  name: z.string().min(1, 'Nama merek wajib diisi').max(100),
  slug: z.string().min(1, 'Slug wajib diisi').max(100).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

// GET /api/brands - List all brands
export async function GET() {
  try {
    const allBrands = await db.query.brands.findMany({
      orderBy: [desc(brands.createdAt)],
    });
    return NextResponse.json({ brands: allBrands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST /api/brands - Create new brand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createBrandSchema.safeParse(body);

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

    const { name, slug, description, logoUrl } = result.data;

    // Check if slug already exists
    const existingBrand = await db.query.brands.findFirst({
      where: eq(brands.slug, slug),
    });

    if (existingBrand) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan' },
        { status: 409 }
      );
    }

    // Create brand
    const [newBrand] = await db.insert(brands).values({
      name,
      slug,
      description: description || null,
      logoUrl: logoUrl || null,
    }).returning();

    if (!newBrand) {
      throw new Error('Failed to create brand');
    }

    return NextResponse.json({ brand: newBrand }, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
