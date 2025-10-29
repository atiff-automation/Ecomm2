/**
 * Product Sorting Utilities
 * Single Source of Truth for all product sorting logic
 *
 * This module provides centralized sorting utilities to ensure
 * consistent featured product priority across the application.
 */

import { Prisma } from '@prisma/client';

/**
 * Sort order types for Prisma queries
 */
type SortOrder = 'asc' | 'desc';

/**
 * Valid product sort fields
 */
export type ProductSortField = 'name' | 'price' | 'created' | 'rating';

/**
 * Product ordering configuration for Prisma
 */
export type ProductOrderBy = Prisma.ProductOrderByWithRelationInput[];

/**
 * Creates a Prisma orderBy configuration with featured products first
 *
 * @param sortField - The primary sort field (name, price, created, rating)
 * @param sortOrder - Sort direction ('asc' or 'desc')
 * @param includeFeaturedFirst - Whether to prioritize featured products (default: true)
 * @returns Prisma orderBy configuration array
 *
 * @example
 * // Featured products first, then by creation date (newest first)
 * const orderBy = buildProductOrderBy('created', 'desc', true);
 *
 * // Sort by price only (no featured priority)
 * const orderBy = buildProductOrderBy('price', 'asc', false);
 */
export function buildProductOrderBy(
  sortField: ProductSortField,
  sortOrder: SortOrder = 'desc',
  includeFeaturedFirst: boolean = true
): ProductOrderBy {
  const orderBy: ProductOrderBy = [];

  // Add featured-first sorting if enabled
  if (includeFeaturedFirst) {
    orderBy.push({ featured: 'desc' });
  }

  // Add primary sort field
  switch (sortField) {
    case 'name':
      orderBy.push({ name: sortOrder });
      break;
    case 'price':
      orderBy.push({ regularPrice: sortOrder });
      break;
    case 'created':
      orderBy.push({ createdAt: sortOrder });
      break;
    case 'rating':
      // For rating sort, fallback to createdAt for now
      // TODO: Implement average rating sorting with computed field
      orderBy.push({ createdAt: sortOrder });
      break;
  }

  return orderBy;
}

/**
 * Determines if featured-first sorting should be applied based on query context
 *
 * Business Rule: Featured products appear first when:
 * - No search query (relevance more important than featured status during search)
 * - Has category filter OR no feature filters (default browse behavior)
 *
 * @param hasSearch - Whether a search query is present
 * @param hasCategory - Whether a category filter is present
 * @param hasFeatures - Whether feature filters are applied
 * @returns true if featured-first sorting should be applied
 *
 * @example
 * // Default browse - featured first
 * shouldPrioritizeFeatured(false, false, false) // true
 *
 * // Category filter - featured first
 * shouldPrioritizeFeatured(false, true, false) // true
 *
 * // Search query - relevance first
 * shouldPrioritizeFeatured(true, false, false) // false
 */
export function shouldPrioritizeFeatured(
  hasSearch: boolean,
  hasCategory?: boolean,
  hasFeatures?: boolean
): boolean {
  return !hasSearch && (!!hasCategory || !hasFeatures);
}

/**
 * Comparator function for in-memory sorting of products by featured status
 * Use this when database-level sorting is not possible
 *
 * @param a - First product
 * @param b - Second product
 * @returns Negative if a should come first, positive if b should come first, 0 if equal
 *
 * @example
 * const sortedProducts = products.sort((a, b) => {
 *   const featuredSort = compareFeaturedStatus(a, b);
 *   if (featuredSort !== 0) return featuredSort;
 *   // Apply secondary sorting
 *   return b.createdAt.getTime() - a.createdAt.getTime();
 * });
 */
export function compareFeaturedStatus<T extends { featured: boolean }>(
  a: T,
  b: T
): number {
  // Featured products first (true > false)
  if (a.featured !== b.featured) {
    return b.featured ? 1 : -1;
  }
  return 0;
}

/**
 * Standard featured-first orderBy for general use
 * Sorts by featured (desc), then by creation date (newest first)
 */
export const FEATURED_FIRST_ORDER_BY: ProductOrderBy = [
  { featured: 'desc' },
  { createdAt: 'desc' },
];

/**
 * Standard orderBy without featured priority
 * Sorts by creation date only (newest first)
 */
export const DEFAULT_ORDER_BY: ProductOrderBy = [
  { createdAt: 'desc' },
];
