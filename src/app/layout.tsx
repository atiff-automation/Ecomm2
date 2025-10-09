import type { Metadata } from 'next';
import localFont from 'next/font/local';
import React, { Suspense } from 'react';
import AuthProvider from '@/components/auth/AuthProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { Toaster } from 'sonner';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import { MonitoringProvider } from '@/lib/monitoring/monitoring-provider';
import { DynamicFavicon } from '@/components/favicon/DynamicFavicon';
import { SimpleN8nChatLoader } from '@/components/chat/SimpleN8nChatLoader';
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true, // Preload primary font for performance
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
  fallback: ['monospace'],
  preload: false, // Don't preload secondary font
});

export const metadata: Metadata = {
  title: {
    template: '%s | JRM E-commerce',
    default: 'JRM E-commerce - Malaysian Online Store with Membership',
  },
  description:
    'Complete Malaysian e-commerce platform with intelligent membership system, dual pricing, and local payment integration.',
  keywords: [
    'malaysia',
    'ecommerce',
    'online store',
    'membership',
    'shopping',
    'retail',
  ],
  authors: [{ name: 'JRM E-commerce Team' }],
  creator: 'JRM E-commerce',
  publisher: 'JRM E-commerce',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: '/',
    title: 'JRM E-commerce - Malaysian Online Store',
    description:
      'Complete Malaysian e-commerce platform with intelligent membership system',
    siteName: 'JRM E-commerce',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JRM E-commerce - Malaysian Online Store',
    description:
      'Complete Malaysian e-commerce platform with intelligent membership system',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Loading component for Suspense boundaries
function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* DNS prefetch for commonly used domains */}
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#2563eb" />

        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta
          httpEquiv="Referrer-Policy"
          content="strict-origin-when-cross-origin"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalErrorBoundary>
          <MonitoringProvider
            config={{
              enableErrorReporting: false,
              enablePerformanceMonitoring: false,
              enableUserTracking: false,
              sampleRate: 0,
            }}
          >
            <ReactQueryProvider>
              <AuthProvider>
                <DynamicFavicon />
                <Suspense fallback={<PageLoading />}>
                  <MainLayout>{children}</MainLayout>
                </Suspense>
                <Toaster
                  position="top-right"
                  duration={3000}
                  pauseWhenPageIsHidden
                  closeButton
                  richColors
                  expand={false}
                  visibleToasts={4}
                  toastOptions={{
                    style: {
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      color: '#374151',
                    },
                    className: 'group',
                    descriptionClassName: 'group-[.toast]:text-muted-foreground',
                  }}
                />
                <SimpleN8nChatLoader />
              </AuthProvider>
            </ReactQueryProvider>
          </MonitoringProvider>
        </GlobalErrorBoundary>

        {/* Initialize performance optimizations */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                // Track initial page load performance
                window.addEventListener('load', function() {
                  if (window.performance && window.performance.navigation) {
                    const loadTime = window.performance.now();
                    console.log('Page load time:', Math.round(loadTime) + 'ms');
                  }
                });
                
                // Performance monitoring is handled by the MonitoringProvider
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
