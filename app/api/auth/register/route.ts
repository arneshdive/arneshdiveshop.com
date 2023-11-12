import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users, type NewUser } from '@/lib/db';
import { hash } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  phone: z.string().optional(),
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

    const { name, email, password, phone } = result.data;

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password);

    // Create user
    const [newUser] = await db.insert(users).values({
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role: 'customer',
    } as NewUser).returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Create session
    const token = await createSession({
      userId: newUser.id,
      role: newUser.role,
    });

    await setSessionCookie(token);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
