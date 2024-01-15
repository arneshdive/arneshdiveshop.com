import { NextRequest, NextResponse } from 'next/server';
import { db, users, verificationTokens } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { sendAdminInviteEmail } from '@/lib/email/admin-invite';

// POST /api/users/invite-admin - Invite a new admin
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    // Only super_admin can invite super_admin
    if (role === 'super_admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk mengundang super admin' }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      // Update existing user's role
      if (existingUser.role === 'super_admin') {
        return NextResponse.json({ error: 'Pengguna sudah menjadi super admin' }, { status: 400 });
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          role: role || 'admin',
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      // Send invite notification email
      await sendAdminInviteEmail(email, role || 'admin', true);

      return NextResponse.json({
        user: updatedUser,
        message: 'Role pengguna berhasil diperbarui'
      });
    }

    // Create new user with admin role (no password yet)
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name: email.split('@')[0],
        role: role || 'admin',
      })
      .returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Generate invitation token
    const inviteToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(verificationTokens).values({
      identifier: `invite:${newUser.id}`,
      token: inviteToken,
      expires,
    });

    // Send invite email
    await sendAdminInviteEmail(email, role || 'admin', false, inviteToken);

    return NextResponse.json({
      user: newUser,
      message: 'Undangan admin berhasil dikirim'
    });
  } catch (error) {
    console.error('Error inviting admin:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
