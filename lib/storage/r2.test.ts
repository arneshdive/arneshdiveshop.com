import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { r2Provider } from './r2';
import { ObjectAlreadyExistsError } from './errors';
import type { PutOptions } from './types';

/**
 * Mock the AWS SDK S3Client and its commands.
 * We use vi.hoisted so the mock is defined before any imports that might
 * instantiate the client.
 *
 * `...actual` is load-bearing: the provider narrows absence with
 * `instanceof NotFound` / `instanceof NoSuchKey`, so the real exception classes
 * have to come through the mock or that check would be testing nothing.
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
  };
});

import { NotFound, NoSuchKey, S3ServiceException } from '@aws-sdk/client-s3';

/**
 * Errors shaped the way the real SDK shapes them.
 *
 * A mock is free to invent an error shape the SDK never produces, and a test
 * written against an invented shape proves nothing about production. Every
 * combination below was measured by pointing a real `S3Client` at a local HTTP
 * server returning canned responses:
 *
 * | response                            | ctor               | name                 | Code                 | status |
 * | ----------------------------------- | ------------------ | -------------------- | -------------------- | ------ |
 * | HEAD 404, empty body                | NotFound           | 'NotFound'           | —                    | 404    |
 * | HEAD 403, with or without XML body  | S3ServiceException | 'Unknown'            | —                    | 403    |
 * | HEAD 429, empty body                | S3ServiceException | 'Unknown'            | —                    | 429    |
 * | PUT 412, `<Code>PreconditionFailed` | S3ServiceException | 'PreconditionFailed' | 'PreconditionFailed' | 412    |
 * | PUT 412, empty body                 | S3ServiceException | 'Unknown'            | —                    | 412    |
 * | PUT 403, `<Code>AccessDenied`       | AccessDenied       | 'AccessDenied'       | 'AccessDenied'       | 403    |
 *
 * Note the two 412s: a bodyless one carries no error code at all, which is why
 * the provider cannot narrow on the name alone.
 */
function s3Error(opts: {
  name: string;
  status: number;
  message?: string;
  /** The unmodeled `Code` member the SDK copies off a parsed XML error body. */
  code?: string;
}): S3ServiceException {
  const error = new S3ServiceException({
    name: opts.name,
    $fault: 'client',
    $metadata: { httpStatusCode: opts.status },
    message: opts.message ?? 'UnknownError',
  });
  if (opts.code) {
    Object.assign(error, { Code: opts.code });
  }
  return error;
}

/** The command object the provider handed the client. */
function sentCommand() {
  const call = mockSend.mock.calls.at(-1);
  if (!call) throw new Error('client.send() was never called');
  return call[0] as Record<string, unknown>;
}

const PUT_OPTIONS: PutOptions = {
  path: 'products/v2/12345-abc.webp',
  body: new File(['content'], 'test.webp', { type: 'image/webp' }),
  contentType: 'image/webp',
  cacheControlMaxAge: 2592000,
};

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
      expect(sentCommand().IfNoneMatch).toBe('*');
    });

    it('sends exactly the intended PutObject input, nothing more or less', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      const bytes = new Uint8Array([1, 2, 3, 4]);
      await r2Provider.put({
        path: 'products/v2/12345-abc.webp',
        body: bytes,
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      });

      // Asserted as one exact object rather than field by field, so a field
      // quietly added, dropped or renamed fails here. In particular: a wrong
      // Bucket, a Key that is not the caller's path, a hardcoded ContentType,
      // a missing ContentLength, or a second condition alongside IfNoneMatch.
      expect({ ...sentCommand() }).toEqual({
        Bucket: 'test-bucket',
        Key: 'products/v2/12345-abc.webp',
        Body: bytes,
        ContentType: 'image/webp',
        ContentLength: 4,
        CacheControl: 'public, max-age=2592000, immutable',
        IfNoneMatch: '*',
      });
    });

    it('stores a legacy original under the content type the caller supplied', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      await r2Provider.put({
        path: 'products/legacy.jpeg',
        body: new File(['jpeg content'], 'test.jpeg', { type: 'image/jpeg' }),
        contentType: 'image/jpeg',
        cacheControlMaxAge: 2592000,
      });

      // A second content type, so the assertion cannot pass against a
      // provider that hardcodes 'image/webp' — the migration re-encodes some
      // objects and copies others, and a JPEG served as WebP renders nowhere.
      expect(sentCommand().ContentType).toBe('image/jpeg');
      expect(sentCommand().Key).toBe('products/legacy.jpeg');
      expect(sentCommand().IfNoneMatch).toBe('*');
    });

    it('refuses to be overridden — caller cannot suppress IfNoneMatch', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      // A hostile caller that tries to bypass the write-once guarantee.
      // PutOptions does not admit these fields; the cast is the review
      // question — "can this be bypassed?" — expressed as a test.
      //
      // `IfNoneMatch` here is a *truthy* etag, not `undefined`. Found by
      // mutation: with `undefined`, an implementation written as
      // `options.IfNoneMatch ?? '*'` — the exact bypass this test exists to
      // forbid — passes, because the fallback fires. Any value other than '*'
      // narrows the condition to one etag and lets every other write clobber.
      const hostile = {
        path: 'products/v2/existing.webp',
        body: new File(['x'], 'x.webp', { type: 'image/webp' }),
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
        IfNoneMatch: '"d41d8cd98f00b204e9800998ecf8427e"',
        IfMatch: '*',
        allowOverwrite: true,
      } as unknown as PutOptions;

      await r2Provider.put(hostile);

      expect(mockSend.mock.calls).toHaveLength(1);
      // IfNoneMatch must still be set, and no relaxing field may have been
      // forwarded from the options object.
      expect(sentCommand().IfNoneMatch).toBe('*');
      expect(sentCommand()).not.toHaveProperty('IfMatch');
      expect(sentCommand()).not.toHaveProperty('allowOverwrite');
    });

    it('derives CacheControl from the caller max-age and marks it immutable', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      await r2Provider.put({ ...PUT_OPTIONS, cacheControlMaxAge: 2592000 });
      expect(sentCommand().CacheControl).toBe('public, max-age=2592000, immutable');

      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });
      await r2Provider.put({ ...PUT_OPTIONS, cacheControlMaxAge: 31536000 });
      // A second, different value: an implementation that ignores
      // cacheControlMaxAge and hardcodes a lifetime passes one of these two
      // assertions but never both. Both providers must age an object the same,
      // or an image's cache behaviour changes with the STORAGE_PROVIDER flag.
      expect(sentCommand().CacheControl).toBe('public, max-age=31536000, immutable');
    });

    it('maps a 412 with an error code onto ObjectAlreadyExistsError', async () => {
      mockSend.mockRejectedValueOnce(
        s3Error({
          name: 'PreconditionFailed',
          code: 'PreconditionFailed',
          status: 412,
          message: 'At least one of the pre-conditions you specified did not hold',
        })
      );

      const put = r2Provider.put({ ...PUT_OPTIONS, path: 'products/v2/existing.webp' });

      await expect(put).rejects.toBeInstanceOf(ObjectAlreadyExistsError);
      await expect(put).rejects.toThrow('products/v2/existing.webp');
    });

    it('maps a bodyless 412 onto ObjectAlreadyExistsError too', async () => {
      // Measured: a 412 with no XML body carries no error code at all, only
      // the status. Narrowing on the name alone would miss it and the caller
      // would see a raw SDK error instead of "already exists".
      mockSend.mockRejectedValueOnce(s3Error({ name: 'Unknown', status: 412 }));

      await expect(
        r2Provider.put({ ...PUT_OPTIONS, path: 'products/v2/existing.webp' })
      ).rejects.toBeInstanceOf(ObjectAlreadyExistsError);
    });

    it('constructs the public URL correctly without trailing slash on base', async () => {
      vi.stubEnv('R2_PUBLIC_URL', 'https://pub-test.r2.dev');
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      const result = await r2Provider.put(PUT_OPTIONS);

      expect(result.url).toBe('https://pub-test.r2.dev/products/v2/12345-abc.webp');
    });

    it('constructs the public URL correctly with trailing slash on base', async () => {
      vi.stubEnv('R2_PUBLIC_URL', 'https://pub-test.r2.dev/');
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      const result = await r2Provider.put(PUT_OPTIONS);

      // Must not produce a double slash
      expect(result.url).toBe('https://pub-test.r2.dev/products/v2/12345-abc.webp');
    });

    it('strips quotes from the ETag', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"d41d8cd98f00b204e9800998ecf8427e"' });

      const result = await r2Provider.put(PUT_OPTIONS);

      // Phase D compares this against a locally computed MD5, so a stray pair
      // of quotes reads as a corrupt copy on every single object.
      expect(result.etag).toBe('d41d8cd98f00b204e9800998ecf8427e');
      expect(result.etag).not.toContain('"');
    });

    it('leaves an unquoted ETag alone', async () => {
      mockSend.mockResolvedValueOnce({ ETag: 'd41d8cd98f00b204e9800998ecf8427e' });

      const result = await r2Provider.put(PUT_OPTIONS);

      // The strip must be anchored, not a blind slice or a global replace.
      expect(result.etag).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('accepts a Blob and forwards its exact bytes', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      const file = new File([new Uint8Array([7, 8, 9])], 'test.webp', {
        type: 'image/webp',
      });

      await r2Provider.put({
        path: 'products/v2/12345-abc.webp',
        body: file,
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      });

      const body = sentCommand().Body;
      expect(body).toBeInstanceOf(Uint8Array);
      expect(Array.from(body as Uint8Array)).toEqual([7, 8, 9]);
      expect(sentCommand().ContentLength).toBe(3);
    });

    it('accepts a byte view onto a larger buffer without corrupting it', async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

      // What `Buffer.subarray` and sharp's output look like. Verified on the
      // wire against a real S3Client: the SDK honours byteOffset/byteLength,
      // so the view is forwarded rather than copied — but ContentLength must
      // be the view's length, not the backing buffer's.
      const backing = new Uint8Array([0, 0, 1, 2, 3, 4, 0, 0]);
      const bytes = backing.subarray(2, 6);

      await r2Provider.put({
        path: 'products/v2/12345-abc.webp',
        body: bytes,
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      });

      expect(sentCommand().Body).toBe(bytes);
      expect(sentCommand().ContentLength).toBe(4);
    });

    it('throws when R2_BUCKET_NAME is missing', async () => {
      vi.stubEnv('R2_BUCKET_NAME', undefined);

      await expect(r2Provider.put(PUT_OPTIONS)).rejects.toThrow('R2_BUCKET_NAME');
      // Named and refused before any request is made, rather than a client
      // built with undefined credentials.
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('throws when R2_PUBLIC_URL is missing', async () => {
      vi.stubEnv('R2_PUBLIC_URL', undefined);

      await expect(r2Provider.put(PUT_OPTIONS)).rejects.toThrow('R2_PUBLIC_URL');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('propagates a 403 unchanged rather than reading it as already-exists', async () => {
      const denied = s3Error({
        name: 'AccessDenied',
        code: 'AccessDenied',
        status: 403,
        message: 'Access Denied',
      });
      mockSend.mockRejectedValueOnce(denied);

      const put = r2Provider.put(PUT_OPTIONS);

      await expect(put).rejects.toBe(denied);
      await expect(put).rejects.not.toBeInstanceOf(ObjectAlreadyExistsError);
    });

    it('propagates other S3 errors unchanged', async () => {
      mockSend.mockRejectedValueOnce(new Error('Access Denied'));

      await expect(r2Provider.put(PUT_OPTIONS)).rejects.toThrow('Access Denied');
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
          message: 'UnknownError',
          $metadata: { httpStatusCode: 404 },
        })
      );

      const result = await r2Provider.head('products/v2/nonexistent.webp');

      expect(result).toBeNull();
    });

    it('returns null for NoSuchKey', async () => {
      mockSend.mockRejectedValueOnce(
        new NoSuchKey({ message: 'The specified key does not exist.', $metadata: {} })
      );

      expect(await r2Provider.head('products/v2/nonexistent.webp')).toBeNull();
    });

    it('returns null for an unnamed 404', async () => {
      // Belt to the instanceof braces: a 404 the SDK could not attach a code
      // to still means the object is not there.
      mockSend.mockRejectedValueOnce(s3Error({ name: 'Unknown', status: 404 }));

      expect(await r2Provider.head('products/v2/nonexistent.webp')).toBeNull();
    });

    it('throws on a 403 instead of reporting the object as absent', async () => {
      // The defect this pins: an exhausted quota or a bad key answers 403, and
      // Phase D decides what still needs copying from head(). "Absent" here
      // would re-copy the whole catalogue and burn the quota that caused the
      // incident in the first place.
      const denied = s3Error({ name: 'Unknown', status: 403 });
      mockSend.mockRejectedValueOnce(denied);

      await expect(r2Provider.head('products/v2/12345-abc.webp')).rejects.toBe(denied);
    });

    it('throws on a 429 instead of reporting the object as absent', async () => {
      const throttled = s3Error({ name: 'Unknown', status: 429 });
      mockSend.mockRejectedValueOnce(throttled);

      await expect(r2Provider.head('products/v2/12345-abc.webp')).rejects.toBe(throttled);
    });

    it('throws on NoSuchBucket, which is also a 404', async () => {
      // A typo in R2_BUCKET_NAME must not make every key look absent.
      const noBucket = s3Error({
        name: 'NoSuchBucket',
        code: 'NoSuchBucket',
        status: 404,
        message: 'The specified bucket does not exist',
      });
      mockSend.mockRejectedValueOnce(noBucket);

      await expect(r2Provider.head('products/v2/12345-abc.webp')).rejects.toBe(noBucket);
    });

    it('propagates other S3 errors unchanged', async () => {
      mockSend.mockRejectedValueOnce(new Error('Access Denied'));

      await expect(r2Provider.head('products/v2/12345-abc.webp')).rejects.toThrow(
        'Access Denied'
      );
    });

    it('asks for the right bucket and key', async () => {
      mockSend.mockResolvedValueOnce({
        ETag: '"abc"',
        ContentLength: 123,
      });

      await r2Provider.head('products/legacy.jpeg');

      expect({ ...sentCommand() }).toEqual({
        Bucket: 'test-bucket',
        Key: 'products/legacy.jpeg',
      });
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

    it('checks the environment on head() as well as put()', async () => {
      vi.stubEnv('R2_ACCESS_KEY_ID', undefined);

      await expect(r2Provider.head('products/v2/12345-abc.webp')).rejects.toThrow(
        'R2_ACCESS_KEY_ID'
      );
      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});
