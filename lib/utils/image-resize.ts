/**
 * Downscaling and re-encoding product images in the browser, before they are
 * uploaded.
 *
 * Vercel rejects request bodies over ~4.5MB at the edge, before the upload
 * route runs, and that limit cannot be raised. Rather than capping what an
 * admin may pick, shrink the file first: the shop never displays an image
 * larger than 2000px, so sending an 8MB camera photo only to resize it later
 * wastes upload time, bandwidth and storage. A 12MP photo comes out around
 * 300-600KB, which keeps the platform limit irrelevant no matter what was
 * selected.
 *
 * Producing every size here rather than server-side also removes the need for
 * sharp, whose native binary never loaded on Vercel.
 */

import { IMAGE_CONFIG } from './image-config';
import type { ImageSize } from './product-image';

export interface ResizedVariant {
  variant: ImageSize;
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Named with the sizes product-image.ts uses for paths and lookups, so the
 * field name the browser sends is the same word the route stores under.
 * IMAGE_CONFIG calls the smallest one `thumbnail`; map across here rather than
 * leaving two vocabularies to drift.
 */
const VARIANT_WIDTH: Record<ImageSize, number> = {
  main: IMAGE_CONFIG.variants.main.width,
  medium: IMAGE_CONFIG.variants.medium.width,
  thumb: IMAGE_CONFIG.variants.thumbnail.width,
};

const VARIANT_ORDER: ImageSize[] = ['main', 'medium', 'thumb'];

/**
 * Fit within a square bound while keeping the aspect ratio, never enlarging.
 * Upscaling a small image would only inflate the file for no visible gain.
 */
export function computeTargetSize(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);

  if (longest <= max) {
    return { width, height };
  }

  const scale = max / longest;
  return {
    // Round rather than floor so a 1999.5 does not lose a pixel, and never
    // fall to zero on extreme aspect ratios.
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** True when this browser can do the decode/encode work we need. */
export function canResizeInBrowser(): boolean {
  return (
    typeof createImageBitmap === 'function' &&
    typeof document !== 'undefined' &&
    typeof document.createElement('canvas').toBlob === 'function'
  );
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // A null blob means the browser refused the format outright.
        if (blob) resolve(blob);
        else reject(new Error('Browser tidak dapat menghasilkan WebP'));
      },
      'image/webp',
      quality,
    );
  });
}

/**
 * Decode once, then draw the same bitmap at each size — decoding a 25MB file
 * three times would be needlessly slow on a phone.
 */
export async function createVariants(file: File): Promise<ResizedVariant[]> {
  // `from-image` applies the EXIF orientation, without which portrait phone
  // photos come out on their side.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  try {
    const quality = IMAGE_CONFIG.output.quality / 100;

    const results: ResizedVariant[] = [];

    for (const variant of VARIANT_ORDER) {
      const { width, height } = computeTargetSize(
        bitmap.width,
        bitmap.height,
        VARIANT_WIDTH[variant],
      );

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas 2D context tidak tersedia');
      }

      context.drawImage(bitmap, 0, 0, width, height);
      results.push({ variant, blob: await encode(canvas, quality), width, height });
    }

    return results;
  } finally {
    // Bitmaps hold their decoded pixels outside the JS heap; without this a
    // few large uploads in a row can exhaust memory on a mid-range phone.
    bitmap.close();
  }
}
