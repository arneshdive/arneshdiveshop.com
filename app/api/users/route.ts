import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { desc } from 'drizzle-orm';

// GET /api/users - List all users with their customer profile
export async function GET() {
  try {
    const allUsers = await db.query.users.findMany({
      with: {
        customer: true,
      },
      orderBy: [desc(users.createdAt)],
    });
    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
