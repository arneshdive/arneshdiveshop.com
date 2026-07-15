import { NextRequest, NextResponse } from 'next/server';
import { db, users, verificationTokens } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { sendAdminInviteEmail } from '@/lib/email/admin-invite';

// POST /api/invitations/resend - Resend an invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 });
    }

    // Get the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Check if user has already accepted (has logged in before)
    // A user who accepted invitation would have emailVerified set
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Pengguna sudah menerima undangan' }, { status: 400 });
    }

    // Delete any existing invitation tokens for this user
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, `invite:${userId}`));

    // Generate new invitation token
    const inviteToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(verificationTokens).values({
      identifier: `invite:${userId}`,
      token: inviteToken,
      expires,
    });

    // Send invite email
    await sendAdminInviteEmail(user.email, user.role, false, inviteToken);

    return NextResponse.json({
      success: true,
      message: 'Undangan berhasil dikirim ulang',
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
