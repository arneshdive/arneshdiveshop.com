import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAdmin } from '@/lib/auth/admin';
import { IMAGE_CONFIG } from '@/lib/utils/image-config';
import { variantPath, type ImageSize } from '@/lib/utils/product-image';

/**
 * POST /api/upload - Store a product image.
 *
 * The browser downscales and re-encodes before sending (see
 * lib/utils/image-resize.ts), so the normal request carries three small WebP
 * variants and this route only has to store them. Resizing used to happen here
 * with sharp, whose native binary never loaded on Vercel; doing the work in
 * the browser also means an admin can pick a 25MB photo without running into
 * the platform's ~4.5MB request body limit, since only a few hundred KB is
 * ever sent.
 *
 * A single `file` field is still accepted for browsers that cannot do the
 * work. That one is stored untouched outside products/v2/, so it is served as
 * a legacy image with no derivatives.
 *
 * Everything is written to fresh, uniquely-named paths with overwrites
 * refused, so no previously uploaded file can be affected.
 */

// Field names the client sends, in the order product-image.ts expects.
const VARIANT_FIELDS: ImageSize[] = ['main', 'medium', 'thumb'];

function tooLarge(bytes: number): boolean {
  return bytes > IMAGE_CONFIG.maxUploadSize;
}

function sizeError() {
  const maxMB = Math.round(IMAGE_CONFIG.maxUploadSize / (1024 * 1024));
  return NextResponse.json(
    { error: `Ukuran file terlalu besar (maksimal ${maxMB}MB)` },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(await auth.error.json(), { status: auth.error.status });
    }

    const formData = await request.formData();
    const base = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const variants = VARIANT_FIELDS.map((size) => ({
      size,
      file: formData.get(size) as File | null,
    }));

    // Normal path: every variant present, already WebP.
    if (variants.every((v) => v.file)) {
      for (const { file } of variants) {
        if (tooLarge(file!.size)) return sizeError();
      }

      const uploaded = await Promise.all(
        variants.map(({ size, file }) =>
          put(variantPath(base, size), file!, {
            access: 'public',
            contentType: 'image/webp',
            allowOverwrite: false,
          }).then((blob) => ({ size, url: blob.url }))
        )
      );

      const main = uploaded.find((u) => u.size === 'main');
      if (!main) {
        throw new Error('Varian utama gagal diunggah');
      }

      return NextResponse.json(
        { url: main.url, filename: main.url.split('/').pop() },
        { status: 201 }
      );
    }

    // Fallback path: an unprocessed original.
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Rejected separately from the generic case so the admin is told what to
    // do about it. Nothing in the pipeline can read HEIC — browsers cannot
    // decode it to a canvas, and storing it would leave a product image most
    // browsers refuse to render.
    const conversionOnly = [...IMAGE_CONFIG.conversionOnlyFormats];
    if (conversionOnly.includes(file.type as (typeof conversionOnly)[number])) {
      return NextResponse.json(
        {
          error:
            'Format HEIC/HEIF belum didukung. Ubah dulu ke JPG atau PNG, lalu unggah kembali.',
        },
        { status: 400 }
      );
    }

    const acceptedTypes = [...IMAGE_CONFIG.acceptedFormats];
    if (!acceptedTypes.includes(file.type as (typeof acceptedTypes)[number])) {
      return NextResponse.json(
        { error: 'Format tidak didukung. Gunakan: JPEG, PNG, atau WebP.' },
        { status: 400 }
      );
    }

    if (tooLarge(file.size)) return sizeError();

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const stored = await put(`products/${base}.${extension}`, file, {
      access: 'public',
      contentType: file.type,
      allowOverwrite: false,
    });

    return NextResponse.json(
      { url: stored.url, filename: stored.url.split('/').pop() },
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
