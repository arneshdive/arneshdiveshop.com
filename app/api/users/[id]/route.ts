import { NextResponse } from 'next/server';
import { db, users, orders } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

// GET /api/users/[id] - Get user detail with customer profile
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        customer: {
          with: {
            addresses: true,
            orders: {
              limit: 10,
              orderBy: [desc(orders.createdAt)],
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
