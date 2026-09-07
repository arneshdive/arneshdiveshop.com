import type { StorageProvider, PutOptions } from './types';
import { vercelBlobProvider } from './vercel-blob';

export type { StorageProvider, PutOptions };

/**
 * Get the configured storage provider.
 *
 * Provider selection via STORAGE_PROVIDER env var:
 * - 'vercel-blob' (default when not set)
 * - 'r2' (reserved for Phase C, not implemented yet)
 *
 * Defaults to Vercel Blob when the env var is not set, maintaining existing
 * behavior on deploy and ensuring zero breaking changes to this phase.
 *
 * @throws {Error} if STORAGE_PROVIDER is set to an unknown provider
 */
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'vercel-blob';

  if (provider === 'vercel-blob') {
    return vercelBlobProvider;
  }

  throw new Error(`Unknown storage provider: ${provider}`);
}
