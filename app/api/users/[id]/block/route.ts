import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

// PATCH /api/users/[id]/block - Block or unblock a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { blocked } = body;

    // Prevent blocking yourself
    if (id === session.userId) {
      return NextResponse.json({ error: 'Tidak dapat memblokir diri sendiri' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Prevent blocking super admins (only super_admin can block admins)
    if (user.role === 'super_admin') {
      return NextResponse.json({ error: 'Tidak dapat memblokir super admin' }, { status: 403 });
    }

    // Only super_admin can block admins
    if (user.role === 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk memblokir admin' }, { status: 403 });
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        blockedAt: blocked ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
