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

  it('defaults to Vercel Blob when STORAGE_PROVIDER is unset', async () => {
    vi.stubEnv('STORAGE_PROVIDER', undefined);
    const provider = await getStorageProvider();
    expect(provider).toBe(vercelBlobProvider);
  });

  it('defaults to Vercel Blob when STORAGE_PROVIDER is empty', async () => {
    vi.stubEnv('STORAGE_PROVIDER', '');
    const provider = await getStorageProvider();
    expect(provider).toBe(vercelBlobProvider);
  });

  it('returns Vercel Blob when asked for it explicitly', async () => {
    vi.stubEnv('STORAGE_PROVIDER', 'vercel-blob');
    const provider = await getStorageProvider();
    expect(provider).toBe(vercelBlobProvider);
  });

  it('returns R2 provider when asked for it', async () => {
    // Phase C implementation: R2 provider is now available
    vi.stubEnv('STORAGE_PROVIDER', 'r2');
    const provider = await getStorageProvider();
    // Provider has both put and head methods
    expect(provider).toHaveProperty('put');
    expect(provider).toHaveProperty('head');
  });

  it('throws on a typo, naming the offending value', async () => {
    vi.stubEnv('STORAGE_PROVIDER', 'R2');
    await expect(getStorageProvider()).rejects.toThrow(/STORAGE_PROVIDER: R2/);
  });
});
