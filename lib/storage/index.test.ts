import { describe, it, expect, afterEach, vi } from 'vitest';
import { getStorageProvider } from './index';
import { vercelBlobProvider } from './vercel-blob';

/**
 * Provider selection is the whole cutover mechanism for Phase C, and the
 * failure mode that matters is the quiet one: a mistyped value falling back to
 * Vercel Blob would keep writing to the store this work exists to leave, with
 * nothing in the logs to say so. These pin both halves.
 */
describe('getStorageProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to Vercel Blob when STORAGE_PROVIDER is unset', () => {
    vi.stubEnv('STORAGE_PROVIDER', undefined);
    expect(getStorageProvider()).toBe(vercelBlobProvider);
  });

  it('defaults to Vercel Blob when STORAGE_PROVIDER is empty', () => {
    vi.stubEnv('STORAGE_PROVIDER', '');
    expect(getStorageProvider()).toBe(vercelBlobProvider);
  });

  it('returns Vercel Blob when asked for it explicitly', () => {
    vi.stubEnv('STORAGE_PROVIDER', 'vercel-blob');
    expect(getStorageProvider()).toBe(vercelBlobProvider);
  });

  it('throws rather than silently writing to Blob when asked for r2', () => {
    // Reserved but not implemented until Phase C. Someone flipping the env var
    // early must get a failed upload, not a successful write to the old store.
    vi.stubEnv('STORAGE_PROVIDER', 'r2');
    expect(() => getStorageProvider()).toThrow(/STORAGE_PROVIDER: r2/);
  });

  it('throws on a typo, naming the offending value', () => {
    vi.stubEnv('STORAGE_PROVIDER', 'R2');
    expect(() => getStorageProvider()).toThrow(/STORAGE_PROVIDER: R2/);
  });
});
