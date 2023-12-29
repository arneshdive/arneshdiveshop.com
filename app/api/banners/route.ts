import { NextResponse } from 'next/server';
import { db, banners } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

// GET /api/banners - Get active banners for public display
export async function GET() {
  try {
    const activeBanners = await db.query.banners.findMany({
      where: eq(banners.isActive, true),
      orderBy: [asc(banners.sortOrder), asc(banners.createdAt)],
    });

    return NextResponse.json({ banners: activeBanners });
  } catch (error) {
    console.error('Error fetching active banners:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
