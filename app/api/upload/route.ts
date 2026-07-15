import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAdmin } from '@/lib/auth/admin';
import { IMAGE_CONFIG } from '@/lib/utils/image-config';

// POST /api/upload - Upload image to Vercel Blob
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(await auth.error.json(), { status: auth.error.status });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Validate file type
    const acceptedTypes = [...IMAGE_CONFIG.acceptedFormats];
    if (!acceptedTypes.includes(file.type as (typeof acceptedTypes)[number])) {
      return NextResponse.json(
        { error: 'Format tidak didukung. Gunakan: JPEG, PNG, WebP, atau HEIC.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > IMAGE_CONFIG.maxFileSize) {
      const maxMB = Math.round(IMAGE_CONFIG.maxFileSize / (1024 * 1024));
      return NextResponse.json(
        { error: `Ukuran file terlalu besar (maksimal ${maxMB}MB)` },
        { status: 400 }
      );
    }

    // Convert HEIC/HEIF to standard format (store as-is, browser/client will handle)
    // Note: HEIC files will be stored, but Next.js Image optimization handles them
    let extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Normalize extension for HEIC/HEIF
    if (extension === 'heic' || extension === 'heif') {
      extension = 'jpg'; // Will be served as JPEG via Vercel's image optimization
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `products/${timestamp}-${randomString}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    // Check if warning should be shown
    const showWarning = file.size > IMAGE_CONFIG.warnFileSize;

    return NextResponse.json({ 
      url: blob.url,
      filename: blob.pathname,
      warning: showWarning ? 'Gambar akan dioptimasi otomatis' : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah gambar' },
      { status: 500 }
    );
  }
}
