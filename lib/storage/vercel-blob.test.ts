import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PutBlobResult } from '@vercel/blob';
import { vercelBlobProvider } from './vercel-blob';
import type { PutOptions } from './types';

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  head: vi.fn(),
}));

// Import the mocked functions after mocking the module.
import { put as blobPut, head as blobHead } from '@vercel/blob';

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

describe('Vercel Blob Storage Provider — head operation', () => {
  beforeEach(() => {
    MOCK_HEAD.mockReset();
  });

  it('returns object metadata when the object exists', async () => {
    MOCK_HEAD.mockResolvedValueOnce({
      etag: '"d41d8cd98f00b204e9800998ecf8427e"',
      size: 42,
      contentType: 'image/webp',
      contentDisposition: 'inline',
      downloadUrl: 'https://example.com/file?download=1',
      pathname: 'products/v2/12345-abc.webp',
      url: 'https://example.com/products/v2/12345-abc.webp',
      uploadedAt: new Date(),
      cacheControl: 'public, max-age=2592000',
    } as any);

    const result = await vercelBlobProvider.head('products/v2/12345-abc.webp');

    expect(result).toEqual({
      etag: '"d41d8cd98f00b204e9800998ecf8427e"',
      size: 42,
    });
  });

  it('returns null when the object does not exist', async () => {
    MOCK_HEAD.mockRejectedValueOnce(new Error('404 Not Found'));

    const result = await vercelBlobProvider.head('products/v2/nonexistent.webp');

    expect(result).toBeNull();
  });

  it('uses the correct path parameter', async () => {
    MOCK_HEAD.mockResolvedValueOnce({
      etag: '"abc"',
      size: 123,
      contentType: 'image/jpeg',
      contentDisposition: 'inline',
      downloadUrl: 'https://example.com/f?download',
      pathname: 'products/legacy.jpeg',
      url: 'https://example.com/products/legacy.jpeg',
      uploadedAt: new Date(),
      cacheControl: 'public, max-age=2592000',
    } as any);

    await vercelBlobProvider.head('products/legacy.jpeg');

    expect(MOCK_HEAD).toHaveBeenCalledWith('products/legacy.jpeg');
  });
});
