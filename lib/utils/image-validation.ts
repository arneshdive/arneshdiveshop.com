/**
 * Image validation utilities
 */

import { IMAGE_CONFIG, ImageValidationResult } from './image-config';

/**
 * Validate image file before processing
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file type
  const acceptedTypes = [...IMAGE_CONFIG.acceptedFormats];
  if (!acceptedTypes.includes(file.type as (typeof acceptedTypes)[number])) {
    return {
      valid: false,
      error: `Format tidak didukung. Gunakan: JPEG, PNG, WebP, atau HEIC.`,
    };
  }

  // Check file size
  if (file.size > IMAGE_CONFIG.maxFileSize) {
    const maxMB = Math.round(IMAGE_CONFIG.maxFileSize / (1024 * 1024));
    return {
      valid: false,
      error: `Ukuran file terlalu besar (maksimal ${maxMB}MB).`,
    };
  }

  // Warning for large files (but still valid)
  if (file.size > IMAGE_CONFIG.warnFileSize) {
    const sizeMB = Math.round((file.size / (1024 * 1024)) * 10) / 10;
    return {
      valid: true,
      warning: `File besar (${sizeMB}MB), akan dioptimasi otomatis.`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions from a file
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  width: number,
  height: number
): ImageValidationResult {
  const { minDimensions, maxDimensions } = IMAGE_CONFIG;

  if (width < minDimensions.width || height < minDimensions.height) {
    return {
      valid: false,
      error: `Resolusi terlalu kecil. Minimal ${minDimensions.width}×${minDimensions.height} pixel.`,
    };
  }

  if (width > maxDimensions.width || height > maxDimensions.height) {
    return {
      valid: false,
      error: `Resolusi terlalu besar. Maksimal ${maxDimensions.width}×${maxDimensions.height} pixel.`,
    };
  }

  return { valid: true };
}

/**
 * Full image validation (file + dimensions)
 */
export async function validateImage(
  file: File
): Promise<ImageValidationResult & { dimensions?: { width: number; height: number } }> {
  // Validate file first
  const fileResult = validateImageFile(file);
  if (!fileResult.valid) {
    return fileResult;
  }

  // Check dimensions
  const dimensions = await getImageDimensions(file);
  if (!dimensions) {
    return {
      valid: false,
      error: 'Tidak dapat membaca dimensi gambar. File mungkin rusak.',
    };
  }

  const dimResult = validateImageDimensions(dimensions.width, dimensions.height);
  if (!dimResult.valid) {
    return dimResult;
  }

  return {
    valid: true,
    warning: fileResult.warning,
    dimensions,
  };
}
