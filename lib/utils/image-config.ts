/**
 * Image upload configuration for product images
 * Based on 2026 best practices for e-commerce
 */

export const IMAGE_CONFIG = {
  // Two different limits, because the file an admin picks is no longer the
  // file that gets sent.

  // What may be selected. The browser downscales before uploading, so this is
  // bounded by what a phone can decode without running out of memory rather
  // than by anything on the server.
  maxInputFileSize: 25 * 1024 * 1024, // 25MB

  // What may actually arrive at the route. Vercel rejects request bodies over
  // ~4.5MB at the edge, before the route runs, answering in plain text rather
  // than JSON — that limit cannot be raised by configuration. Downscaled
  // variants come to roughly 600KB together, so this is only a safety net for
  // the fallback path that uploads an unprocessed file.
  maxUploadSize: 4 * 1024 * 1024, // 4MB

  // Formats a browser can display, so they are safe to store and serve as-is.
  acceptedFormats: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ] as const,

  // Formats nothing in the pipeline can read. HEIC uploads used to work only
  // because Vercel's image optimizer quietly converted them on the way out;
  // with that turned off (see next.config.ts) storing one would leave a
  // picture that Chrome, Firefox and Edge cannot render — and those same
  // browsers cannot decode HEIC to a canvas either, so they cannot be
  // downscaled on the way in. iOS generally converts to JPEG by itself when
  // the file input does not list HEIC, which covers the common case.
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

