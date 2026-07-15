import { NextRequest, NextResponse } from 'next/server';
import { db, users, verificationTokens } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createSession, setSessionCookie } from '@/lib/auth/session';

// POST /api/invitations/accept - Accept an invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token wajib diisi' }, { status: 400 });
    }

    // Find the invitation token
    const verificationToken = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, token),
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 400 });
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));
      return NextResponse.json({ error: 'Token sudah kadaluarsa' }, { status: 400 });
    }

    // Parse the identifier to get user ID (format: "invite:{userId}")
    if (!verificationToken.identifier.startsWith('invite:')) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 400 });
    }

    const userId = verificationToken.identifier.replace('invite:', '');

    // Get the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Check if user is blocked
    if (user.blockedAt) {
      return NextResponse.json({ error: 'Akun Anda diblokir. Hubungi administrator.' }, { status: 403 });
    }

    // Mark email as verified
    if (!user.emailVerified) {
      await db
        .update(users)
        .set({
          emailVerified: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // Delete the used token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token));

    // Create session for the user
    const sessionToken = await createSession({
      userId: user.id,
      role: user.role,
    });

    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      message: 'Undangan berhasil diterima',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
