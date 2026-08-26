import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeTargetSize } from './image-resize';
import { IMAGE_CONFIG } from './image-config';

describe('computeTargetSize', () => {
  it('never enlarges an image that already fits', () => {
    expect(computeTargetSize(300, 300, 2000)).toEqual({ width: 300, height: 300 });
    expect(computeTargetSize(1080, 1080, 2000)).toEqual({ width: 1080, height: 1080 });
  });

  it('leaves an image sitting exactly on the bound alone', () => {
    expect(computeTargetSize(2000, 1500, 2000)).toEqual({ width: 2000, height: 1500 });
  });

  it('scales by the longest side, keeping the aspect ratio', () => {
    // Landscape: width is the constraint.
    expect(computeTargetSize(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
    // Portrait: height is.
    expect(computeTargetSize(3000, 4000, 2000)).toEqual({ width: 1500, height: 2000 });
  });

  it('handles the catalogue sizes for every variant', () => {
    const source = { width: 3024, height: 4032 }; // a typical phone photo
    const main = computeTargetSize(source.width, source.height, IMAGE_CONFIG.variants.main.width);
    const medium = computeTargetSize(source.width, source.height, IMAGE_CONFIG.variants.medium.width);
    const thumb = computeTargetSize(source.width, source.height, IMAGE_CONFIG.variants.thumbnail.width);

    expect(main.height).toBe(IMAGE_CONFIG.variants.main.width);
    expect(medium.height).toBe(IMAGE_CONFIG.variants.medium.width);
    expect(thumb.height).toBe(IMAGE_CONFIG.variants.thumbnail.width);

    // Aspect ratio preserved throughout.
    const ratio = source.width / source.height;
    for (const size of [main, medium, thumb]) {
      expect(size.width / size.height).toBeCloseTo(ratio, 2);
    }
  });

  it('never collapses an extreme aspect ratio to zero', () => {
    const size = computeTargetSize(10000, 3, 400);
    expect(size.width).toBe(400);
    expect(size.height).toBeGreaterThanOrEqual(1);
  });
});

describe('createVariants', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /**
   * Stand in for the browser APIs — vitest runs in the node environment, so
   * there is no document or createImageBitmap to spy on.
   */
  function stubBrowser(
    source: { width: number; height: number },
    options: { failOnCanvas?: boolean } = {},
  ) {
    const close = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ ...source, close }),
    );

    const drawImage = vi.fn();
    const encoded: Array<{ width: number; height: number }> = [];

    vi.stubGlobal('document', {
      createElement: (tag: string) => {
        if (options.failOnCanvas) throw new Error('canvas gone');
        if (tag !== 'canvas') throw new Error(`unexpected element ${tag}`);
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage }),
          toBlob: (cb: (b: Blob) => void) => {
            encoded.push({ width: canvas.width, height: canvas.height });
            cb(new Blob(['x'], { type: 'image/webp' }));
          },
        };
        return canvas;
      },
    });

    return { close, drawImage, encoded };
  }

  it('produces the three catalogue sizes as WebP', async () => {
    const { encoded } = stubBrowser({ width: 4000, height: 3000 });
    const { createVariants } = await import('./image-resize');

    const variants = await createVariants(new File([], 'photo.jpg'));

    expect(variants.map((v) => v.variant)).toEqual(['main', 'medium', 'thumb']);
    expect(variants.every((v) => v.blob.type === 'image/webp')).toBe(true);
    expect(encoded).toEqual([
      { width: 2000, height: 1500 },
      { width: 800, height: 600 },
      { width: 400, height: 300 },
    ]);
  });

  it('decodes once no matter how many sizes are produced', async () => {
    stubBrowser({ width: 4000, height: 3000 });
    const { createVariants } = await import('./image-resize');

    await createVariants(new File([], 'photo.jpg'));

    expect(createImageBitmap).toHaveBeenCalledTimes(1);
  });

  it('releases the bitmap even when encoding fails', async () => {
    const { close } = stubBrowser({ width: 4000, height: 3000 }, { failOnCanvas: true });
    const { createVariants } = await import('./image-resize');

    await expect(createVariants(new File([], 'photo.jpg'))).rejects.toThrow('canvas gone');
    expect(close).toHaveBeenCalled();
  });

  it('does not enlarge a small source', async () => {
    const { encoded } = stubBrowser({ width: 300, height: 300 });
    const { createVariants } = await import('./image-resize');

    await createVariants(new File([], 'small.jpg'));

    expect(encoded).toEqual([
      { width: 300, height: 300 },
      { width: 300, height: 300 },
      { width: 300, height: 300 },
    ]);
  });
});
