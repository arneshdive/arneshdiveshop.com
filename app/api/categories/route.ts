import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, categories } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100),
  slug: z.string().min(1, 'Slug wajib diisi').max(100).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  description: z.string().max(500).optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

// Build hierarchical tree from flat list
function buildCategoryTree(categoriesList: typeof categories.$inferSelect[]): (typeof categories.$inferSelect & { children: typeof categories.$inferSelect[] })[] {
  const map = new Map<string, typeof categories.$inferSelect & { children: typeof categories.$inferSelect[] }>();
  const roots: (typeof categories.$inferSelect & { children: typeof categories.$inferSelect[] })[] = [];

  // First pass: create map
  for (const cat of categoriesList) {
    map.set(cat.id, { ...cat, children: [] });
  }

  // Second pass: build tree
  for (const cat of categoriesList) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort by sortOrder
  const sortByOrder = (a: { sortOrder: number | null }, b: { sortOrder: number | null }) => (a.sortOrder || 0) - (b.sortOrder || 0);
  roots.sort(sortByOrder);
  for (const root of roots) {
    root.children.sort(sortByOrder);
  }

  return roots;
}

// GET /api/categories - List all categories (with hierarchy)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get('flat') === 'true';

    const allCategories = await db.query.categories.findMany({
      orderBy: [desc(categories.sortOrder), desc(categories.createdAt)],
    });

    if (flat) {
      return NextResponse.json({ categories: allCategories });
    }

    const tree = buildCategoryTree(allCategories);
    return NextResponse.json({ categories: tree, flat: allCategories });
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
    const result = createCategorySchema.safeParse(body);

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

    const { name, slug, description, parentId, sortOrder } = result.data;

    // Check if slug already exists
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan' },
        { status: 409 }
      );
    }

    // If parentId provided, verify parent exists
    if (parentId) {
      const parent = await db.query.categories.findFirst({
        where: eq(categories.id, parentId),
      });
      if (!parent) {
        return NextResponse.json(
          { error: 'Kategori induk tidak ditemukan' },
          { status: 400 }
        );
      }
    }

    // Create category
    const [newCategory] = await db.insert(categories).values({
      name,
      slug,
      description: description || null,
      parentId: parentId || null,
      sortOrder: sortOrder ?? 0,
    }).returning();

    if (!newCategory) {
      throw new Error('Failed to create category');
    }

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
