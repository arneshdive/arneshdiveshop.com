import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { desc, count } from 'drizzle-orm';

const ITEMS_PER_PAGE = 10;

// GET /api/users - List users with pagination and their customer profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = ITEMS_PER_PAGE;
    const offset = (page - 1) * limit;

    // Get total count
    const totalResult = await db.select({ total: count() }).from(users);
    const total = totalResult[0]?.total ?? 0;

    // Get paginated users
    const paginatedUsers = await db.query.users.findMany({
      with: {
        customer: true,
      },
      orderBy: [desc(users.createdAt)],
      limit,
      offset,
    });

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
