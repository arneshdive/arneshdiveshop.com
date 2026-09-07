/**
 * Storage provider interface for product images.
 *
 * This abstraction allows swapping storage backends (Vercel Blob, R2, etc.)
 * without changing the application logic. It mirrors the PaymentProvider
 * pattern in lib/payment/.
 *
 * There is deliberately no delete, copy, rename or overwrite operation. The
 * catalogue cannot be re-uploaded and there is no copy of the bytes outside
 * storage, so the destructive call is left unrepresentable rather than merely
 * discouraged. Adding one to this interface is a review blocker.
 */

/**
 * Bytes to store.
 *
 * `Blob` covers the upload route, which holds a `File` (a Blob) straight off
 * the multipart form — it is forwarded untouched, with no copy.
 *
 * `Uint8Array` covers the Phase D migration pass, which holds bytes from a
 * `fetch()` and from `sharp` (a `Buffer` is a `Uint8Array`). The migration is
 * the phase that performs thousands of writes against a store that overwrites
 * silently, so it is exactly the code that must go through this interface
 * rather than around it — hence the union, rather than making the script wrap
 * raw bytes in a fake `File` just to satisfy a type.
 *
 * Streams are deliberately excluded. Vercel Blob accepts them, but an
 * S3 `PutObject` needs an explicit `ContentLength` for a stream body, and both
 * the route (a few hundred KB) and the migration (a few MB) already hold the
 * whole object in memory, so a stream would buy nothing and cost an
 * asymmetry between providers.
 */
export type PutBody = Blob | Uint8Array;

export interface PutOptions {
  /** Storage path/key for the object (e.g., 'products/v2/12345-abc.webp') */
  path: string;

  /** Bytes to store */
  body: PutBody;

  /** MIME type of the file (e.g., 'image/webp', 'image/jpeg') */
  contentType: string;

  /** Cache lifetime in seconds (e.g., 30 days = 2592000) */
  cacheControlMaxAge: number;
}

export interface PutResult {
  /** Public URL the object is served from. */
  url: string;

  /**
   * The store's entity tag for the bytes just written.
   *
   * Required, not optional: the Phase D migration must verify every copied
   * object, and the measured baseline established that `last-modified` is the
   * CDN fill time here, so the etag is the only trustworthy validator. Both
   * providers hand it back on the write itself (`PutBlobResult.etag`, and
   * S3's `PutObject` response `ETag`, which is the MD5 for a non-multipart
   * upload), so requiring it costs nothing and saves the migration a second
   * request per object against a store whose operation quota is the reason
   * this plan exists.
   */
  etag: string;
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
   * The guarantee belongs to the implementation, not the caller: `PutOptions`
   * exposes no way to relax it, and an implementation must not read one from
   * the options object.
   *
   * IMPLEMENTATION NOTES:
   * - Vercel Blob enforces this via the `allowOverwrite: false` option.
   * - S3-compatible providers (e.g., Cloudflare R2) overwrite silently by default
   *   and require conditional writes (`If-None-Match: *`) to honor this contract.
   *   Measured against the real bucket on 2026-09-07: an unconditional
   *   `PutObject` to an existing key replaced its contents with no error, and
   *   the same call with `IfNoneMatch: '*'` was rejected with HTTP 412
   *   `PreconditionFailed` leaving the original bytes intact. A missing
   *   `IfNoneMatch` on any R2 write is therefore a review blocker, and Phase C
   *   must implement it before R2 is used in production.
   *
   * @param options Path, bytes, content type, and cache control settings
   * @returns Promise resolving to the object's public URL and etag
   */
  put(options: PutOptions): Promise<PutResult>;
}
