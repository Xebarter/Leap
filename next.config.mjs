/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix for "Failed to fetch" errors in development with Turbopack
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Improve HMR reliability
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Empty Turbopack config to acknowledge Next.js 16 migration
  turbopack: {},
}

export default nextConfig
