import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BlobResult } from '@vercel/blob';
import { vercelBlobProvider } from './vercel-blob';

// Mock @vercel/blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}));

// Import the mocked put after mocking the module
import { put as blobPut } from '@vercel/blob';

const MOCK_PUT = blobPut as unknown as ReturnType<typeof vi.fn>;

describe('Vercel Blob Storage Provider', () => {
  beforeEach(() => {
    MOCK_PUT.mockClear();
  });

  it('stores a file with correct options', async () => {
    const mockUrl = 'https://example.com/products/v2/12345-abc.webp';
    const mockBlob: BlobResult = {
      url: mockUrl,
      downloadUrl: mockUrl,
      pathname: '/products/v2/12345-abc.webp',
      contentType: 'image/webp',
      contentDisposition: 'inline; filename="12345-abc.webp"',
    };

    MOCK_PUT.mockResolvedValueOnce(mockBlob);

    const file = new File(['webp content'], 'test.webp', {
      type: 'image/webp',
    });

    const result = await vercelBlobProvider.put({
      path: 'products/v2/12345-abc.webp',
      body: file,
      contentType: 'image/webp',
      cacheControlMaxAge: 2592000,
    });

    expect(result.url).toBe(mockUrl);
    expect(MOCK_PUT).toHaveBeenCalledWith(
      'products/v2/12345-abc.webp',
      file,
      {
        access: 'public',
        contentType: 'image/webp',
        allowOverwrite: false,
        cacheControlMaxAge: 2592000,
      }
    );
  });

  it('passes allowOverwrite: false to enforce write-once semantics', async () => {
    const mockBlob: BlobResult = {
      url: 'https://example.com/test.webp',
      downloadUrl: 'https://example.com/test.webp',
      pathname: '/test.webp',
      contentType: 'image/webp',
      contentDisposition: 'inline',
    };

    MOCK_PUT.mockResolvedValueOnce(mockBlob);

    const file = new File(['content'], 'test.webp', { type: 'image/webp' });

    await vercelBlobProvider.put({
      path: 'test.webp',
      body: file,
      contentType: 'image/webp',
      cacheControlMaxAge: 2592000,
    });

    // Verify allowOverwrite is explicitly false
    const callArgs = MOCK_PUT.mock.calls[0][2];
    expect(callArgs).toHaveProperty('allowOverwrite', false);
  });

  it('preserves cacheControlMaxAge value byte-for-byte', async () => {
    const mockBlob: BlobResult = {
      url: 'https://example.com/test.webp',
      downloadUrl: 'https://example.com/test.webp',
      pathname: '/test.webp',
      contentType: 'image/webp',
      contentDisposition: 'inline',
    };

    MOCK_PUT.mockResolvedValueOnce(mockBlob);

    const file = new File(['content'], 'test.webp', { type: 'image/webp' });
    const expectedCacheControl = 30 * 24 * 60 * 60; // 30 days in seconds

    await vercelBlobProvider.put({
      path: 'test.webp',
      body: file,
      contentType: 'image/webp',
      cacheControlMaxAge: expectedCacheControl,
    });

    const callArgs = MOCK_PUT.mock.calls[0][2];
    expect(callArgs).toHaveProperty('cacheControlMaxAge', expectedCacheControl);
  });

  it('sets access to public for all uploads', async () => {
    const mockBlob: BlobResult = {
      url: 'https://example.com/test.webp',
      downloadUrl: 'https://example.com/test.webp',
      pathname: '/test.webp',
      contentType: 'image/webp',
      contentDisposition: 'inline',
    };

    MOCK_PUT.mockResolvedValueOnce(mockBlob);

    const file = new File(['content'], 'test.webp', { type: 'image/webp' });

    await vercelBlobProvider.put({
      path: 'test.webp',
      body: file,
      contentType: 'image/webp',
      cacheControlMaxAge: 2592000,
    });

    const callArgs = MOCK_PUT.mock.calls[0][2];
    expect(callArgs).toHaveProperty('access', 'public');
  });

  it('returns the URL from the blob result', async () => {
    const expectedUrl = 'https://blob.vercel-storage.com/products/v2/abc123.webp';
    const mockBlob: BlobResult = {
      url: expectedUrl,
      downloadUrl: expectedUrl,
      pathname: '/products/v2/abc123.webp',
      contentType: 'image/webp',
      contentDisposition: 'inline',
    };

    MOCK_PUT.mockResolvedValueOnce(mockBlob);

    const file = new File(['content'], 'test.webp', { type: 'image/webp' });

    const result = await vercelBlobProvider.put({
      path: 'products/v2/abc123.webp',
      body: file,
      contentType: 'image/webp',
      cacheControlMaxAge: 2592000,
    });

    expect(result.url).toBe(expectedUrl);
  });

  it('supports different content types', async () => {
    const mockBlob: BlobResult = {
      url: 'https://example.com/image.jpeg',
      downloadUrl: 'https://example.com/image.jpeg',
      pathname: '/image.jpeg',
      contentType: 'image/jpeg',
      contentDisposition: 'inline',
    };

    MOCK_PUT.mockResolvedValueOnce(mockBlob);

    const file = new File(['jpeg content'], 'test.jpeg', {
      type: 'image/jpeg',
    });

    const result = await vercelBlobProvider.put({
      path: 'products/legacy.jpeg',
      body: file,
      contentType: 'image/jpeg',
      cacheControlMaxAge: 2592000,
    });

    expect(result.url).toBe('https://example.com/image.jpeg');

    const callArgs = MOCK_PUT.mock.calls[0][2];
    expect(callArgs).toHaveProperty('contentType', 'image/jpeg');
  });

  it('propagates errors from the blob provider', async () => {
    const error = new Error('Storage quota exceeded');
    MOCK_PUT.mockRejectedValueOnce(error);

    const file = new File(['content'], 'test.webp', { type: 'image/webp' });

    await expect(
      vercelBlobProvider.put({
        path: 'test.webp',
        body: file,
        contentType: 'image/webp',
        cacheControlMaxAge: 2592000,
      })
    ).rejects.toThrow('Storage quota exceeded');
  });
});
