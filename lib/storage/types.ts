/**
 * Storage provider interface for product images.
 *
 * This abstraction allows swapping storage backends (Vercel Blob, R2, etc.)
 * without changing the application logic. It mirrors the PaymentProvider
 * pattern used elsewhere in the codebase.
 */

export interface PutOptions {
  /** Storage path/key for the object (e.g., 'products/v2/12345-abc.webp') */
  path: string;

  /** File body to store */
  body: File;

  /** MIME type of the file (e.g., 'image/webp', 'image/jpeg') */
  contentType: string;

  /** Cache lifetime in seconds (e.g., 30 days = 2592000) */
  cacheControlMaxAge: number;
}

export interface StorageProvider {
  /**
   * Store a new object at a unique path, refusing overwrites.
   *
   * WRITE-ONCE CONTRACT: This operation MUST refuse to overwrite an existing
   * object. This is a safety feature protecting against accidental data loss.
   * Callers may rely on this guarantee — if `put()` succeeds, the path did not
   * previously exist, and if it fails, the existing object at that path is untouched.
   *
   * IMPLEMENTATION NOTES:
   * - Vercel Blob enforces this via the `allowOverwrite: false` option.
   * - S3-compatible providers (e.g., Cloudflare R2) overwrite silently by default
   *   and require conditional writes (`If-None-Match: *`) to honor this contract.
   *   Phase C will implement this requirement before using R2 in production.
   *
   * @param options Path, file, content type, and cache control settings
   * @returns Promise resolving to { url } — the public URL of the stored object
   */
  put(options: PutOptions): Promise<{ url: string }>;
}
