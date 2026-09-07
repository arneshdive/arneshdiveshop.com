import type { StorageProvider, PutOptions, PutBody, PutResult } from './types';
import { vercelBlobProvider } from './vercel-blob';

export type { StorageProvider, PutOptions, PutBody, PutResult };

/**
 * Get the configured storage provider.
 *
 * Provider selection via STORAGE_PROVIDER env var:
 * - 'vercel-blob' (default when not set or empty)
 * - 'r2' (reserved for Phase C, not implemented yet — throws today)
 *
 * Defaults to Vercel Blob when the env var is not set, maintaining existing
 * behavior on deploy and ensuring zero breaking changes to this phase.
 *
 * Read per call rather than memoised: this is a plain runtime property lookup
 * (only NEXT_PUBLIC_* vars are inlined at build time), it happens a handful of
 * times per upload against three network writes, and keeping it live means the
 * Phase C cutover is an env var change rather than a redeploy.
 *
 * An unrecognised value throws instead of falling back. A fallback would mean a
 * typo in the cutover ('R2', 'cloudflare-r2') silently kept writing to the
 * store this work exists to stop writing to, and the operator would not find
 * out until they went looking. The message is developer-facing and lands in the
 * server log; the upload route turns any throw into its own Indonesian error
 * for the admin.
 *
 * @throws {Error} if STORAGE_PROVIDER is set to an unknown provider
 */
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'vercel-blob';

  if (provider === 'vercel-blob') {
    return vercelBlobProvider;
  }

  throw new Error(
    `Misconfigured STORAGE_PROVIDER: ${provider}. Supported: 'vercel-blob' (default).`
  );
}
