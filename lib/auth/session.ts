import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { compare, hash } from './password';

const SESSION_COOKIE_NAME = 'session';
const SESSION_EXPIRY_DAYS = 7;
const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: 'customer' | 'admin' | 'super_admin';
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
    .sign(JWT_SECRET());

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());
    return payload.user as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function login(email: string, password: string): Promise<SessionUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.password) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = await createSession(sessionUser);
  await setSessionCookie(token);

  return sessionUser;
}

export async function logout(): Promise<void> {
  await clearSession();
}
