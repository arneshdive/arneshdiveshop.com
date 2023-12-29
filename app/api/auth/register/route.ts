import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users, type NewUser } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateOtp, storeOtp, getOtpExpiryMinutes } from '@/lib/auth/otp';
import { sendVerificationEmail } from '@/lib/email';

const registerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100),
  email: z.string().email('Format email tidak valid'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

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

    const { name, email } = result.data;

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      // If user exists but not verified, resend OTP
      if (!existingUser.emailVerified) {
        const otp = generateOtp();
        await storeOtp(email, otp);
        await sendVerificationEmail(email, otp, getOtpExpiryMinutes());
        
        return NextResponse.json({ 
          success: true,
          message: 'Email sudah terdaftar tapi belum diverifikasi. Kode OTP baru telah dikirim.',
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            emailVerified: existingUser.emailVerified,
          },
        }, { status: 200 });
      }
      
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Create user (emailVerified is null = unverified)
    const [newUser] = await db.insert(users).values({
      name,
      email: email.toLowerCase(),
      role: 'customer',
    } as NewUser).returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Generate OTP and send verification email
    const otp = generateOtp();
    await storeOtp(email, otp);
    const emailResult = await sendVerificationEmail(email, otp, getOtpExpiryMinutes());

    if (!emailResult.success) {
      console.error('Failed to send verification email during registration');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Registrasi berhasil. Silakan cek email untuk kode verifikasi.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
