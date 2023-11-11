# F-002: Core Authentication — Design Document

> **Module:** Authentication · **Priority:** 10/100 · **Depends on:** F-001

## Overview

Custom JWT session auth via jose: email/password registration with validation, secure login with HTTP-only cookie sessions, role-based access control (customer/admin/super_admin), and rate limiting on auth endpoints.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Auth Page     │────▶│   API Routes     │────▶│   Database      │
│  (app/auth)     │     │  /api/auth/*     │     │   (Neon/Drizzle)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   JWT Session    │
                        │   (jose, cookie) │
                        └──────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   Middleware     │
                        │   (RBAC checks)  │
                        └──────────────────┘
```

## Components

### 1. API Routes

**`POST /api/auth/register`**
- Validates: name, email, password, phone (phone optional)
- Password requirements: minimum 8 characters
- Hashes password using `lib/auth/password.ts`
- Creates user record with role `customer`
- Creates JWT session, sets HTTP-only cookie
- Returns 201 with user object (without password)

**`POST /api/auth/login`**
- Validates: email, password
- Checks rate limit for IP
- Verifies credentials against stored hash
- On failure: increments rate limit counter, returns 401
- On success: creates JWT session, sets cookie, returns 200 with user

**`POST /api/auth/logout`**
- Clears session cookie
- Returns 200

**`GET /api/auth/session`**
- Verifies JWT from cookie
- Returns current user or 401 if not authenticated
- Used by client for auth state

### 2. JWT Session (`lib/auth/session.ts`)

```typescript
interface SessionPayload {
  userId: string;
  role: UserRole;
}

// Functions:
// - createSession(payload): Promise<string> - signs JWT
// - verifySession(token): Promise<SessionPayload | null> - verifies JWT
// - getSessionCookies(): { set, delete } - cookie helpers
```

**Cookie Configuration:**
- Name: `session`
- HTTP-only: true
- Secure: true (production), false (development)
- SameSite: `lax`
- MaxAge: 7 days
- Path: `/`

**Environment:**
- `SESSION_SECRET` — 32+ character secret for JWT signing (required)

### 3. Rate Limiting (`lib/auth/rate-limit.ts`)

```typescript
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds
}

// Functions:
// - checkRateLimit(identifier: string): RateLimitResult
// - recordFailedAttempt(identifier: string): void
// - clearAttempts(identifier: string): void
```

**Configuration:**
- Max attempts: 5 per identifier
- Window: 15 minutes
- Identifier: IP address (from `x-forwarded-for` or `x-real-ip`)

**Implementation:** In-memory Map with cleanup. Suitable for single-instance deployment.

### 4. RBAC Middleware (`middleware.ts`)

```typescript
// Route protection:
// - /admin/* — requires admin or super_admin role
// - /api/admin/* — requires admin or super_admin role
// - /account/* — requires authenticated user (any role)
```

**Flow:**
1. Extract session cookie
2. Verify JWT
3. Attach user to request headers for downstream use
4. Check role against route requirements
5. Allow → continue, Deny → redirect/401/403

### 5. Auth UI (`app/auth/page.tsx`)

Replace existing OTP flow with email/password forms:

**Login Form:**
- Email input
- Password input
- "Forgot password?" link (non-functional, placeholder for future)
- Submit → `POST /api/auth/login`
- Redirect to `?redirect=` param or `/account`

**Register Form:**
- Name input (required)
- Email input (required)
- Phone input (optional)
- Password input (required, min 8 chars)
- Confirm password input (must match)
- Submit → `POST /api/auth/register`
- Redirect to `?redirect=` param or `/account`

**Toggle:** Switch between Login/Register modes.

## Data Flow: Registration

```
User submits form (name, email, phone, password)
        ↓
Validate inputs (zod schema)
        ↓
Check if email exists
        ↓
If exists → 409 conflict
        ↓
Hash password (PBKDF2)
        ↓
Create user in database
        ↓
Create JWT session
        ↓
Set HTTP-only cookie
        ↓
Return 201 with user
```

## Data Flow: Login

```
User submits form (email, password)
        ↓
Rate limit check (IP-based)
        ↓
If rate limited → 429
        ↓
Lookup user by email
        ↓
If not found → record failed attempt → 401
        ↓
Compare password hash
        ↓
If invalid → record failed attempt → 401
        ↓
Clear rate limit for IP
        ↓
Create JWT session
        ↓
Set HTTP-only cookie
        ↓
Return 200 with user
```

## API Response Formats

### Success Responses

```typescript
// POST /api/auth/register - 201
{
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "customer" | "admin" | "super_admin";
  }
}

// POST /api/auth/login - 200
{
  user: { ... }
}

// POST /api/auth/logout - 200
{ success: true }

// GET /api/auth/session - 200
{
  user: { ... }
}
```

### Error Responses

```typescript
// 400 - Validation error
{ error: string; details?: Record<string, string> }

// 401 - Invalid credentials
{ error: "Email atau password salah" }

// 409 - Email already registered
{ error: "Email sudah terdaftar" }

// 429 - Rate limited
{ error: string; retryAfter: number }
```

## Error Messages (Indonesian)

| Scenario | Message |
|----------|---------|
| Invalid credentials | "Email atau password salah" |
| Email exists | "Email sudah terdaftar" |
| Rate limited | "Terlalu banyak percobaan, coba lagi dalam {X} menit" |
| Missing fields | "Semua field wajib diisi" |
| Password too short | "Password minimal 8 karakter" |
| Password mismatch | "Password tidak cocok" |
| Invalid email | "Format email tidak valid" |
| Invalid phone | "Format nomor telepon tidak valid" |
| unauthorized access | Redirect to `/auth?redirect={path}` |

## Security Considerations

1. **Password Hashing:** PBKDF2 with 100,000 iterations, SHA-512, 16-byte salt (already implemented in `lib/auth/password.ts`)

2. **HTTP-only Cookies:** Prevents XSS from stealing session tokens

3. **SameSite=lax:** Prevents CSRF while allowing normal navigation

4. **Rate Limiting:** Prevents brute force attacks

5. **No Password in Responses:** User objects never include password field

6. **Secure Flag:** Cookies only sent over HTTPS in production

## File Structure

```
lib/
├── auth/
│   ├── password.ts       # Already exists
│   ├── session.ts        # NEW: JWT creation/verification
│   └── rate-limit.ts     # NEW: Rate limiting logic
├── db/
│   ├── index.ts          # Already exists
│   └── schema.ts         # Already exists (users table ready)

app/
├── api/
│   └── auth/
│       ├── register/
│       │   └── route.ts  # NEW
│       ├── login/
│       │   └── route.ts  # NEW
│       ├── logout/
│       │   └── route.ts  # NEW
│       └── session/
│           └── route.ts  # NEW
├── auth/
│   └── page.tsx          # REPLACE: Email/password UI
└── ...

middleware.ts             # NEW: RBAC protection
```

## Acceptance Criteria Mapping

| AC | Implementation |
|----|----------------|
| AC1: Customer can register | `POST /api/auth/register` + updated auth page |
| AC2: Customer can login with HTTP-only JWT cookie | `POST /api/auth/login` + session.ts |
| AC3: Admin-only routes reject customer | middleware.ts role checking |
| AC4: Rate limiting on auth endpoints | rate-limit.ts + integrated in login route |

## Out of Scope

- Email verification
- Forgot password flow
- OAuth/social login
- Session revocation list
- Multiple device session management
