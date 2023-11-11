# Core Authentication (F-002) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement email/password registration, login with JWT sessions, RBAC middleware, and rate limiting.

**Architecture:** JWT sessions via jose stored in HTTP-only cookies. Middleware verifies session and enforces role-based access. Rate limiting tracks failed login attempts in-memory per IP.

**Tech Stack:** Next.js 16, jose (JWT), Drizzle ORM, Neon Postgres, Zod (validation), Web Crypto API (password hashing)

---

## File Structure

```
lib/
├── auth/
│   ├── password.ts         # EXISTS: Password hashing
│   ├── session.ts          # CREATE: JWT session management
│   └── rate-limit.ts       # CREATE: Rate limiting

app/
├── api/
│   └── auth/
│       ├── register/
│       │   └── route.ts    # CREATE: Registration endpoint
│       ├── login/
│       │   └── route.ts    # CREATE: Login endpoint
│       ├── logout/
│       │   └── route.ts    # CREATE: Logout endpoint
│       └── session/
│           └── route.ts    # CREATE: Session check endpoint
├── auth/
│   └── page.tsx            # REPLACE: Email/password UI

middleware.ts               # CREATE: RBAC middleware
.env.local                  # ADD: SESSION_SECRET
```

---

### Task 1: JWT Session Management

**Files:**
- Create: `lib/auth/session.ts`

- [ ] **Step 1: Create session.ts with JWT utilities**

```typescript
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserRole } from '@/lib/db/schema';

export interface SessionPayload {
  userId: string;
  role: UserRole;
}

const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const secretKey = getSecretKey();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secretKey);
  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
```

- [ ] **Step 2: Commit session utilities**

```bash
git add lib/auth/session.ts
git commit -m "feat(auth): add JWT session management utilities"
```

---

### Task 2: Rate Limiting

**Files:**
- Create: `lib/auth/rate-limit.ts`

- [ ] **Step 1: Create rate-limit.ts with in-memory tracking**

```typescript
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory store: Map<identifier, RateLimitEntry>
const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    return { allowed: true, remaining: MAX_ATTEMPTS, resetIn: 0 };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - entry.count);
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed: entry.count < MAX_ATTEMPTS,
    remaining,
    resetIn,
  };
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    store.set(identifier, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
  } else {
    entry.count++;
  }
}

export function clearAttempts(identifier: string): void {
  store.delete(identifier);
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(MAX_ATTEMPTS),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetIn),
  };
}
```

- [ ] **Step 2: Commit rate limiting**

```bash
git add lib/auth/rate-limit.ts
git commit -m "feat(auth): add in-memory rate limiting for auth endpoints"
```

---

### Task 3: Registration API Endpoint

**Files:**
- Create: `app/api/auth/register/route.ts`

- [ ] **Step 1: Create registration route**

```typescript
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
```

- [ ] **Step 2: Commit registration endpoint**

```bash
git add app/api/auth/register/route.ts
git commit -m "feat(auth): add registration API endpoint"
```

---

### Task 4: Login API Endpoint

**Files:**
- Create: `app/api/auth/login/route.ts`

- [ ] **Step 1: Create login route with rate limiting**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { compare } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  getRateLimitHeaders,
} from '@/lib/auth/rate-limit';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan, coba lagi dalam ${Math.ceil(rateLimitResult.resetIn / 60)} menit`,
          retryAfter: rateLimitResult.resetIn,
        },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const { email, password } = result.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user || !user.password) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Verify password
    const isValid = await compare(password, user.password);
    if (!isValid) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Clear rate limit on successful login
    clearAttempts(clientIp);

    // Create session
    const token = await createSession({
      userId: user.id,
      role: user.role,
    });

    await setSessionCookie(token);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    const newRateLimitResult = checkRateLimit(clientIp);
    return NextResponse.json(
      { user: userWithoutPassword },
      { status: 200, headers: getRateLimitHeaders(newRateLimitResult) }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit login endpoint**

```bash
git add app/api/auth/login/route.ts
git commit -m "feat(auth): add login API endpoint with rate limiting"
```

---

### Task 5: Logout API Endpoint

**Files:**
- Create: `app/api/auth/logout/route.ts`

- [ ] **Step 1: Create logout route**

```typescript
import { NextResponse } from 'next/server';
import { deleteSessionCookie } from '@/lib/auth/session';

export async function POST() {
  await deleteSessionCookie();
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit logout endpoint**

```bash
git add app/api/auth/logout/route.ts
git commit -m "feat(auth): add logout API endpoint"
```

---

### Task 6: Session API Endpoint

**Files:**
- Create: `app/api/auth/session/route.ts`

- [ ] **Step 1: Create session route**

```typescript
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch fresh user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
```

- [ ] **Step 2: Commit session endpoint**

```bash
git add app/api/auth/session/route.ts
git commit -m "feat(auth): add session check API endpoint"
```

---

### Task 7: RBAC Middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware with RBAC**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, type SessionPayload } from '@/lib/auth/session';

// Routes that require authentication
const protectedRoutes = ['/account'];

// Routes that require admin role
const adminRoutes = ['/admin'];
const adminApiRoutes = ['/api/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session from cookie
  const token = request.cookies.get('session')?.value;
  let session: SessionPayload | null = null;

  if (token) {
    session = await verifySession(token);
  }

  // Check if route requires auth
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminApiRoute = adminApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // No session on protected route → redirect to login
  if ((isProtectedRoute || isAdminRoute || isAdminApiRoute) && !session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route but not admin role → deny access
  if ((isAdminRoute || isAdminApiRoute) && session) {
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Akses ditolak' },
          { status: 403 }
        );
      }
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // Add session to headers for downstream use
  const response = NextResponse.next();
  if (session) {
    response.headers.set('x-user-id', session.userId);
    response.headers.set('x-user-role', session.role);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
```

- [ ] **Step 2: Commit middleware**

```bash
git add middleware.ts
git commit -m "feat(auth): add RBAC middleware for route protection"
```

---

### Task 8: Auth UI — Replace OTP with Email/Password

**Files:**
- Modify: `app/auth/page.tsx`
- Read: `lib/utils/validators.ts` (for existing validators)

- [ ] **Step 1: Check existing validators**

Run: Check file `lib/utils/validators.ts` for `isValidEmail` and `isValidPhone` functions.

- [ ] **Step 2: Replace auth page with email/password forms**

```tsx
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { AnimatedButton } from '@/components/ui/animated-button';
import { isValidEmail, isValidPhone } from '@/lib/utils/validators';

type Mode = 'login' | 'register';

interface AuthForm {
  email: string;
  password: string;
  name: string;
  phone: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  confirmPassword?: string;
  general?: string;
}

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<AuthForm>({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/account';

  const updateForm = (field: keyof AuthForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!form.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }

    if (mode === 'register') {
      if (!form.name.trim()) {
        newErrors.name = 'Nama wajib diisi';
      }

      if (form.phone && !isValidPhone(form.phone)) {
        newErrors.phone = 'Format nomor telepon tidak valid';
      }

      if (!form.confirmPassword) {
        newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
      } else if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Password tidak cocok';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : {
              email: form.email,
              password: form.password,
              name: form.name,
              phone: form.phone || undefined,
            };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ general: data.error || 'Terjadi kesalahan' });
        }
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Terjadi kesalahan pada server' });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight">ARNES DIVE</span>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => setMode('login')}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
              mode === 'login'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500'
            )}
          >
            Masuk
          </button>
          <button
            onClick={() => setMode('register')}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
              mode === 'register'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500'
            )}
          >
            Daftar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register-only fields */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm text-neutral-500 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className={cn(
                    'w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none transition-colors',
                    errors.name
                      ? 'border-red-300 focus:border-2 focus:border-red-500'
                      : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-neutral-500 mb-2">
                  Nomor Telepon <span className="text-neutral-400">(opsional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className={cn(
                    'w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none transition-colors',
                    errors.phone
                      ? 'border-red-300 focus:border-2 focus:border-red-500'
                      : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
                  )}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              placeholder="email@contoh.com"
              autoFocus={mode === 'login'}
              className={cn(
                'w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none transition-colors',
                errors.email
                  ? 'border-red-300 focus:border-2 focus:border-red-500'
                  : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-neutral-500 mb-2">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
              placeholder="Masukkan password"
              className={cn(
                'w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none transition-colors',
                errors.password
                  ? 'border-red-300 focus:border-2 focus:border-red-500'
                  : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
              )}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-neutral-500 mb-2">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateForm('confirmPassword', e.target.value)}
                placeholder="Ulangi password"
                className={cn(
                  'w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none transition-colors',
                  errors.confirmPassword
                    ? 'border-red-300 focus:border-2 focus:border-red-500'
                    : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
                )}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <p className="text-sm text-red-500 text-center">{errors.general}</p>
          )}

          {/* Submit */}
          <AnimatedButton
            type="submit"
            disabled={isLoading}
            className="w-full py-3 text-sm"
          >
            {isLoading
              ? 'Memproses...'
              : mode === 'login'
                ? 'Masuk'
                : 'Daftar'}
          </AnimatedButton>
        </form>

        {/* Forgot password placeholder */}
        {mode === 'login' && (
          <p className="text-xs text-center text-neutral-400 mt-4">
            Lupa password?{' '}
            <span className="text-neutral-600 cursor-not-allowed">
              Fitur coming soon
            </span>
          </p>
        )}

        {/* Terms */}
        <p className="text-xs text-neutral-400 text-center mt-6">
          Dengan melanjutkan, Anda menyetujui{' '}
          <a
            href="/syarat-ketentuan"
            className="text-neutral-600 hover:text-neutral-900 underline"
          >
            Syarat & Ketentuan
          </a>{' '}
          kami
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-sm text-neutral-500">Loading...</div>
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
```

- [ ] **Step 3: Commit auth UI**

```bash
git add app/auth/page.tsx
git commit -m "feat(auth): replace OTP flow with email/password forms"
```

---

### Task 9: Environment Configuration

**Files:**
- Modify: `.env.local` (add SESSION_SECRET)

- [ ] **Step 1: Generate and add SESSION_SECRET**

Generate a 32-character random secret and add to `.env.local`:

```bash
# If .env.local doesn't exist, create it
if [ ! -f .env.local ]; then touch .env.local; fi

# Add SESSION_SECRET (use a secure random string in production)
echo "SESSION_SECRET=\"$(openssl rand -base64 32)\"" >> .env.local
```

- [ ] **Step 2: Commit .env.local.example (if exists) or document in README**

```bash
git add .env.local.example 2>/dev/null || true
git commit -m "docs: add SESSION_SECRET to environment config" || true
```

---

### Task 10: Verification

- [ ] **Step 1: Run dev server and verify compilation**

Run: `pnpm dev`

Expected: Server starts without errors

- [ ] **Step 2: Test registration flow manually**

1. Navigate to `/auth`
2. Switch to "Daftar" (register) tab
3. Fill in: name, email, password
4. Submit
5. Expected: Redirect to `/account`, user created in database

- [ ] **Step 3: Test login flow manually**

1. Click logout (or clear cookies)
2. Navigate to `/auth`
3. Enter registered email/password
4. Submit
5. Expected: Redirect to `/account`

- [ ] **Step 4: Test rate limiting**

1. Attempt login with wrong password 6 times
2. Expected: 429 response with error message

- [ ] **Step 5: Test RBAC middleware**

1. Login as customer
2. Navigate to `/admin`
3. Expected: Redirect to home page (access denied)

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`

Expected: All tests pass

---

## Acceptance Criteria Verification

| AC | Verification |
|----|--------------|
| AC1: Customer can register | Task 3 (register API) + Task 8 (UI) + Task 10 Step 2 |
| AC2: Login with HTTP-only JWT cookie | Task 4 (login API) + Task 1 (session) + Task 10 Step 3 |
| AC3: Admin routes reject customers | Task 7 (middleware) + Task 10 Step 5 |
| AC4: Rate limiting on auth endpoints | Task 2 (rate-limit) + Task 4 (integrated in login) + Task 10 Step 4 |
