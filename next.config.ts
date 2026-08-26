import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Images are served straight from Vercel Blob and /public, never through
    // /_next/image. Vercel's optimizer bills one transformation per unique
    // (image, width, quality): with ~780 catalogue images and the default
    // eight device widths plus seven image widths, browsing the catalogue
    // exhausted the account's quota and every image on the site started
    // coming back 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED. Most sources
    // are already 1080x1080 at 40-100KB, so there was little to gain from
    // resizing them on the fly anyway. Sizing is handled at upload time
    // instead — see app/api/upload/route.ts.
    unoptimized: true,
    // Kept so the optimizer stays correctly configured if it is ever re-enabled.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/sale', destination: '/produk?onSale=true', permanent: true },
      { source: '/freediving', destination: '/produk?divingType=freediving', permanent: true },
      { source: '/scuba', destination: '/produk?divingType=scuba', permanent: true },
      { source: '/aksesoris', destination: '/produk?category=aksesoris', permanent: true },
    ];
  },
};

export default nextConfig;
