import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAdmin } from '@/lib/auth/admin';
import { IMAGE_CONFIG } from '@/lib/utils/image-config';
import { variantPath, originalPath, type ImageSize } from '@/lib/utils/product-image';

// sharp needs the Node runtime; route handlers default to it, but this is
// load-bearing rather than incidental.
export const runtime = 'nodejs';

/**
 * sharp is a native module, and importing it at the top level takes the whole
 * route down with it if the binary is missing for the deployment's platform —
 * the handler never runs and the client gets an HTML error page instead of
 * JSON. Resizing is an enhancement, not a requirement for storing an upload,
 * so load it lazily and let the caller carry on without it.
 */
async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch (error) {
    console.error('sharp unavailable, storing uploads without resizing:', error);
    return null;
  }
}

const VARIANT_SIZES: ImageSize[] = ['main', 'medium', 'thumb'];

const VARIANT_WIDTH: Record<ImageSize, number> = {
  main: IMAGE_CONFIG.variants.main.width,
  medium: IMAGE_CONFIG.variants.medium.width,
  thumb: IMAGE_CONFIG.variants.thumbnail.width,
};

/**
 * POST /api/upload - Upload a product image to Vercel Blob.
 *
 * Resizes to the three variants IMAGE_CONFIG has always described, converts
 * to WebP and keeps the untouched upload alongside them. Images used to be
 * stored as-is and resized on every request by Vercel's optimizer, which is
 * billed per (image, width, quality) and eventually returned 402 for the
 * whole site. Doing the work once here costs nothing to serve.
 *
 * Everything is written to fresh, uniquely-named paths under products/v2/
 * with overwrites refused, so no previously uploaded file can be affected.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(await auth.error.json(), { status: auth.error.status });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    const acceptedTypes = [...IMAGE_CONFIG.acceptedFormats];
    if (!acceptedTypes.includes(file.type as (typeof acceptedTypes)[number])) {
      return NextResponse.json(
        { error: 'Format tidak didukung. Gunakan: JPEG, PNG, WebP, atau HEIC.' },
        { status: 400 }
      );
    }

    if (file.size > IMAGE_CONFIG.maxFileSize) {
      const maxMB = Math.round(IMAGE_CONFIG.maxFileSize / (1024 * 1024));
      return NextResponse.json(
        { error: `Ukuran file terlalu besar (maksimal ${maxMB}MB)` },
        { status: 400 }
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const base = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const source = Buffer.from(await file.arrayBuffer());

    let mainUrl: string;

    const sharp = await loadSharp();

    try {
      if (!sharp) {
        throw new Error('sharp tidak tersedia di runtime ini');
      }

      // `.rotate()` with no argument applies the EXIF orientation, which is
      // dropped along with the rest of the metadata on the way out.
      const decoded = sharp(source, { failOn: 'none' }).rotate();
      const { width, height } = await decoded.metadata();

      if (!width || !height) {
        throw new Error('Dimensi gambar tidak terbaca');
      }

      const encoded = await Promise.all(
        VARIANT_SIZES.map(async (size) => {
          const target = VARIANT_WIDTH[size];
          const buffer = await sharp(source, { failOn: 'none' })
            .rotate()
            .resize(target, target, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: IMAGE_CONFIG.output.quality })
            .toBuffer();
          return { size, buffer };
        })
      );

      // The untouched upload is kept so the variants can be regenerated if the
      // sizes or format ever change, without asking anyone to re-upload.
      const uploads = await Promise.all([
        ...encoded.map(({ size, buffer }) =>
          put(variantPath(base, size), buffer, {
            access: 'public',
            contentType: 'image/webp',
            allowOverwrite: false,
          }).then((blob) => ({ size, url: blob.url }))
        ),
        put(originalPath(base, extension), source, {
          access: 'public',
          contentType: file.type,
          allowOverwrite: false,
        }).then((blob) => ({ size: 'original' as const, url: blob.url })),
      ]);

      const main = uploads.find((u) => u.size === 'main');
      if (!main) {
        throw new Error('Varian utama gagal diunggah');
      }
      mainUrl = main.url;
    } catch (processingError) {
      // Never block an admin because we could not process their file: fall
      // back to the old behaviour of storing it untouched. The URL then has
      // no `products/v2/` prefix, so it is served as a legacy image.
      console.error('Image processing failed, storing original as-is:', processingError);

      const fallback = await put(`products/${base}.${extension}`, source, {
        access: 'public',
        contentType: file.type,
        allowOverwrite: false,
      });
      mainUrl = fallback.url;
    }

    return NextResponse.json(
      {
        url: mainUrl,
        filename: mainUrl.split('/').pop(),
        warning:
          file.size > IMAGE_CONFIG.warnFileSize
            ? 'Gambar besar telah dioptimasi otomatis'
            : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah gambar' },
      { status: 500 }
    );
  }
}
