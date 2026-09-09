import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return { ...actual, eq: vi.fn((a: unknown, b: unknown) => ({ type: 'eq', a, b })) };
});

vi.mock('@/lib/db', () => ({
  db: {
    query: { users: { findFirst: vi.fn() } },
    update: vi.fn(() => ({ set: () => ({ where: () => Promise.resolve() }) })),
  },
  users: { id: 'id', email: 'email' },
}));

vi.mock('@/lib/auth/otp', () => ({ verifyOtp: vi.fn() }));

vi.mock('@/lib/auth/session', () => ({
  createSession: vi.fn().mockResolvedValue('signed.jwt'),
  setSessionCookie: vi.fn().mockResolvedValue(undefined),
  getSession: vi.fn(),
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 5, resetIn: 0 }),
  recordFailedAttempt: vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetIn: 900 }),
  clearAttempts: vi.fn().mockResolvedValue(undefined),
  getRateLimitHeaders: vi.fn(() => ({})),
}));

import { db } from '@/lib/db';
import { verifyOtp } from '@/lib/auth/otp';
import { getSession, createSession } from '@/lib/auth/session';
import { recordFailedAttempt } from '@/lib/auth/rate-limit';
import { POST } from './route';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ADMIN = {
  id: 'user-1',
  email: 'admin@arneshdive.com',
  name: 'Admin',
  role: 'admin',
  emailVerified: new Date('2026-01-01'),
  blockedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function post(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

const validBody = { email: 'admin@arneshdive.com', otp: '123456' };

describe('POST /api/auth/verify-otp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getSession as any).mockResolvedValue(null);
    (db.query.users.findFirst as any).mockResolvedValue(ADMIN);
  });

  it('signs in when the code is accepted', async () => {
    (verifyOtp as any).mockResolvedValue({ ok: true });

    const response = await POST(post(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      user: { id: 'user-1', role: 'admin' },
    });
    expect(createSession).toHaveBeenCalledWith({ userId: 'user-1', role: 'admin' });
  });

  it('reports a spent code as success when this browser is the one that spent it', async () => {
    // The shape of a double submit: the first request consumed the code and
    // set the cookie, so the second arrives already carrying that session.
    // Answering it with an error would tell someone who is signed in that
    // their code was rejected.
    (verifyOtp as any).mockResolvedValue({ ok: false, reason: 'not_found' });
    (getSession as any).mockResolvedValue({ userId: 'user-1', role: 'admin' });

    const response = await POST(post(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });
    // No new session, and the duplicate must not count against the limiter.
    expect(createSession).not.toHaveBeenCalled();
    expect(recordFailedAttempt).not.toHaveBeenCalled();
  });

  it('still rejects a spent code when there is no session behind it', async () => {
    (verifyOtp as any).mockResolvedValue({ ok: false, reason: 'not_found' });

    const response = await POST(post(validBody));

    expect(response.status).toBe(400);
    expect(recordFailedAttempt).toHaveBeenCalled();
  });

  it('does not let one account session verify another address', async () => {
    (verifyOtp as any).mockResolvedValue({ ok: false, reason: 'mismatch' });
    (getSession as any).mockResolvedValue({ userId: 'someone-else', role: 'customer' });
    (db.query.users.findFirst as any).mockResolvedValue({
      ...ADMIN,
      id: 'someone-else',
      email: 'other@arneshdive.com',
    });

    const response = await POST(post(validBody));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('salah'),
    });
  });

  it('does not revive a blocked account through its own stale session', async () => {
    (verifyOtp as any).mockResolvedValue({ ok: false, reason: 'expired' });
    (getSession as any).mockResolvedValue({ userId: 'user-1', role: 'admin' });
    (db.query.users.findFirst as any).mockResolvedValue({ ...ADMIN, blockedAt: new Date() });

    const response = await POST(post(validBody));

    expect(response.status).toBe(400);
  });

  it('rejects a malformed code before touching the limiter', async () => {
    const response = await POST(post({ email: 'admin@arneshdive.com', otp: '12' }));

    expect(response.status).toBe(400);
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});
