import { describe, it, expect, afterEach, vi } from 'vitest';
import { getStorageProvider } from './index';
import { vercelBlobProvider } from './vercel-blob';

/**
 * `getStorageProvider()` is async so each provider's SDK can be loaded on
 * demand. The claim being tested is that the default path never touches
 * `@aws-sdk/client-s3` — the whole reason for the extra `await`. Bundling an
 * unused SDK into every function that merely imports `@/lib/storage` is the
 * mistake `sharp` already made twice in this project.
 *
 * Method: a mock factory that flags the module as having been evaluated, then
 * hands back the real module. The flag flips the moment anything actually
 * loads the SDK — a static `import` added to index.ts, a top-level import in
 * something index.ts pulls in, an eager cache-the-client refactor — so
 * laziness is observed rather than assumed. Note this file deliberately does
 * not import `./r2` itself.
 *
 * The tests run in order within the file, and the last one proves the flag is
 * really wired, so the earlier assertions are not vacuous.
 */
vi.mock('@aws-sdk/client-s3', async () => {
  (globalThis as Record<string, unknown>).__awsSdkEvaluated = true;
  return await vi.importActual<typeof import('@aws-sdk/client-s3')>(
    '@aws-sdk/client-s3'
  );
});

function awsSdkEvaluated(): boolean {
  return (globalThis as Record<string, unknown>).__awsSdkEvaluated === true;
}

describe('provider loading', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolves the Vercel Blob provider without loading the AWS SDK', async () => {
    vi.stubEnv('STORAGE_PROVIDER', undefined);

    await expect(getStorageProvider()).resolves.toBe(vercelBlobProvider);
    expect(awsSdkEvaluated()).toBe(false);
  });

  it('does not load the AWS SDK to reject a misconfigured provider either', async () => {
    vi.stubEnv('STORAGE_PROVIDER', 'cloudflare-r2');

    await expect(getStorageProvider()).rejects.toThrow(/Misconfigured STORAGE_PROVIDER/);
    expect(awsSdkEvaluated()).toBe(false);
  });

  it('loads the AWS SDK when — and only when — R2 is selected', async () => {
    vi.stubEnv('STORAGE_PROVIDER', 'r2');

    const provider = await getStorageProvider();

    expect(provider).not.toBe(vercelBlobProvider);
    expect(awsSdkEvaluated()).toBe(true);
  });
});
