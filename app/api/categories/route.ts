import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, categories } from '@/lib/db';
import { eq, desc, count } from 'drizzle-orm';

const ITEMS_PER_PAGE = 10;

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100),
  slug: z.string().min(1, 'Slug wajib diisi').max(100).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  description: z.string().max(500).nullable().optional(),
});

// GET /api/categories - List categories with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = ITEMS_PER_PAGE;
    const offset = (page - 1) * limit;

    // Get total count
    const totalResult = await db.select({ total: count() }).from(categories);
    const total = totalResult[0]?.total ?? 0;

    // Get paginated categories
    const paginatedCategories = await db.query.categories.findMany({
      orderBy: [desc(categories.createdAt)],
      limit,
      offset,
    });

    return NextResponse.json({
      categories: paginatedCategories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
