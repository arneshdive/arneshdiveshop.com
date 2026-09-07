import type { StorageProvider, PutOptions, PutBody, PutResult, HeadResult } from './types';

export type { StorageProvider, PutOptions, PutBody, PutResult, HeadResult };

// A value export, but a safe one: ./errors imports neither storage SDK, so it
// does not undo the lazy loading below.
export { ObjectAlreadyExistsError } from './errors';

/**
 * Get the configured storage provider.
 *
 * Provider selection via STORAGE_PROVIDER env var:
 * - 'vercel-blob' (default when not set or empty)
 * - 'r2' (Cloudflare R2, lazy-loaded to avoid bundling the AWS SDK)
 *
 * Defaults to Vercel Blob when the env var is not set, maintaining existing
 * behavior on deploy and ensuring zero breaking changes to this phase.
 *
 * Provider is loaded dynamically (lazy import) so a provider's SDK is only
 * bundled into serverless functions that use it. This avoids pulling
 * @aws-sdk/client-s3 into every function when the default is Vercel Blob.
 * See next.config.ts for the precedent (sharp was traced as an externality
 * affecting bundle size).
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
export async function getStorageProvider(): Promise<StorageProvider> {
  const provider = process.env.STORAGE_PROVIDER || 'vercel-blob';

  if (provider === 'vercel-blob') {
    const { vercelBlobProvider } = await import('./vercel-blob');
    return vercelBlobProvider;
  }

  if (provider === 'r2') {
    const { r2Provider } = await import('./r2');
    return r2Provider;
  }

  throw new Error(
    `Misconfigured STORAGE_PROVIDER: ${provider}. Supported values: 'vercel-blob' (default), 'r2'.`
  );
}
