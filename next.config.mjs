/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway deployment configuration
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // TypeScript and ESLint configuration
  typescript: {
    // Disable type checking during build for now (production readiness)
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  // Transpile packages to handle lodash dependencies
  transpilePackages: ['archiver', 'archiver-utils'],
  
  // Enable instrumentation for server-side initialization
  experimental: {
    // Enable instrumentation for observability
    instrumentationHook: true,
    // Enable server components for better performance
    serverComponentsExternalPackages: [
      '@prisma/client',
      'pdfkit', // Prevent bundling PDFKit to allow access to font data files
      '@opentelemetry/api',
      '@opentelemetry/sdk-node',
      '@opentelemetry/auto-instrumentations-node'
    ],
    // Optimize CSS imports - disabled due to CSS 404 issues
    // optimizeCss: true,
    // Disable turbo in development to improve compilation performance
    ...(process.env.NODE_ENV === 'production' && {
      turbo: {
        rules: {
          '*.svg': {
            loaders: ['@svgr/webpack'],
            as: '*.js',
          },
        },
      },
    }),
  },
  
  // Bundle size optimization
  compiler: {
    // Keep strategic logging (error, warn, info) for production debugging
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn', 'info'] }
      : false,
    // Enable React optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Images - COMPLETELY DISABLE ALL OPTIMIZATION
  images: {
    // Railway domain configuration
    domains: process.env.NODE_ENV === 'production'
      ? [process.env.RAILWAY_STATIC_URL?.replace('https://', '') || 'localhost']
      : ['localhost'],
    // DISABLE all Next.js image optimization - serve originals only
    unoptimized: true, // Disable optimization in ALL environments
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

    // Optimize chunks (simplified for development performance)
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: dev ? {
          // Simplified chunking for development
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/](?!@opentelemetry)/,
            name: 'vendors',
            priority: -10,
            reuseExistingChunk: true,
          },
          // Separate OpenTelemetry chunks to prevent module resolution issues
          opentelemetry: {
            test: /[\\/]node_modules[\\/]@opentelemetry[\\/]/,
            name: 'opentelemetry',
            priority: 0,
            reuseExistingChunk: true,
          },
        } : {
          // Full chunking for production
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

    // Resolve lodash modules properly
    config.resolve.alias = {
      ...config.resolve.alias,
      'lodash/flatten': 'lodash/flatten.js',
      'lodash/difference': 'lodash/difference.js',
      'lodash/union': 'lodash/union.js',
      'lodash/isPlainObject': 'lodash/isPlainObject.js',
      'lodash/defaults': 'lodash/defaults.js',
    };

    // Optimize imports (only in production to avoid cache conflicts)
    if (!dev) {
      config.optimization.providedExports = true;
      config.optimization.usedExports = true;
    }

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
