import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
