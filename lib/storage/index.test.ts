import { describe, it, expect, afterEach, vi } from 'vitest';
import { getStorageProvider } from './index';
import { vercelBlobProvider } from './vercel-blob';
import { r2Provider } from './r2';

/**
 * Provider selection is the whole cutover mechanism for Phase C, and the
 * failure mode that matters is the quiet one: a mistyped value falling back to
 * Vercel Blob would keep writing to the store this work exists to leave, with
 * nothing in the logs to say so. These pin both halves.
 *
 * Every assertion is identity (`toBe`), never shape. A duck-typed check —
 * "the thing it returned has a put and a head" — passes just as happily when
 * 'r2' hands back the Vercel Blob provider, which is precisely the bug that
 * would make the cutover a no-op while looking like it worked.
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

  it('returns the R2 provider when asked for it', async () => {
    vi.stubEnv('STORAGE_PROVIDER', 'r2');
    const provider = await getStorageProvider();
    expect(provider).toBe(r2Provider);
    expect(provider).not.toBe(vercelBlobProvider);
  });

  it('throws on a typo, naming the offending value', async () => {
    vi.stubEnv('STORAGE_PROVIDER', 'R2');
    await expect(getStorageProvider()).rejects.toThrow(/STORAGE_PROVIDER: R2/);
  });

  it('throws rather than falling back on any other unknown value', async () => {
    for (const value of ['cloudflare-r2', 'blob', 's3', ' r2']) {
      vi.stubEnv('STORAGE_PROVIDER', value);
      await expect(getStorageProvider()).rejects.toThrow(/Misconfigured STORAGE_PROVIDER/);
    }
  });
});
