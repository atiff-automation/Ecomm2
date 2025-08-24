/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable instrumentation for server-side initialization
  experimental: {
    instrumentationHook: true,
    // Enable server components for better performance
    serverComponentsExternalPackages: ['ioredis', '@prisma/client'],
    // Optimize CSS imports
    optimizeCss: true,
    // Enable experimental features
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Bundle size optimization
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable React optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Images optimization
  images: {
    // Only allow localhost for development (internal uploads are served from same domain)
    domains: ['localhost'],
    // Default Next.js image optimization for internal uploads
    formats: ['image/webp', 'image/avif'],
    // Enable image optimization
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },

  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer in development
    if (dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }

    // Optimize chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            priority: 20,
            reuseExistingChunk: true,
          },
          admin: {
            test: /[\\/]src[\\/](app|components)[\\/]admin[\\/]/,
            name: 'admin',
            priority: 30,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Tree shaking for lodash
    config.resolve.alias = {
      ...config.resolve.alias,
      'lodash': 'lodash-es',
    };

    // Optimize imports
    config.optimization.providedExports = true;
    config.optimization.usedExports = true;

    return config;
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Static optimization
  trailingSlash: false,
  
  // Environment variables for build optimization
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
  },
};

export default nextConfig;
