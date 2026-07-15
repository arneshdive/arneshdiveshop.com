import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { desc, count, inArray } from 'drizzle-orm';
import type { UserRole } from '@/lib/db/schema';

const ITEMS_PER_PAGE = 10;

// GET /api/users - List users with pagination and their customer profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const roleFilter = searchParams.get('role') as 'customer' | 'admin' | null;
    const limit = ITEMS_PER_PAGE;
    const offset = (page - 1) * limit;

    // Determine which roles to include based on filter
    const rolesToInclude: UserRole[] | undefined = roleFilter === 'customer'
      ? ['customer']
      : roleFilter === 'admin'
        ? ['admin', 'super_admin']
        : undefined;

    // Get total count with optional role filter
    const totalResult = rolesToInclude
      ? await db.select({ total: count() }).from(users).where(inArray(users.role, rolesToInclude))
      : await db.select({ total: count() }).from(users);
    const total = totalResult[0]?.total ?? 0;

    // Get paginated users
    const paginatedUsers = await db.query.users.findMany({
      where: rolesToInclude ? (user, { inArray }) => inArray(user.role, rolesToInclude) : undefined,
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
