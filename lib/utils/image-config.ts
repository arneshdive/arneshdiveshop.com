/**
 * Image upload configuration for product images
 * Based on 2026 best practices for e-commerce
 */

export const IMAGE_CONFIG = {
  // Upload limits
  // Vercel rejects request bodies over ~4.5MB at the edge, before the upload
  // route ever runs, and answers with plain text rather than JSON. This was
  // set to 20MB, so anything in between failed with a JSON parse error and no
  // usable explanation. Stay under the platform limit with room for multipart
  // overhead, and say so honestly in the UI.
  maxFileSize: 4 * 1024 * 1024, // 4MB
  warnFileSize: 2 * 1024 * 1024, // 2MB - warn but still process

  // Formats a browser can display, so they are safe to store and serve as-is.
  acceptedFormats: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ] as const,

  // Formats that must be converted before anything can display them. HEIC
  // uploads used to work only because Vercel's image optimizer quietly
  // converted them on the way out; with that turned off (see next.config.ts)
  // storing one would leave a picture that Chrome, Firefox and Edge cannot
  // render. They are rejected until the upload route can convert them itself,
  // which needs sharp to be available at runtime.
  conversionOnlyFormats: [
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
