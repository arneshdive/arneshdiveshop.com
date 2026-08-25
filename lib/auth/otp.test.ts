import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env before any imports
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');

// Mock drizzle-orm comparators so we can inspect the conditions built
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn((a: unknown, b: unknown) => ({ type: 'eq', a, b })),
    and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
    gt: vi.fn((a: unknown, b: unknown) => ({ type: 'gt', a, b })),
    lt: vi.fn((a: unknown, b: unknown) => ({ type: 'lt', a, b })),
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    delete: vi.fn(),
    insert: vi.fn(),
    query: {
      otpCodes: {
        findFirst: vi.fn(),
      },
    },
  },
  otpCodes: {
    email: 'email',
    code: 'code',
    expires: 'expires',
    createdAt: 'createdAt',
  },
  users: {},
  customers: {},
}));

import { db } from '@/lib/db';
import {
  generateOtp,
  storeOtp,
  verifyOtp,
  clearOtp,
  getOtpExpiryMinutes,
} from './otp';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * `db.delete().where()` is awaited directly in some paths and chained with
 * `.returning()` in others, so the mock has to satisfy both shapes.
 */
function mockDelete(returningValue: any[] = []) {
  const returning = vi.fn().mockResolvedValue(returningValue);
  const whereResult: any = Promise.resolve(returningValue);
  whereResult.returning = returning;
  const where = vi.fn().mockReturnValue(whereResult);
  (db.delete as any).mockReturnValue({ where });
  return { where, returning };
}

function mockInsert() {
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
  (db.insert as any).mockReturnValue({ values });
  return { values, onConflictDoUpdate };
}

describe('OTP Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateOtp', () => {
    it('returns a 6-digit numeric string by default', () => {
      for (let i = 0; i < 50; i++) {
        expect(generateOtp()).toMatch(/^\d{6}$/);
      }
    });

    it('respects a custom length', () => {
      expect(generateOtp(4)).toMatch(/^\d{4}$/);
      expect(generateOtp(8)).toMatch(/^\d{8}$/);
    });

    it('preserves leading zeros rather than dropping them', () => {
      // Force every byte to 0 so the code is all zeros; a numeric coercion
      // anywhere in the pipeline would collapse this to "0".
      const spy = vi
        .spyOn(globalThis.crypto, 'getRandomValues')
        .mockImplementation(((array: Uint8Array) => {
          array.fill(0);
          return array;
        }) as any);

      expect(generateOtp()).toBe('000000');
      spy.mockRestore();
    });
  });

  describe('storeOtp', () => {
    it('upserts on email so only one code is ever live per address', async () => {
      mockDelete();
      const { values, onConflictDoUpdate } = mockInsert();

      await storeOtp('user@test.com', '123456');

      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@test.com', code: '123456' }),
      );
      expect(onConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          target: 'email',
          set: expect.objectContaining({ code: '123456' }),
        }),
      );
    });

    it('normalizes the email to lowercase', async () => {
      mockDelete();
      const { values } = mockInsert();

      await storeOtp('USER@TEST.COM', '123456');

      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@test.com' }),
      );
    });

    it('sets expiry to the configured window', async () => {
      mockDelete();
      const { values } = mockInsert();

      const before = Date.now();
      await storeOtp('user@test.com', '123456');
      const after = Date.now();

      const { expires } = values.mock.calls[0]![0] as { expires: Date };
      const windowMs = getOtpExpiryMinutes() * 60 * 1000;
      expect(expires.getTime()).toBeGreaterThanOrEqual(before + windowMs - 1000);
      expect(expires.getTime()).toBeLessThanOrEqual(after + windowMs + 1000);
    });

    it('prunes expired rows so the table cannot grow without bound', async () => {
      const { where } = mockDelete();
      mockInsert();

      await storeOtp('user@test.com', '123456');

      expect(where).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'lt', a: 'expires' }),
      );
    });

    it('does not log the code in plaintext', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      mockDelete();
      mockInsert();

      await storeOtp('user@test.com', '123456');

      const allCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(allCalls).not.toContain('123456');
    });
  });

  describe('verifyOtp', () => {
    it('succeeds when the atomic delete consumes a row', async () => {
      mockDelete([{ email: 'user@test.com', code: '123456' }]);

      await expect(verifyOtp('user@test.com', '123456')).resolves.toEqual({
        ok: true,
      });
    });

    it('normalizes the email to lowercase', async () => {
      const { where } = mockDelete([{ email: 'user@test.com' }]);

      await verifyOtp('USER@TEST.COM', '123456');

      const condition = where.mock.calls[0]![0] as any;
      expect(condition.args).toContainEqual({
        type: 'eq',
        a: 'email',
        b: 'user@test.com',
      });
    });

    it('reports not_found when no code was ever issued', async () => {
      mockDelete([]);
      (db.query.otpCodes.findFirst as any).mockResolvedValue(undefined);

      await expect(verifyOtp('user@test.com', '123456')).resolves.toEqual({
        ok: false,
        reason: 'not_found',
      });
    });

    it('reports mismatch when a live code exists but differs', async () => {
      mockDelete([]);
      (db.query.otpCodes.findFirst as any).mockResolvedValue({
        email: 'user@test.com',
        code: '999999',
        expires: new Date(Date.now() + 60_000),
      });

      await expect(verifyOtp('user@test.com', '123456')).resolves.toEqual({
        ok: false,
        reason: 'mismatch',
      });
    });

    it('reports expired when the code matches but the row survived the delete', async () => {
      mockDelete([]);
      (db.query.otpCodes.findFirst as any).mockResolvedValue({
        email: 'user@test.com',
        code: '123456',
        expires: new Date(Date.now() - 60_000),
      });

      await expect(verifyOtp('user@test.com', '123456')).resolves.toEqual({
        ok: false,
        reason: 'expired',
      });
    });

    it('lets only one of two concurrent attempts succeed', async () => {
      let callCount = 0;
      const returning = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? [{ email: 'user@test.com' }] : []);
      });
      const where = vi.fn().mockReturnValue({ returning });
      (db.delete as any).mockReturnValue({ where });
      (db.query.otpCodes.findFirst as any).mockResolvedValue(undefined);

      const results = await Promise.all([
        verifyOtp('user@test.com', '123456'),
        verifyOtp('user@test.com', '123456'),
      ]);

      expect(results.filter((r) => r.ok)).toHaveLength(1);
    });
  });

  describe('clearOtp', () => {
    it('deletes the row for the normalized email', async () => {
      const { where } = mockDelete();

      await clearOtp('USER@TEST.COM');

      expect(where).toHaveBeenCalledWith({
        type: 'eq',
        a: 'email',
        b: 'user@test.com',
      });
    });
  });

  describe('getOtpExpiryMinutes', () => {
    it('returns the configured expiry window', () => {
      expect(getOtpExpiryMinutes()).toBe(60);
    });
  });
});
