/**
 * Products Page - Malaysian E-commerce Platform
 * React Server Component implementation for optimal performance
 *
 * This page uses the new App Router with Server Components to:
 * - Pre-render content on the server for faster initial loads
 * - Generate dynamic metadata for better SEO
 * - Implement Suspense boundaries for progressive loading
 * - Reduce client-side JavaScript bundle size
 */

import ProductsPage from './products-server';

// Re-export the server component and metadata
export { generateMetadata } from './products-server';
export default ProductsPage;
