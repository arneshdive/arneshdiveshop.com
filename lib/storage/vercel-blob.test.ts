import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HeadBlobResult, PutBlobResult } from '@vercel/blob';
import { vercelBlobProvider } from './vercel-blob';
import type { PutOptions } from './types';

/**
 * `...actual` is load-bearing: the provider narrows absence with
 * `instanceof BlobNotFoundError`, and the SDK's error classes do not set
 * `name` (they are all plain `Error`s with a `Vercel Blob: …` message), so
 * `instanceof` against the real class is the only way to tell them apart. A
 * factory returning just `{ put, head }` would leave `BlobNotFoundError`
 * undefined in the module under test, and `instanceof undefined` throws.
 */
vi.mock('@vercel/blob', async () => {
  const actual = await vi.importActual<typeof import('@vercel/blob')>('@vercel/blob');
  return {
    ...actual,
    put: vi.fn(),
    head: vi.fn(),
  };
});

// Import the mocked functions after mocking the module.
import {
  put as blobPut,
  head as blobHead,
  BlobNotFoundError,
  BlobAccessError,
  BlobServiceRateLimited,
  BlobStoreSuspendedError,
} from '@vercel/blob';

const MOCK_PUT = vi.mocked(blobPut);
const MOCK_HEAD = vi.mocked(blobHead);

/**
 * The inline URL and the download URL are deliberately different in every
 * fixture. They are the same string in real life often enough that a test
 * using one value for both would pass against an implementation returning
 * `downloadUrl` — which sets Content-Disposition: attachment and would make
 * every product image download instead of render.
 */
function blobResult(overrides: Partial<PutBlobResult> = {}): PutBlobResult {
  const url = 'https://blob.example.com/products/v2/12345-abc.webp';
  return {
    url,
    downloadUrl: `${url}?download=1`,
    pathname: 'products/v2/12345-abc.webp',
    contentType: 'image/webp',
    contentDisposition: 'inline; filename="12345-abc.webp"',
    etag: '"d41d8cd98f00b204e9800998ecf8427e"',
    ...overrides,
  };
}

/** The options object the adapter handed the SDK. */
function sdkOptions() {
  const call = MOCK_PUT.mock.calls[0];
  if (!call) throw new Error('blobPut() was never called');
  return call[2];
}

/** The body the adapter handed the SDK. */
function sdkBody() {
  const call = MOCK_PUT.mock.calls[0];
  if (!call) throw new Error('blobPut() was never called');
  return call[1];
}

describe('Vercel Blob Storage Provider', () => {
  beforeEach(() => {
    MOCK_PUT.mockReset();
  });

  it('forwards path, body and every option to the SDK unchanged', async () => {
    MOCK_PUT.mockResolvedValueOnce(blobResult());

    const file = new File(['webp content'], 'test.webp', { type: 'image/webp' });

    await vercelBlobProvider.put({
      path: 'products/v2/12345-abc.webp',
      body: file,
      contentType: 'image/webp',
      cacheControlMaxAge: 2592000,
    });

    // Asserted as one exact object rather than property by property, so an
    // option quietly added, dropped or renamed fails here.
    expect(MOCK_PUT).toHaveBeenCalledWith('products/v2/12345-abc.webp', file, {
      access: 'public',
      contentType: 'image/webp',
      allowOverwrite: false,
      cacheControlMaxAge: 2592000,
    });
    // A Blob body must reach the SDK as the very same object — no copy, no
    // re-wrapping, so the bytes the route received are the bytes stored.
    expect(sdkBody()).toBe(file);
  });

  it('cannot be talked into overwriting or into a private object', async () => {
    MOCK_PUT.mockResolvedValueOnce(blobResult());

    // A caller that has gone out of its way to ask for an overwrite. PutOptions
    // does not admit these fields; the cast is the review question — "can this
    // be bypassed?" — expressed as a test.
    const hostile = {
      path: 'products/v2/existing.webp',
      body: new File(['x'], 'x.webp', { type: 'image/webp' }),
      contentType: 'image/webp',
      cacheControlMaxAge: 2592000,
      allowOverwrite: true,
      access: 'private',
      addRandomSuffix: true,
    } as unknown as PutOptions;

    await vercelBlobProvider.put(hostile);

    expect(sdkOptions()).toEqual({
      access: 'public',
      contentType: 'image/webp',
      allowOverwrite: false,
      cacheControlMaxAge: 2592000,
    });
  });

  it('returns the inline url, never the download url', async () => {
    const result = blobResult();
    MOCK_PUT.mockResolvedValueOnce(result);

    const stored = await vercelBlobProvider.put({
      path: 'products/v2/12345-abc.webp',
      body: new File(['content'], 'test.webp', { type: 'image/webp' }),
      contentType: 'image/webp',
      cacheControlMaxAge: 2592000,
    });

    expect(stored.url).toBe(result.url);
    expect(stored.url).not.toBe(result.downloadUrl);
  });

  it('returns the etag the store reported, for migration verification', async () => {
    MOCK_PUT.mockResolvedValueOnce(
      blobResult({ etag: '"0cc175b9c0f1b6a831c399e269772661"' })
    );

    const stored = await vercelBlobProvider.put({
      path: 'products/v2/12345-abc.webp',
      body: new File(['a'], 'a.webp', { type: 'image/webp' }),
      contentType: 'image/webp',
      cacheControlMaxAge: 2592000,
    });

    expect(stored.etag).toBe('"0cc175b9c0f1b6a831c399e269772661"');
  });

  it('accepts raw bytes and forwards them without corrupting the view', async () => {
    MOCK_PUT.mockResolvedValueOnce(blobResult());

    // A window onto a larger buffer, which is what a sliced Buffer or a
    // typed-array view looks like: an implementation that ignores byteOffset
    // would send the wrong bytes.
    const backing = new Uint8Array([0, 0, 1, 2, 3, 4, 0, 0]);
    const bytes = backing.subarray(2, 6);

    await vercelBlobProvider.put({
      path: 'products/v2/12345-abc.webp',
      body: bytes,
      contentType: 'image/webp',
      cacheControlMaxAge: 2592000,
    });

    const forwarded = sdkBody();
    expect(Buffer.isBuffer(forwarded)).toBe(true);
    expect(Array.from(forwarded as Buffer)).toEqual([1, 2, 3, 4]);
    // Wrapped, not copied: writing through the view is visible in the original.
    (forwarded as Buffer)[0] = 9;
    expect(backing[2]).toBe(9);
  });

  it('stores a legacy original under the content type the caller supplied', async () => {
    MOCK_PUT.mockResolvedValueOnce(
      blobResult({
        url: 'https://blob.example.com/products/legacy.jpeg',
        pathname: 'products/legacy.jpeg',
        contentType: 'image/jpeg',
      })
    );

    await vercelBlobProvider.put({
      path: 'products/legacy.jpeg',
      body: new File(['jpeg content'], 'test.jpeg', { type: 'image/jpeg' }),
      contentType: 'image/jpeg',
      cacheControlMaxAge: 2592000,
    });

    expect(sdkOptions()).toHaveProperty('contentType', 'image/jpeg');
    // Still write-once, even off the variant path.
    expect(sdkOptions()).toHaveProperty('allowOverwrite', false);
  });

  it('propagates errors from the blob provider', async () => {
    MOCK_PUT.mockRejectedValueOnce(new Error('Storage quota exceeded'));

    await expect(
      vercelBlobProvider.put({
        path: 'test.webp',
        body: new File(['content'], 'test.webp', { type: 'image/webp' }),
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      })
    ).rejects.toThrow('Storage quota exceeded');
  });
});

/** A HeadBlobResult, typed rather than cast, so a field drift fails to compile. */
function headResult(overrides: Partial<HeadBlobResult> = {}): HeadBlobResult {
  return {
    etag: '"d41d8cd98f00b204e9800998ecf8427e"',
    size: 42,
    contentType: 'image/webp',
    contentDisposition: 'inline; filename="12345-abc.webp"',
    downloadUrl: 'https://blob.example.com/products/v2/12345-abc.webp?download=1',
    pathname: 'products/v2/12345-abc.webp',
    url: 'https://blob.example.com/products/v2/12345-abc.webp',
    uploadedAt: new Date('2026-08-26T00:00:00.000Z'),
    cacheControl: 'public, max-age=2592000',
    ...overrides,
  };
}

describe('Vercel Blob Storage Provider — head operation', () => {
  beforeEach(() => {
    MOCK_HEAD.mockReset();
  });

  it('returns object metadata when the object exists', async () => {
    MOCK_HEAD.mockResolvedValueOnce(headResult());

    const result = await vercelBlobProvider.head('products/v2/12345-abc.webp');

    expect(result).toEqual({
      etag: '"d41d8cd98f00b204e9800998ecf8427e"',
      size: 42,
    });
  });

  it('returns null only when the store says the blob does not exist', async () => {
    MOCK_HEAD.mockRejectedValueOnce(new BlobNotFoundError());

    const result = await vercelBlobProvider.head('products/v2/nonexistent.webp');

    expect(result).toBeNull();
  });

  /**
   * The defect these pin. `head()` was a bare `catch { return null }`, so every
   * one of these — the exhausted-operations-quota 403 that caused this
   * project's incident included — reported "this object is not stored".
   *
   * Phase D works out what is left to copy by asking `head()`. A throttled
   * store answering "nothing is here" sends it off to re-copy all ~2,900
   * objects, spending the very quota that broke the site.
   */
  it.each([
    ['a 403 from an exhausted quota or bad credentials', () => new BlobAccessError()],
    ['rate limiting', () => new BlobServiceRateLimited(30)],
    ['a suspended store', () => new BlobStoreSuspendedError()],
    ['a network failure', () => new TypeError('fetch failed')],
  ])('propagates %s instead of reporting the blob as absent', async (_label, make) => {
    const failure = make();
    MOCK_HEAD.mockRejectedValueOnce(failure);

    await expect(vercelBlobProvider.head('products/v2/12345-abc.webp')).rejects.toBe(
      failure
    );
  });

  it('uses the correct path parameter', async () => {
    MOCK_HEAD.mockResolvedValueOnce(
      headResult({
        etag: '"abc"',
        size: 123,
        contentType: 'image/jpeg',
        pathname: 'products/legacy.jpeg',
        url: 'https://blob.example.com/products/legacy.jpeg',
        downloadUrl: 'https://blob.example.com/products/legacy.jpeg?download=1',
      })
    );

    await vercelBlobProvider.head('products/legacy.jpeg');

    expect(MOCK_HEAD).toHaveBeenCalledWith('products/legacy.jpeg');
  });
});
