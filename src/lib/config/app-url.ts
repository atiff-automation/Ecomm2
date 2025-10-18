/**
 * Application URL Configuration - Single Source of Truth
 * Centralized helper to get the application's public URL
 * CRITICAL: This URL is used for payment webhooks, redirects, and external integrations
 */

/**
 * Get the application's public URL
 * Throws error if not configured (fail fast in production)
 *
 * @param allowLocalhost - Allow localhost fallback (only for development/testing)
 * @returns The application's public URL
 */
export function getAppUrl(allowLocalhost: boolean = false): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // If URL is set, return it
  if (appUrl) {
    return appUrl;
  }

  // Development mode: allow localhost fallback
  if (allowLocalhost && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ NEXT_PUBLIC_APP_URL not set, using localhost fallback');
    return 'http://localhost:3000';
  }

  // Production mode: FAIL FAST - never use localhost
  throw new Error(
    '❌ NEXT_PUBLIC_APP_URL environment variable is required.\n' +
      '   This is critical for payment webhooks, redirects, and external integrations.\n' +
      '   Please set it in your deployment environment:\n' +
      '   - Railway: Add NEXT_PUBLIC_APP_URL=https://your-app.railway.app\n' +
      '   - Vercel: Add NEXT_PUBLIC_APP_URL=https://your-app.vercel.app\n' +
      '   - Local: Add NEXT_PUBLIC_APP_URL=http://localhost:3000 to .env'
  );
}

/**
 * Get the application's API URL
 * @param allowLocalhost - Allow localhost fallback (only for development/testing)
 * @returns The API base URL
 */
export function getApiUrl(allowLocalhost: boolean = false): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl) {
    return apiUrl;
  }

  // Fallback to appUrl + /api
  const appUrl = getAppUrl(allowLocalhost);
  return `${appUrl}/api`;
}

/**
 * Check if URL is localhost (for security warnings)
 */
export function isLocalhostUrl(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1');
}

/**
 * Validate URL is properly configured for production
 * Logs warnings if configuration issues are detected
 */
export function validateProductionUrl(url: string, context: string): void {
  if (process.env.NODE_ENV === 'production') {
    if (isLocalhostUrl(url)) {
      console.error(`⚠️ WARNING: ${context} uses localhost in production!`);
      console.error(`⚠️ URL: ${url}`);
      console.error(
        '⚠️ This will cause failures. Set NEXT_PUBLIC_APP_URL to your production domain.'
      );
    }

    if (!url.startsWith('https://')) {
      console.warn(`⚠️ WARNING: ${context} is not using HTTPS in production`);
      console.warn(`⚠️ URL: ${url}`);
    }
  }
}
