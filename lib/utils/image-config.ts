/**
 * Image upload configuration for product images
 * Based on 2026 best practices for e-commerce
 */

export const IMAGE_CONFIG = {
  // Upload limits
  maxFileSize: 20 * 1024 * 1024, // 20MB - accept modern phone/camera photos
  warnFileSize: 5 * 1024 * 1024, // 5MB - warn but still process

  // Accepted formats (MIME types)
  acceptedFormats: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ] as const,

  // Output settings
  output: {
    format: 'webp' as const,
    quality: 80,
  },

  // Dimensions
  minDimensions: {
    width: 500,
    height: 500,
  },
  maxDimensions: {
    width: 5000,
    height: 5000,
  },

  // Generated variants
  variants: {
    main: {
      width: 2000,
      height: 2000,
      maxSizeKB: 450,
    },
    medium: {
      width: 800,
      height: 800,
      maxSizeKB: 150,
    },
    thumbnail: {
      width: 400,
      height: 400,
      maxSizeKB: 50,
    },
  },
} as const;

export type ImageVariant = keyof typeof IMAGE_CONFIG.variants;

export interface ProcessedImage {
  variant: ImageVariant;
  url: string;
  width: number;
  height: number;
  sizeKB: number;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}
