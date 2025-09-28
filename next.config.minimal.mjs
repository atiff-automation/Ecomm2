/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for stable Railway builds
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // Minimal transpile packages
  transpilePackages: ['archiver', 'archiver-utils'],

  // No experimental features for maximum stability
  experimental: {
    serverComponentsExternalPackages: [
      'ioredis',
      '@prisma/client'
    ],
  },

  // Basic optimizations only
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Basic image configuration
  images: {
    domains: ['localhost'],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },

  // Minimal webpack configuration
  webpack: (config) => {
    // Basic lodash resolution only
    config.resolve.alias = {
      ...config.resolve.alias,
      'lodash/flatten': 'lodash/flatten.js',
      'lodash/difference': 'lodash/difference.js',
      'lodash/union': 'lodash/union.js',
      'lodash/isPlainObject': 'lodash/isPlainObject.js',
      'lodash/defaults': 'lodash/defaults.js',
    };
    return config;
  },

  // Basic optimizations
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
};

export default nextConfig;