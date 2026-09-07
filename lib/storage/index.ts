import type { StorageProvider, PutOptions, PutBody, PutResult, HeadResult } from './types';

export type { StorageProvider, PutOptions, PutBody, PutResult, HeadResult };

// A value export, but a safe one: ./errors imports no storage SDK, so it does
// not undo the lazy loading below.
export { ObjectAlreadyExistsError } from './errors';

/**
 * Get the storage provider.
 *
 * Cloudflare R2 is the only one. There is deliberately no switch, no env var
 * and no fallback: a provider *choice* is what let a script write a state file
 * claiming 1,127 objects had been migrated while the destination bucket sat
 * empty, because the unset default quietly resolved to Vercel Blob. With one
 * provider that whole class of mistake cannot be expressed.
 *
 * Vercel Blob is not gone — every original is still there, and its store must
 * never be deleted, because the catalogue cannot be re-uploaded. It is simply
 * no longer written to, and no longer reachable from application code. Reading
 * the archive is done over its public URLs by the migration scripts, which need
 * no SDK.
 *
 * Still async and still a dynamic import: it keeps @aws-sdk/client-s3 out of
 * the module graph until something actually stores a file, which matters in
 * serverless bundles — the same class of problem sharp caused here twice.
 */
export async function getStorageProvider(): Promise<StorageProvider> {
  const { r2Provider } = await import('./r2');
  return r2Provider;
}
