import { describe, it, expect, vi } from 'vitest';
import { getStorageProvider } from './index';

/**
 * `getStorageProvider()` is async so the AWS SDK loads on demand rather than
 * whenever something imports `@/lib/storage`. That distinction is the entire
 * reason for the extra `await`, and it is easy to destroy accidentally: one
 * static `import { S3Client } from '@aws-sdk/client-s3'` at the top of
 * index.ts, or an eager module-level client, and every serverless function
 * touching this module carries the SDK. `sharp` cost this project two
 * deployments over the same mistake.
 *
 * Method: a mock factory that records the moment the module is evaluated, then
 * hands back the real one. The flag flips on real evaluation, so laziness is
 * observed rather than assumed. This file deliberately does not import `./r2`.
 *
 * The tests run in file order, and the second proves the flag is genuinely
 * wired, so the first is not vacuously true.
 */
vi.mock('@aws-sdk/client-s3', async () => {
  (globalThis as Record<string, unknown>).__awsSdkEvaluated = true;
  return await vi.importActual<typeof import('@aws-sdk/client-s3')>('@aws-sdk/client-s3');
});

function awsSdkEvaluated(): boolean {
  return (globalThis as Record<string, unknown>).__awsSdkEvaluated === true;
}

describe('provider loading', () => {
  it('does not load the AWS SDK merely by importing @/lib/storage', () => {
    // `getStorageProvider` is imported at the top of this file and has not been
    // called yet.
    expect(typeof getStorageProvider).toBe('function');
    expect(awsSdkEvaluated()).toBe(false);
  });

  it('loads the AWS SDK once the provider is actually requested', async () => {
    await getStorageProvider();
    expect(awsSdkEvaluated()).toBe(true);
  });
});
