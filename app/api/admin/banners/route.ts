import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, banners } from '@/lib/db';
import { asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

const createBannerSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  imageUrl: z.string().url('URL gambar tidak valid'),
  link: z.string().max(500).optional(),
  position: z.enum(['hero', 'sidebar', 'footer']).default('hero'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  eyebrow: z.string().max(100).optional(),
  ctaText: z.string().max(100).optional(),
  ctaLink: z.string().max(500).optional(),
});

// GET /api/admin/banners - List all banners
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allBanners = await db.query.banners.findMany({
      orderBy: [asc(banners.sortOrder), asc(banners.createdAt)],
    });

    return NextResponse.json({ banners: allBanners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST /api/admin/banners - Create new banner
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createBannerSchema.safeParse(body);

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

    const [newBanner] = await db.insert(banners).values(result.data).returning();

    if (!newBanner) {
      throw new Error('Failed to create banner');
    }

    return NextResponse.json({ banner: newBanner }, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
