/**
 * Products Header Server Component
 * Server-rendered header with SEO-optimized content
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Percent, Star } from 'lucide-react';
import {
  FILTER_LABELS,
  PRODUCT_FILTER_PARAMS,
} from '@/lib/constants/product-filter-constants';

interface ProductsHeaderProps {
  totalCount: number;
  searchTerm?: string;
  selectedCategory?: string;
  categoryName?: string;
  isPromotional?: boolean;
  isFeatured?: boolean;
}

export function ProductsHeader({
  totalCount,
  searchTerm,
  selectedCategory,
  categoryName = 'All Categories',
  isPromotional = false,
  isFeatured = false,
}: ProductsHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Generate dynamic title and description based on search/filter state
  let title = 'Products';
  let description = '';

  // Build filter prefix for title
  const filterPrefix = [];
  if (isPromotional) filterPrefix.push('Promotional');
  if (isFeatured) filterPrefix.push('Featured');
  const filterPrefixStr =
    filterPrefix.length > 0 ? filterPrefix.join(' & ') + ' ' : '';

  if (searchTerm && selectedCategory && selectedCategory !== 'all') {
    title = `"${searchTerm}" in ${filterPrefixStr}${categoryName}`;
    description = `${totalCount} product${totalCount !== 1 ? 's' : ''} found`;
  } else if (searchTerm) {
    title = `Search: "${searchTerm}"`;
    description = `${totalCount} product${totalCount !== 1 ? 's' : ''} found`;
  } else if (selectedCategory && selectedCategory !== 'all') {
    title = `${filterPrefixStr}${categoryName}`;
    description = `${totalCount} product${totalCount !== 1 ? 's' : ''} in this category`;
  } else if (isPromotional || isFeatured) {
    title = `${filterPrefixStr}Products`;
    description = `${totalCount} product${totalCount !== 1 ? 's' : ''} available`;
  } else {
    description =
      totalCount > 0
        ? `${totalCount} products available`
        : 'No products available';
  }

  // Handle filter removal
  const removeFilter = (filterParam: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete(filterParam);
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  // Check if any filters are active
  const hasActiveFilters = isPromotional || isFeatured;

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>

          {/* Structured data for search engines */}
          {searchTerm && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'SearchResultsPage',
                  mainEntity: {
                    '@type': 'ItemList',
                    numberOfItems: totalCount,
                    name: `Search results for "${searchTerm}"`,
                  },
                }),
              }}
            />
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {isPromotional && (
            <Badge
              variant="secondary"
              className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 gap-1.5"
            >
              <Percent className="w-3 h-3" />
              {FILTER_LABELS.PROMOTIONAL}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent ml-1"
                onClick={() => removeFilter(PRODUCT_FILTER_PARAMS.PROMOTIONAL)}
                aria-label={`Remove ${FILTER_LABELS.PROMOTIONAL} filter`}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          {isFeatured && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 gap-1.5"
            >
              <Star className="w-3 h-3" />
              {FILTER_LABELS.FEATURED}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent ml-1"
                onClick={() => removeFilter(PRODUCT_FILTER_PARAMS.FEATURED)}
                aria-label={`Remove ${FILTER_LABELS.FEATURED} filter`}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
