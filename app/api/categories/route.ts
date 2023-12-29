import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, categories } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100),
  slug: z.string().min(1, 'Slug wajib diisi').max(100).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  description: z.string().max(500).nullable().optional(),
});

// GET /api/categories - List all categories
export async function GET() {
  try {
    const allCategories = await db.query.categories.findMany({
      orderBy: [desc(categories.createdAt)],
    });
    return NextResponse.json({ categories: allCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = categorySchema.safeParse(body);

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

    const { name, slug, description } = result.data;

    // Check if slug already exists
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan' },
        { status: 409 }
      );
    }

    const [newCategory] = await db.insert(categories).values({
      name,
      slug,
      description: description || null,
    }).returning();

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
