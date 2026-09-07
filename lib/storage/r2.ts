import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  NotFound,
  NoSuchKey,
} from '@aws-sdk/client-s3';
import type { StorageProvider, PutOptions, HeadResult } from './types';
import { ObjectAlreadyExistsError } from './errors';

/**
 * The subset of an AWS SDK error this module reads.
 *
 * Measured against the real SDK (v3, schema protocol) by serving canned HTTP
 * responses to an S3Client on localhost — the shapes below are observed, not
 * assumed, because a mock is otherwise free to invent a shape the SDK never
 * produces:
 *
 * | response                          | ctor                | name                 | Code                 | status |
 * | --------------------------------- | ------------------- | -------------------- | -------------------- | ------ |
 * | HEAD 404, empty body              | NotFound            | 'NotFound'           | —                    | 404    |
 * | HEAD 403, empty body              | S3ServiceException  | 'Unknown'            | —                    | 403    |
 * | HEAD 403, `<Code>AccessDenied`    | S3ServiceException  | 'Unknown'            | —                    | 403    |
 * | HEAD 429, empty body              | S3ServiceException  | 'Unknown'            | —                    | 429    |
 * | PUT 412, `<Code>PreconditionFailed` | S3ServiceException | 'PreconditionFailed' | 'PreconditionFailed' | 412    |
 * | PUT 412, empty body               | S3ServiceException  | 'Unknown'            | —                    | 412    |
 * | PUT 403, `<Code>AccessDenied`     | AccessDenied        | 'AccessDenied'       | 'AccessDenied'       | 403    |
 *
 * Two things follow. `name` is the field the SDK itself keys on (its own
 * `waitUntilObjectNotExists` waiter tests `exception.name === 'NotFound'`), so
 * it is checked first. And an error code is not always available: R2 may answer
 * a conditional write with a bodyless 412, which carries no code at all, so the
 * status code has to be part of the test.
 */
type S3ErrorLike = {
  name?: string;
  Code?: string;
  $metadata?: { httpStatusCode?: number };
};

/** Error names that mean "the object is not there", and nothing else. */
const ABSENT_NAMES = new Set(['NotFound', 'NoSuchKey']);

/**
 * True only when the store said the object does not exist.
 *
 * Deliberately narrow. A 403 (the exhausted-quota / bad-credentials case), a
 * 429, a 5xx and a network error must all propagate: the Phase D migration
 * decides what still needs copying by asking `head()`, so an error reported as
 * "absent" would make a throttled store look like an empty one and send the
 * script off to re-copy everything.
 *
 * `NoSuchBucket` is a 404 too, and must NOT read as an absent object — a typo
 * in `R2_BUCKET_NAME` would otherwise report every key as missing. It arrives
 * named, so the bodyless-404 fallback below cannot catch it.
 */
function isObjectAbsent(error: unknown): boolean {
  if (error instanceof NotFound || error instanceof NoSuchKey) return true;

  const err = error as S3ErrorLike | null | undefined;
  const code = err?.name ?? err?.Code;
  if (code && ABSENT_NAMES.has(code)) return true;

  // A 404 the SDK could not attach a code to. S3/R2 answer a missing key on
  // HeadObject with an empty body, and while this SDK does model that as
  // `NotFound`, the `instanceof` above is only sound while exactly one copy of
  // @aws-sdk/client-s3 is installed. This is the belt to that braces.
  const status = err?.$metadata?.httpStatusCode;
  return status === 404 && (!code || code === 'Unknown');
}

/**
 * True when a conditional write was refused because the key already exists.
 * `IfNoneMatch: '*'` is the only condition this module ever sends, so a 412
 * cannot mean anything else.
 */
function isPreconditionFailed(error: unknown): boolean {
  const err = error as S3ErrorLike | null | undefined;
  return (
    err?.name === 'PreconditionFailed' ||
    err?.Code === 'PreconditionFailed' ||
    err?.$metadata?.httpStatusCode === 412
  );
}

/**
 * S3 returns the etag wrapped in double quotes (`"d41d8..."`). Phase D compares
 * it against a locally computed MD5, so the quotes come off here.
 *
 * Note this normalisation makes the two providers' etags differently shaped:
 * `@vercel/blob` hands back its own etag *with* quotes, and the plan already
 * warns the two stores' etags are not necessarily comparable to each other
 * anyway. Compare an R2 etag to a locally computed MD5, never to a Blob etag.
 */
function stripQuotes(etag: string | undefined): string {
  return etag?.replace(/^"(.*)"$/, '$1') ?? '';
}

/**
 * Verifies that all required R2 environment variables are set and returns
 * a configured S3 client for Cloudflare R2.
 *
 * @throws {Error} if any required R2 env var is missing, naming it clearly
 */
function getR2Client(): S3Client {
  // R2_ACCOUNT_ID is not read below — the endpoint is given in full by
  // R2_S3_ENDPOINT — but it is required anyway so a half-populated
  // environment fails at the first upload with a named variable instead of
  // part-working. Keep this list and .env.example in step.
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_S3_ENDPOINT',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required R2 configuration: ${key}`);
    }
  }

  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_S3_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Cloudflare R2 storage implementation.
 *
 * Uses the S3-compatible API with the critical `IfNoneMatch: '*'` condition
 * on every write to enforce write-once semantics. S3-compatible providers
 * (including R2) overwrite silently by default — omitting this condition
 * is a data-loss bug (reviewed 2026-09-07 against the live bucket).
 *
 * The public URL is constructed from R2_PUBLIC_URL (the custom domain or the
 * public subdomain) and the object path.
 *
 * The command inputs below are intentionally NOT cast to
 * `PutObjectCommandInput` / `HeadObjectCommandInput`. A cast on an object
 * literal switches off excess-property checking, which would let `IfNonMatch`
 * — one transposed letter — compile, ship, and silently drop the only thing
 * standing between the migration and an overwritten catalogue. Passing the
 * literal straight to the command constructor makes the compiler check the
 * field names.
 */
export const r2Provider: StorageProvider = {
  async put(options: PutOptions) {
    const client = getR2Client();

    // Convert body to bytes. A Uint8Array is forwarded as-is: it may be a
    // window onto a larger ArrayBuffer (what `Buffer.subarray` and sharp's
    // output look like) and the SDK honours byteOffset/byteLength — verified
    // on the wire against a real S3Client.
    let body: Uint8Array;
    if (options.body instanceof Blob) {
      body = new Uint8Array(await options.body.arrayBuffer());
    } else {
      body = options.body;
    }

    try {
      const result = await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: options.path,
          Body: body,
          ContentType: options.contentType,
          ContentLength: body.byteLength,
          // Honours the caller's lifetime rather than hardcoding one, so both
          // providers age an object identically and one constant in the upload
          // route still governs both. `immutable` is added because every path
          // this interface writes is unique and can never be rewritten — the
          // measured baseline noted its absence as the reason browsers
          // revalidate images that can never have changed.
          CacheControl: `public, max-age=${options.cacheControlMaxAge}, immutable`,
          // IfNoneMatch: '*' is the single most important line here.
          // It tells R2 to reject the write with 412 PreconditionFailed if
          // the object already exists, protecting against silent overwrites.
          // This is measured behaviour against the real bucket (2026-09-07).
          IfNoneMatch: '*',
        })
      );

      // Build the public URL, handling a trailing slash on the base
      const baseUrl = process.env.R2_PUBLIC_URL!;
      const url = baseUrl.endsWith('/') ? `${baseUrl}${options.path}` : `${baseUrl}/${options.path}`;

      return { url, etag: stripQuotes(result.ETag) };
    } catch (error: unknown) {
      // Map R2's 412 PreconditionFailed onto the interface's own
      // overwrite-refused error, so a caller does not have to know it is
      // talking to S3 to tell that the write-once guard fired.
      if (isPreconditionFailed(error)) {
        throw new ObjectAlreadyExistsError(options.path, { cause: error });
      }
      throw error;
    }
  },

  async head(path: string): Promise<HeadResult | null> {
    const client = getR2Client();

    try {
      const result = await client.send(
        new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: path,
        })
      );

      return {
        etag: stripQuotes(result.ETag),
        size: result.ContentLength ?? 0,
      };
    } catch (error: unknown) {
      // Absence is null. Everything else — 403, 429, 5xx, a network failure —
      // propagates, because a caller that reads a failure as "not stored" makes
      // the wrong decision in the expensive direction.
      if (isObjectAbsent(error)) {
        return null;
      }
      throw error;
    }
  },
};
