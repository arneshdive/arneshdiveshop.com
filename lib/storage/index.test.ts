import { describe, it, expect, afterEach, vi } from 'vitest';
import { getStorageProvider } from './index';
import { r2Provider } from './r2';

/**
 * R2 is the only storage provider, and these pin that there is no way back.
 *
 * The reason this matters is a bug that nearly shipped: while a choice existed,
 * an unset `STORAGE_PROVIDER` resolved to Vercel Blob, and a migration script
 * run without the env prefix reported 1,127 objects successfully migrated with
 * the destination bucket completely empty. Removing the choice removes that
 * whole class of failure — but only if a leftover value cannot revive it.
 *
 * So the case that matters most here is `STORAGE_PROVIDER=vercel-blob`: a stale
 * entry in some environment, or an old `.env` on a laptop, must be inert rather
 * than resurrecting writes to a store this project has stopped writing to.
 *
 * Assertions are identity (`toBe`), never shape. "It has a put and a head"
 * passes just as happily for the wrong provider.
 */
describe('getStorageProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the R2 provider', async () => {
    await expect(getStorageProvider()).resolves.toBe(r2Provider);
  });

  it('ignores a stale STORAGE_PROVIDER rather than honouring it', async () => {
    for (const value of ['vercel-blob', 'blob', 'r2', 'R2', 's3', '']) {
      vi.stubEnv('STORAGE_PROVIDER', value);
      await expect(getStorageProvider()).resolves.toBe(r2Provider);
    }
  });

  it('exposes no way to obtain any other provider', async () => {
    const storage = await import('./index');
    const exported = Object.keys(storage);
    expect(exported).not.toContain('vercelBlobProvider');
    expect(exported).toEqual(
      expect.arrayContaining(['getStorageProvider', 'ObjectAlreadyExistsError']),
    );
  });
});
