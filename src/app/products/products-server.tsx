/**
 * Products Server Component - Malaysian E-commerce Platform
 * React Server Component implementation for optimal performance
 * 
 * Benefits:
 * - Server-side data fetching and rendering
 * - Zero JavaScript bundle impact for static content
 * - Better SEO and faster initial page load
 * - Streaming support for progressive loading
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { productService } from '@/lib/services/product-service';
import { categoryService } from '@/lib/services/category-service';
import { ProductsClient } from './products-client';
import { ProductsHeader } from './components/ProductsHeader';
import { ProductsLoading } from './components/ProductsLoading';

interface SearchParams {
  search?: string;
  category?: string;
  sortBy?: string;
  page?: string;
}

interface ProductsServerProps {
  searchParams: SearchParams;
}

/**
 * Server Component for fetching and rendering products
 */
export async function ProductsServer({ searchParams }: ProductsServerProps) {
  try {
    // Parse search parameters
    const page = parseInt(searchParams.page || '1', 10);
    const search = searchParams.search?.trim();
    const category = searchParams.category;
    const sortBy = searchParams.sortBy || 'created-desc';

    // Server-side data fetching (runs on server, zero client bundle impact)
    const [sortField, sortOrder] = sortBy.split('-');
    const params = {
      page: Math.max(1, page),
      limit: 20,
      search: search || undefined,
      category: category !== 'all' ? category : undefined,
      sortBy: sortField as 'created' | 'name' | 'price' | 'rating',
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    // Parallel data fetching for optimal performance
    const [productsResult, categories] = await Promise.all([
      productService.getProducts(params),
      categoryService.getCategories({ includeProductCount: true }),
    ]);

    const { products, pagination } = productsResult;

    // Validate pagination
    if (page > pagination.totalPages && pagination.totalPages > 0) {
      notFound();
    }

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Server-rendered header with SEO data */}
        <ProductsHeader
          totalCount={pagination.totalCount}
          searchTerm={search}
          selectedCategory={category}
          categoryName={
            categories.find(cat => cat.id === category)?.name || 'All Categories'
          }
        />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Hydrate client component with server data */}
          <ProductsClient
            initialProducts={products}
            initialCategories={categories}
            initialPagination={pagination}
            initialParams={searchParams}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Products server error:', error);
    throw error; // Let Next.js error boundary handle this
  }
}

/**
 * Main Products Page Component with Suspense boundaries
 */
export default async function ProductsPage({ 
  searchParams 
}: { 
  searchParams: SearchParams 
}) {
  return (
    <Suspense 
      fallback={<ProductsLoading />}
      key={JSON.stringify(searchParams)} // Force re-suspend on param changes
    >
      <ProductsServer searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Generate metadata for SEO (Server Component)
 */
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  const search = searchParams.search?.trim();
  const category = searchParams.category;
  
  let title = 'Products - JRM E-commerce';
  let description = 'Browse our collection of quality products with member benefits and competitive prices.';

  if (search && category && category !== 'all') {
    // Get category name for title
    try {
      const categories = await categoryService.getCategories();
      const categoryName = categories.find(cat => cat.id === category)?.name || 'Products';
      title = `"${search}" in ${categoryName} - JRM E-commerce`;
      description = `Search results for "${search}" in ${categoryName} category. Find quality products with member discounts.`;
    } catch {
      title = `"${search}" - JRM E-commerce`;
      description = `Search results for "${search}". Find quality products with member discounts.`;
    }
  } else if (search) {
    title = `"${search}" - JRM E-commerce`;
    description = `Search results for "${search}". Find quality products with member discounts.`;
  } else if (category && category !== 'all') {
    try {
      const categories = await categoryService.getCategories();
      const categoryName = categories.find(cat => cat.id === category)?.name || 'Products';
      title = `${categoryName} - JRM E-commerce`;
      description = `Browse our ${categoryName.toLowerCase()} collection. Quality products with member benefits.`;
    } catch {
      // Fallback if category service fails
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}