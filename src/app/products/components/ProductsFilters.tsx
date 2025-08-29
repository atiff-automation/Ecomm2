/**
 * Products Filters Client Component
 * Interactive filtering controls
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface ProductsFiltersProps {
  categories: Category[];
  currentSearch: string;
  currentCategory: string;
  currentSort: string;
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (sortBy: string) => void;
  onClearFilters: () => void;
  disabled?: boolean;
}

export function ProductsFilters({
  categories,
  currentSearch,
  currentCategory,
  currentSort,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onClearFilters,
  disabled = false,
}: ProductsFiltersProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Debounce search input to avoid too many API calls
  const debouncedSearch = useDebounce(searchInput, 500);

  // Trigger search when debounced value changes
  useState(() => {
    if (debouncedSearch !== currentSearch) {
      onSearchChange(debouncedSearch);
    }
  });

  // Clear search input
  const clearSearch = useCallback(() => {
    setSearchInput('');
    onSearchChange('');
  }, [onSearchChange]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      currentSearch !== '' ||
      currentCategory !== 'all' ||
      currentSort !== 'created-desc'
    );
  }, [currentSearch, currentCategory, currentSort]);

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              disabled={disabled}
              className="h-8 px-2 lg:px-3"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-10 pr-10"
              disabled={disabled}
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={clearSearch}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {currentSearch && (
            <p className="text-xs text-muted-foreground">
              Searching for: "{currentSearch}"
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={currentCategory}
            onValueChange={onCategoryChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Categories
                {categories.length > 0 && (
                  <span className="text-muted-foreground ml-1">
                    (
                    {categories.reduce(
                      (sum, cat) => sum + (cat.productCount || 0),
                      0
                    )}
                    )
                  </span>
                )}
              </SelectItem>
              {Array.isArray(categories) &&
                categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                    {typeof category.productCount === 'number' && (
                      <span className="text-muted-foreground ml-1">
                        ({category.productCount})
                      </span>
                    )}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sort By</label>
          <Select
            value={currentSort}
            onValueChange={onSortChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created-desc">Newest First</SelectItem>
              <SelectItem value="created-asc">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="price-asc">Price Low-High</SelectItem>
              <SelectItem value="price-desc">Price High-Low</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
              <SelectItem value="rating-asc">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-muted-foreground mb-2">
              Active filters:
            </p>
            <div className="flex flex-wrap gap-1">
              {currentSearch && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Search: "{currentSearch}"
                </span>
              )}
              {currentCategory !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  {categories.find(cat => cat.id === currentCategory)?.name ||
                    'Category'}
                </span>
              )}
              {currentSort !== 'created-desc' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  {currentSort.split('-')[0] === 'created'
                    ? 'Date'
                    : currentSort.split('-')[0] === 'name'
                      ? 'Name'
                      : currentSort.split('-')[0] === 'price'
                        ? 'Price'
                        : 'Rating'}
                  : {currentSort.split('-')[1] === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
