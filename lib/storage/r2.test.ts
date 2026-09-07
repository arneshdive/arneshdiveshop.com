import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { r2Provider } from './r2';
import type { PutOptions } from './types';

/**
 * Mock the AWS SDK S3Client and its commands.
 * We use vi.hoisted so the mock is defined before any imports that might
 * instantiate the client.
 */
const mockSend = vi.hoisted(() => vi.fn());

vi.mock('@aws-sdk/client-s3', async () => {
  const actual = await vi.importActual<typeof import('@aws-sdk/client-s3')>(
    '@aws-sdk/client-s3'
  );

  class MockS3Client {
    send = mockSend;
  }

  class MockPutObjectCommand {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  }

  class MockHeadObjectCommand {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  }

  return {
    ...actual,
    S3Client: MockS3Client,
    PutObjectCommand: MockPutObjectCommand,
    HeadObjectCommand: MockHeadObjectCommand,
    NotFound: actual.NotFound,
  };
});

import { NotFound } from '@aws-sdk/client-s3';

describe('Cloudflare R2 Storage Provider', () => {
  beforeEach(() => {
    // Set up required env vars for R2
    vi.stubEnv('R2_ACCOUNT_ID', 'test-account');
    vi.stubEnv('R2_ACCESS_KEY_ID', 'test-access-key');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret-key');
    vi.stubEnv('R2_S3_ENDPOINT', 'https://test.r2.cloudflarestorage.com');
    vi.stubEnv('R2_BUCKET_NAME', 'test-bucket');
    vi.stubEnv('R2_PUBLIC_URL', 'https://pub-test.r2.dev');

    mockSend.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('put() operation', () => {
    it('includes IfNoneMatch: * on every PutObject call', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      const file = new File(['webp content'], 'test.webp', { type: 'image/webp' });

      await r2Provider.put({
        path: 'products/v2/12345-abc.webp',
        body: file,
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      });

      expect(mockSend.mock.calls).toHaveLength(1);
      const putCommand = mockSend.mock.calls[0]?.[0];
      expect(putCommand?.IfNoneMatch).toBe('*');
    });

    it('refuses to be overridden — caller cannot suppress IfNoneMatch', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      // A hostile caller that tries to bypass the write-once guarantee
      const hostile = {
        path: 'products/v2/existing.webp',
        body: new File(['x'], 'x.webp', { type: 'image/webp' }),
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
        IfNoneMatch: undefined,
      } as unknown as PutOptions;

      await r2Provider.put(hostile);

      expect(mockSend.mock.calls).toHaveLength(1);
      const putCommand = mockSend.mock.calls[0]?.[0];
      // IfNoneMatch must still be set, not undefined
      expect(putCommand?.IfNoneMatch).toBe('*');
    });

    it('rejects a 412 PreconditionFailed as overwrite-refused', async () => {
      const preconditionError = new Error('PreconditionFailed');
      (preconditionError as { Code?: string; $metadata?: { httpStatusCode?: number } }).Code =
        'PreconditionFailed';
      (preconditionError as { Code?: string; $metadata?: { httpStatusCode?: number } }).$metadata = {
        httpStatusCode: 412,
      };
      mockSend.mockRejectedValueOnce(preconditionError);

      await expect(
        r2Provider.put({
          path: 'products/v2/existing.webp',
          body: new File(['content'], 'test.webp', { type: 'image/webp' }),
          contentType: 'image/webp',
          cacheControlMaxAge: 2592000,
        })
      ).rejects.toThrow('Precondition failed');
    });

    it('rejects a 412 by http status code as well', async () => {
      const preconditionError = new Error('Condition not met');
      (preconditionError as { $metadata?: { httpStatusCode?: number } }).$metadata = {
        httpStatusCode: 412,
      };
      mockSend.mockRejectedValueOnce(preconditionError);

      await expect(
        r2Provider.put({
          path: 'products/v2/existing.webp',
          body: new File(['content'], 'test.webp', { type: 'image/webp' }),
          contentType: 'image/webp',
          cacheControlMaxAge: 2592000,
        })
      ).rejects.toThrow('Precondition failed');
    });

    it('constructs the public URL correctly without trailing slash on base', async () => {
      vi.stubEnv('R2_PUBLIC_URL', 'https://pub-test.r2.dev');
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      const result = await r2Provider.put({
        path: 'products/v2/12345-abc.webp',
        body: new File(['content'], 'test.webp', { type: 'image/webp' }),
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      });

      expect(result.url).toBe('https://pub-test.r2.dev/products/v2/12345-abc.webp');
    });

    it('constructs the public URL correctly with trailing slash on base', async () => {
      vi.stubEnv('R2_PUBLIC_URL', 'https://pub-test.r2.dev/');
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      const result = await r2Provider.put({
        path: 'products/v2/12345-abc.webp',
        body: new File(['content'], 'test.webp', { type: 'image/webp' }),
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      });

      // Must not produce a double slash
      expect(result.url).toBe('https://pub-test.r2.dev/products/v2/12345-abc.webp');
    });

    it('strips quotes from the ETag', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"d41d8cd98f00b204e9800998ecf8427e"' });

      const result = await r2Provider.put({
        path: 'products/v2/12345-abc.webp',
        body: new File(['content'], 'test.webp', { type: 'image/webp' }),
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      });

      expect(result.etag).toBe('d41d8cd98f00b204e9800998ecf8427e');
      expect(result.etag).not.toContain('"');
    });

    it('sets CacheControl to immutable', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      await r2Provider.put({
        path: 'products/v2/12345-abc.webp',
        body: new File(['content'], 'test.webp', { type: 'image/webp' }),
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      });

      expect(mockSend.mock.calls).toHaveLength(1);
      const putCommand = mockSend.mock.calls[0]?.[0];
      expect(putCommand?.CacheControl).toBe('public, max-age=31536000, immutable');
    });

    it('accepts a Blob and converts it to bytes', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      const file = new File(['webp content'], 'test.webp', { type: 'image/webp' });

      await r2Provider.put({
        path: 'products/v2/12345-abc.webp',
        body: file,
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      });

      expect(mockSend.mock.calls).toHaveLength(1);
      const putCommand = mockSend.mock.calls[0]?.[0];
      expect(putCommand.Body instanceof Uint8Array).toBe(true);
    });

    it('accepts raw bytes and uses them as-is', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      const bytes = new Uint8Array([1, 2, 3, 4]);

      await r2Provider.put({
        path: 'products/v2/12345-abc.webp',
        body: bytes,
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      });

      expect(mockSend.mock.calls).toHaveLength(1);
      const putCommand = mockSend.mock.calls[0]?.[0];
      expect(putCommand?.Body).toBe(bytes);
    });

    it('throws when R2_BUCKET_NAME is missing', async () => {
      vi.stubEnv('R2_BUCKET_NAME', undefined);

      await expect(
        r2Provider.put({
          path: 'products/v2/12345-abc.webp',
          body: new File(['content'], 'test.webp', { type: 'image/webp' }),
          contentType: 'image/webp',
          cacheControlMaxAge: 2592000,
        })
      ).rejects.toThrow('R2_BUCKET_NAME');
    });

    it('throws when R2_PUBLIC_URL is missing', async () => {
      vi.stubEnv('R2_PUBLIC_URL', undefined);

      await expect(
        r2Provider.put({
          path: 'products/v2/12345-abc.webp',
          body: new File(['content'], 'test.webp', { type: 'image/webp' }),
          contentType: 'image/webp',
          cacheControlMaxAge: 2592000,
        })
      ).rejects.toThrow('R2_PUBLIC_URL');
    });

    it('propagates other S3 errors unchanged', async () => {
      mockSend.mockRejectedValueOnce(new Error('Access Denied'));

      await expect(
        r2Provider.put({
          path: 'products/v2/12345-abc.webp',
          body: new File(['content'], 'test.webp', { type: 'image/webp' }),
          contentType: 'image/webp',
          cacheControlMaxAge: 2592000,
        })
      ).rejects.toThrow('Access Denied');
    });
  });

  describe('head() operation', () => {
    it('returns object metadata when the object exists', async () => {
      mockSend.mockResolvedValueOnce({
        ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
        ContentLength: 42,
      });

      const result = await r2Provider.head('products/v2/12345-abc.webp');

      expect(result).toEqual({
        etag: 'd41d8cd98f00b204e9800998ecf8427e',
        size: 42,
      });
    });

    it('strips quotes from the ETag on head', async () => {
      mockSend.mockResolvedValueOnce({
        ETag: '"abc123"',
        ContentLength: 100,
      });

      const result = await r2Provider.head('products/v2/12345-abc.webp');

      expect(result).not.toBeNull();
      expect(result?.etag).toBe('abc123');
    });

    it('returns null when the object does not exist', async () => {
      mockSend.mockRejectedValueOnce(
        new NotFound({
          message: 'Not Found',
          $metadata: { httpStatusCode: 404 } as any,
        })
      );

      const result = await r2Provider.head('products/v2/nonexistent.webp');

      expect(result).toBeNull();
    });

    it('propagates other S3 errors unchanged', async () => {
      mockSend.mockRejectedValueOnce(new Error('Access Denied'));

      await expect(r2Provider.head('products/v2/12345-abc.webp')).rejects.toThrow(
        'Access Denied'
      );
    });

    it('uses the correct path parameter', async () => {
      mockSend.mockResolvedValueOnce({
        ETag: '"abc"',
        ContentLength: 123,
      });

      await r2Provider.head('products/legacy.jpeg');

      expect(mockSend.mock.calls.length).toBeGreaterThan(0);
      const headCommand = mockSend.mock.calls[mockSend.mock.calls.length - 1]?.[0];
      expect(headCommand?.Key).toBe('products/legacy.jpeg');
    });
  });

  describe('environment validation', () => {
    it('lists all missing env vars clearly', async () => {
      vi.stubEnv('R2_ACCESS_KEY_ID', undefined);
      vi.stubEnv('R2_SECRET_ACCESS_KEY', undefined);

      await expect(
        r2Provider.put({
          path: 'test',
          body: new File(['x'], 'x.webp', { type: 'image/webp' }),
          contentType: 'image/webp',
          cacheControlMaxAge: 2592000,
        })
      ).rejects.toThrow('R2_ACCESS_KEY_ID');
    });
  });
});
