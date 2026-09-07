import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  NotFound,
  type PutObjectCommandInput,
  type HeadObjectCommandInput,
} from '@aws-sdk/client-s3';
import type { StorageProvider, PutOptions, HeadResult } from './types';

/**
 * R2-specific error when a write is rejected due to the object already existing.
 * This must be treated the same way as Vercel Blob's overwrite rejection.
 */
class R2PreconditionFailed extends Error {
  constructor(path: string) {
    super(`Precondition failed: object at ${path} already exists`);
    this.name = 'PreconditionFailed';
  }
}

/**
 * Verifies that all required R2 environment variables are set and returns
 * a configured S3 client for Cloudflare R2.
 *
 * @throws {Error} if any required R2 env var is missing, naming it clearly
 */
function getR2Client(): S3Client {
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
 * public subdomain) and the object path. The CacheControl header declares the
 * content immutable so browsers do not revalidate on reload.
 */
export const r2Provider: StorageProvider = {
  async put(options: PutOptions) {
    const client = getR2Client();

    // Convert body to bytes
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
          ContentLength: body.length,
          CacheControl: 'public, max-age=31536000, immutable',
          // IfNoneMatch: '*' is the single most important line here.
          // It tells R2 to reject the write with 412 PreconditionFailed if
          // the object already exists, protecting against silent overwrites.
          // This is measured behaviour against the real bucket (2026-09-07).
          IfNoneMatch: '*',
        } as PutObjectCommandInput)
      );

      // S3 ETag is wrapped in quotes; strip them for storage
      const etag = result.ETag?.replace(/^"(.*)"$/, '$1') || '';

      // Build the public URL, handling a trailing slash on the base
      const baseUrl = process.env.R2_PUBLIC_URL!;
      const url = baseUrl.endsWith('/') ? `${baseUrl}${options.path}` : `${baseUrl}/${options.path}`;

      return { url, etag };
    } catch (error: unknown) {
      // Map R2's 412 PreconditionFailed into our overwrite-refused contract
      const err = error as { Code?: string; $metadata?: { httpStatusCode?: number } } | null;
      if (err?.Code === 'PreconditionFailed' || err?.$metadata?.httpStatusCode === 412) {
        throw new R2PreconditionFailed(options.path);
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
        } as HeadObjectCommandInput)
      );

      // S3 ETag is wrapped in quotes; strip them
      const etag = result.ETag?.replace(/^"(.*)"$/, '$1') || '';

      return {
        etag,
        size: result.ContentLength ?? 0,
      };
    } catch (error: unknown) {
      // NotFound means the object does not exist; return null per contract
      if (error instanceof NotFound) {
        return null;
      }
      throw error;
    }
  },
};
