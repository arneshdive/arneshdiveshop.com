import { put as blobPut } from '@vercel/blob';
import type { StorageProvider, PutOptions } from './types';

/**
 * Vercel Blob storage implementation.
 *
 * Wraps the @vercel/blob SDK's put() function, preserving all the options
 * needed to satisfy the storage interface contract:
 * - allowOverwrite: false — enforces write-once semantics
 * - access: 'public' — makes objects publicly readable
 * - cacheControlMaxAge — explicitly sets cache lifetime for immutable content
 */
export const vercelBlobProvider: StorageProvider = {
  async put(options: PutOptions) {
    const result = await blobPut(options.path, options.body, {
      access: 'public',
      contentType: options.contentType,
      allowOverwrite: false,
      cacheControlMaxAge: options.cacheControlMaxAge,
    });

    return { url: result.url };
  },
};
