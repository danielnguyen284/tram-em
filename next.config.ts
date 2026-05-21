import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  transpilePackages: ['lucide-react'],
  images: {
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'qr.sepay.vn' },
      { protocol: 'https', hostname: 'i.ibb.co' },
    ],
  },
  allowedDevOrigins: ['127.0.0.1', '127.0.0.1:3000', 'localhost:3000'],
};

export default withPWA(nextConfig);
