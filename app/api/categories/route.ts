import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, categories, products } from '@/lib/db';
import { eq, desc, count, inArray } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/admin';

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
    const all = searchParams.get('all') === 'true';
    
    // Return all categories for filter dropdowns
    if (all) {
      const allCategories = await db.query.categories.findMany({
        orderBy: [desc(categories.createdAt)],
      });
      return NextResponse.json({ categories: allCategories });
    }
    
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

    // Attach product counts per category
    const categoryIds = paginatedCategories.map((c) => c.id);
    const productCounts =
      categoryIds.length > 0
        ? await db
            .select({ categoryId: products.categoryId, count: count() })
            .from(products)
            .where(inArray(products.categoryId, categoryIds))
            .groupBy(products.categoryId)
        : [];

    const countMap = new Map(productCounts.map((r) => [r.categoryId, r.count]));

    const categoriesWithCount = paginatedCategories.map((c) => ({
      ...c,
      productCount: countMap.get(c.id) ?? 0,
    }));

    return NextResponse.json({
      categories: categoriesWithCount,
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
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(await auth.error.json(), { status: auth.error.status });
    }

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
