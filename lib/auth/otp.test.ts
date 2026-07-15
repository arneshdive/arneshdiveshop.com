import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env before any imports
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');

// Mock drizzle-orm functions first (hoisted automatically)
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn((a: unknown, b: unknown) => ({ type: 'eq', a, b })),
    and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
    gt: vi.fn((a: unknown, b: unknown) => ({ type: 'gt', a, b })),
  };
});

// Mock the database completely
vi.mock('@/lib/db', () => ({
  db: {
    delete: vi.fn(),
    insert: vi.fn(),
    query: {
      verificationTokens: {
        findFirst: vi.fn(),
      },
    },
  },
  // Re-export schema types
  verificationTokens: {
    identifier: 'identifier',
    token: 'token',
    expires: 'expires',
  },
  users: {},
  customers: {},
}));

// Now import after mocks are set up
import { db } from '@/lib/db';
import {
  storeOtp,
  verifyAndDeleteOtp,
  getOtpExpiryMinutes,
} from './otp';

describe('OTP Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to setup db mocks for storeOtp
  function mockStoreOtp() {
    const mockReturning = vi.fn().mockResolvedValue([{}]);
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
    (db.delete as any).mockReturnValue({ where: mockWhere });
    
    const mockValuesReturning = vi.fn().mockResolvedValue([{}]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockValuesReturning });
    (db.insert as any).mockReturnValue({ values: mockValues });
    
    return { mockWhere, mockValues, mockReturning, mockValuesReturning };
  }

  describe('Token Purpose Prefixing', () => {
    it('stores OTP with prefixed identifier for login purpose', async () => {
      const { mockWhere } = mockStoreOtp();

      await storeOtp('user@test.com', '123456', 'login');

      // Verify delete was called with login-prefixed identifier
      expect(mockWhere.mock.calls[0]).toBeDefined();
      const whereCondition = mockWhere.mock.calls[0]![0];
      expect(whereCondition).toEqual({ type: 'eq', a: 'identifier', b: 'login:user@test.com' });
    });

    it('stores OTP with prefixed identifier for register purpose', async () => {
      const { mockWhere } = mockStoreOtp();

      await storeOtp('user@test.com', '123456', 'register');

      expect(mockWhere.mock.calls[0]).toBeDefined();
      const whereCondition = mockWhere.mock.calls[0]![0];
      expect(whereCondition).toEqual({ type: 'eq', a: 'identifier', b: 'register:user@test.com' });
    });

    it('stores OTP with prefixed identifier for verify purpose', async () => {
      const { mockWhere } = mockStoreOtp();

      await storeOtp('user@test.com', '123456', 'verify');

      expect(mockWhere.mock.calls[0]).toBeDefined();
      const whereCondition = mockWhere.mock.calls[0]![0];
      expect(whereCondition).toEqual({ type: 'eq', a: 'identifier', b: 'verify:user@test.com' });
    });

    it('normalizes email to lowercase in identifier', async () => {
      const { mockWhere } = mockStoreOtp();

      await storeOtp('USER@TEST.COM', '123456', 'login');

      expect(mockWhere.mock.calls[0]).toBeDefined();
      const whereCondition = mockWhere.mock.calls[0]![0];
      expect(whereCondition).toEqual({ type: 'eq', a: 'identifier', b: 'login:user@test.com' });
    });
  });

  describe('Multiple Purposes Do Not Collide', () => {
    it('allows separate OTPs for login and verify purposes on same email', async () => {
      const deletedIdentifiers: string[] = [];
      const insertedData: any[] = [];

      // Mock delete to track identifiers
      const mockDeleteWhere = vi.fn().mockImplementation((condition: any) => {
        deletedIdentifiers.push(condition.b);
        return {};
      });
      (db.delete as any).mockReturnValue({ where: mockDeleteWhere });

      // Mock insert to track data
      const mockValues = vi.fn().mockImplementation((data: any) => {
        insertedData.push(data);
        return { returning: vi.fn().mockResolvedValue([{}]) };
      });
      (db.insert as any).mockReturnValue({ values: mockValues });

      await storeOtp('user@test.com', '111111', 'login');
      await storeOtp('user@test.com', '222222', 'verify');

      // Each should have deleted only its own purpose's identifier
      expect(deletedIdentifiers).toContain('login:user@test.com');
      expect(deletedIdentifiers).toContain('verify:user@test.com');

      // Each should have inserted with correct identifiers
      expect(insertedData.find(d => d.identifier === 'login:user@test.com')).toBeDefined();
      expect(insertedData.find(d => d.identifier === 'verify:user@test.com')).toBeDefined();
    });
  });

  describe('verifyAndDeleteOtp Atomic Operation', () => {
    it('returns true and deletes when OTP matches', async () => {
      const mockDeleted = [{ identifier: 'login:user@test.com', token: '123456' }];
      const mockReturning = vi.fn().mockResolvedValue(mockDeleted);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.delete as any).mockReturnValue({ where: mockWhere });

      const result = await verifyAndDeleteOtp('user@test.com', '123456', 'login');

      expect(result).toBe(true);
      expect((db.delete as any)).toHaveBeenCalled();
    });

    it('returns false when no matching OTP found', async () => {
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.delete as any).mockReturnValue({ where: mockWhere });

      const result = await verifyAndDeleteOtp('user@test.com', '999999', 'login');

      expect(result).toBe(false);
    });

    it('fails when purpose does not match', async () => {
      // OTP was stored with 'login' purpose, trying to verify with 'register'
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.delete as any).mockReturnValue({ where: mockWhere });

      const result = await verifyAndDeleteOtp('user@test.com', '123456', 'register');

      expect(result).toBe(false);
      // The where clause should use 'register:user@test.com'
      expect(mockWhere.mock.calls[0]).toBeDefined();
      const whereCondition = mockWhere.mock.calls[0]![0];
      expect(whereCondition.type).toBe('and');
    });

    it('handles race condition - only one concurrent request succeeds', async () => {
      // First call returns the token, second returns empty
      let callCount = 0;
      const mockReturning = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([{ identifier: 'login:user@test.com' }]);
        }
        return Promise.resolve([]);
      });
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.delete as any).mockReturnValue({ where: mockWhere });

      // Simulate two concurrent verification attempts
      const [result1, result2] = await Promise.all([
        verifyAndDeleteOtp('user@test.com', '123456', 'login'),
        verifyAndDeleteOtp('user@test.com', '123456', 'login'),
      ]);

      // Exactly one should succeed
      const successCount = [result1, result2].filter(Boolean).length;
      expect(successCount).toBe(1);
    });
  });

  describe('OTP Replacement for Same Purpose', () => {
    it('new OTP replaces old OTP of same purpose', async () => {
      const deletedIdentifiers: string[] = [];
      const insertedTokens: string[] = [];

      const mockWhere = vi.fn().mockImplementation((condition: any) => {
        deletedIdentifiers.push(condition.b);
        return {};
      });
      (db.delete as any).mockReturnValue({ where: mockWhere });

      const mockValues = vi.fn().mockImplementation((data: any) => {
        insertedTokens.push(data.token);
        return { returning: vi.fn().mockResolvedValue([{}]) };
      });
      (db.insert as any).mockReturnValue({ values: mockValues });

      await storeOtp('user@test.com', '111111', 'login');
      await storeOtp('user@test.com', '222222', 'login');

      // Should have deleted with login prefix twice (once before each insert)
      expect(deletedIdentifiers.filter(id => id === 'login:user@test.com')).toHaveLength(2);
      
      // Should have inserted both tokens
      expect(insertedTokens).toEqual(['111111', '222222']);
    });
  });

  describe('Security', () => {
    it('does not log OTP in plaintext', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      mockStoreOtp();

      await storeOtp('user@test.com', '123456', 'login');

      // Check that OTP is not in any console.log output
      const allCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(allCalls).not.toContain('123456');

      consoleSpy.mockRestore();
    });
  });

  describe('getOtpExpiryMinutes', () => {
    it('returns the configured expiry time', () => {
      const expiry = getOtpExpiryMinutes();
      expect(typeof expiry).toBe('number');
      expect(expiry).toBeGreaterThan(0);
    });
  });
});
