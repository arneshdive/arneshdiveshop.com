import { put as blobPut, head as blobHead, BlobNotFoundError } from '@vercel/blob';
import type { StorageProvider, PutOptions, PutBody, HeadResult } from './types';

/**
 * The SDK's `PutBody` union accepts `Buffer` but not a plain `Uint8Array`, so
 * raw bytes are wrapped in a Buffer view over the *same* memory —
 * `Buffer.from(buffer, byteOffset, byteLength)` does not copy, and honouring
 * the offset matters because a `Uint8Array` may be a window onto a larger
 * ArrayBuffer. A Blob (which is what the upload route always has) is passed
 * straight through.
 */
function toBlobBody(body: PutBody) {
  if (body instanceof Uint8Array) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }
  return body;
}

/**
 * Vercel Blob storage implementation.
 *
 * Wraps the @vercel/blob SDK's put() function, preserving all the options
 * needed to satisfy the storage interface contract:
 * - allowOverwrite: false — enforces write-once semantics
 * - access: 'public' — makes objects publicly readable
 * - cacheControlMaxAge — explicitly sets cache lifetime for immutable content
 *
 * `access` and `allowOverwrite` are fixed here and are not read from the
 * caller's options, so no caller can relax either one.
 */
export const vercelBlobProvider: StorageProvider = {
  async put(options: PutOptions) {
    const result = await blobPut(options.path, toBlobBody(options.body), {
      access: 'public',
      contentType: options.contentType,
      allowOverwrite: false,
      cacheControlMaxAge: options.cacheControlMaxAge,
    });

    // `url` is the inline URL. `result.downloadUrl` is a different URL that
    // sets Content-Disposition: attachment, so it must never be what gets
    // stored on a product — an <img> pointed at it downloads a file instead of
    // rendering.
    return { url: result.url, etag: result.etag };
  },

  /**
   * `null` means "the store answered, and there is nothing at this path".
   *
   * Only `BlobNotFoundError` means that. Every other failure propagates, and
   * the distinction is the whole point: this project's incident was an
   * exhausted operations quota, where the store answers `403` on reads. The
   * SDK maps that to `BlobAccessError`, throttling to
   * `BlobServiceRateLimited`, suspension to `BlobStoreSuspendedError` — and a
   * bare `catch { return null }` turned all of them into "not stored".
   *
   * Phase D decides what is left to copy by asking `head()`. Reported as
   * "nothing is there", a throttled store would send the migration off to
   * re-copy all ~2,900 objects, spending the exact quota that caused the
   * incident. Loud failure is the cheap outcome here.
   */
  async head(path: string): Promise<HeadResult | null> {
    try {
      const result = await blobHead(path);
      return {
        etag: result.etag,
        size: result.size,
      };
    } catch (error) {
      if (error instanceof BlobNotFoundError) {
        return null;
      }
      throw error;
    }
  },
};
