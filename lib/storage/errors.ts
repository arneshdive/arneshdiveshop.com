/**
 * Errors the storage interface itself defines, so a caller can react to the
 * write-once contract being enforced without knowing which provider is
 * configured.
 *
 * These live in their own module rather than in a provider, so importing them
 * pulls in neither `@vercel/blob` nor `@aws-sdk/client-s3`.
 */

/**
 * Thrown by `put()` when the path already holds an object, i.e. the write-once
 * contract refused the write. The existing bytes are untouched.
 *
 * A distinct, exported class rather than a message match: the Phase D migration
 * has to tell "this object is already there, move on" apart from "the store
 * rejected me" — the second must fail the entry, the first must not — and a
 * throttled or misconfigured store must never be mistaken for a completed copy.
 *
 * Provider coverage, and the asymmetry to close before Phase D:
 * - R2 raises this on HTTP 412 `PreconditionFailed`, which is what
 *   `IfNoneMatch: '*'` produces. Verified against the SDK's real error shape.
 * - Vercel Blob's refusal (`allowOverwrite: false` against an existing
 *   pathname) arrives as a plain `BlobError` carrying a server-authored
 *   message, with no distinct class and no error code of its own. Recognising
 *   it would mean matching that string, and the string cannot be observed
 *   without writing to the live store — which this project does not do. So the
 *   Blob adapter deliberately does NOT map it and rethrows the SDK error
 *   unchanged. Phase D writes only to R2, so nothing depends on the Blob side
 *   today; if that ever changes, measure the error first, then map it here.
 */
export class ObjectAlreadyExistsError extends Error {
  readonly name = 'ObjectAlreadyExistsError';

  /** Storage path that was refused. */
  readonly path: string;

  constructor(path: string, options?: { cause?: unknown }) {
    super(
      `Refused to overwrite an existing object at ${path}. Storage is write-once.`,
      options
    );
    this.path = path;
  }
}
