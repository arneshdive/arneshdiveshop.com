import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, banners } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

const updateBannerSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  imageUrl: z.string().url('URL gambar tidak valid').optional(),
  link: z.string().max(500).optional(),
  position: z.enum(['hero', 'sidebar', 'footer']).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  eyebrow: z.string().max(100).optional(),
  ctaText: z.string().max(100).optional(),
  ctaLink: z.string().max(500).optional(),
});

// GET /api/admin/banners/[id] - Get single banner
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const banner = await db.query.banners.findFirst({
      where: eq(banners.id, id),
    });

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/banners/[id] - Update banner
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingBanner = await db.query.banners.findFirst({
      where: eq(banners.id, id),
    });

    if (!existingBanner) {
      return NextResponse.json(
        { error: 'Banner tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = updateBannerSchema.safeParse(body);

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

    const [updatedBanner] = await db
      .update(banners)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(banners.id, id))
      .returning();

    if (!updatedBanner) {
      throw new Error('Failed to update banner');
    }

    return NextResponse.json({ banner: updatedBanner });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/[id] - Delete banner
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingBanner = await db.query.banners.findFirst({
      where: eq(banners.id, id),
    });

    if (!existingBanner) {
      return NextResponse.json(
        { error: 'Banner tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.delete(banners).where(eq(banners.id, id));

    return NextResponse.json({ success: true, message: 'Banner berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
