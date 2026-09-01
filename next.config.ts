import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  productionBrowserSourceMaps: false,
  // Optimized for Vercel deployment
  // Disable source maps in production
  // Mark heavy native/server packages as external to prevent large lambda bundle sizes
  serverExternalPackages: ['sharp', '@react-pdf/renderer', 'google-auth-library'],
  outputFileTracingExcludes: {
    '*': [
      './public/**/*',
    ],
  },
  experimental: {
    serverSourceMaps: false,
  },
  // Use turbopack for faster builds
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
    ],
    // Optimize images more aggressively
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
