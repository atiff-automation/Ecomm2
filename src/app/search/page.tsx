/**
 * Search Results Page - Malaysian E-commerce Platform
 * Advanced search with filters, suggestions, and analytics
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  ShoppingCart,
  X,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import React from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { WishlistButton } from '@/components/wishlist/WishlistButton';

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  regularPrice: number;
  memberPrice: number;
  stockQuantity: number;
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SearchFilters {
  category: string;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  rating: number;
  sortBy: 'relevance' | 'price' | 'rating' | 'newest' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

interface Suggestion {
  type: 'product' | 'category' | 'popular';
  text: string;
  url: string;
}

const INITIAL_FILTERS: SearchFilters = {
  category: '',
  minPrice: 0,
  maxPrice: 10000,
  inStock: false,
  rating: 0,
  sortBy: 'relevance',
  sortOrder: 'desc',
};

export default function SearchPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS);
  const [suggestions, setSuggestions] = useState<{
    [key: string]: Suggestion[];
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  // Debounced query for suggestions
  const debouncedQuery = useDebounce(query, 300);

  // Initialize from URL params
  useEffect(() => {
    const initialQuery = searchParams.get('q') || '';
    const initialFilters = { ...INITIAL_FILTERS };

    searchParams.forEach((value, key) => {
      if (key in initialFilters && key !== 'q') {
        if (key === 'minPrice' || key === 'maxPrice' || key === 'rating') {
          (initialFilters as any)[key] = parseInt(value, 10) || 0;
        } else if (key === 'inStock') {
          (initialFilters as any)[key] = value === 'true';
        } else {
          (initialFilters as any)[key] = value;
        }
      }
    });

    setQuery(initialQuery);
    setFilters(initialFilters);
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories?includeProductCount=true');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async () => {
    if (!query.trim()) {
      setProducts([]);
      setTotalCount(0);
      setTotalPages(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        q: query,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.category) {
        params.append('category', filters.category);
      }
      if (filters.minPrice > 0) {
        params.append('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice < 10000) {
        params.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters.inStock) {
        params.append('inStock', 'true');
      }
      if (filters.rating > 0) {
        params.append('rating', filters.rating.toString());
      }

      const response = await fetch(`/api/search?${params}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setProducts(data.products);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query, filters, currentPage]);

  // Get search suggestions
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions({});
      return;
    }

    try {
      const response = await fetch(
        `/api/search?suggestions=true&q=${encodeURIComponent(searchQuery)}&limit=8`
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    searchProducts();
  }, [searchProducts]);

  useEffect(() => {
    if (debouncedQuery && showSuggestions) {
      getSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, showSuggestions, getSuggestions]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (query) {
      params.append('q', query);
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== INITIAL_FILTERS[key as keyof SearchFilters]) {
        params.append(key, value.toString());
      }
    });

    if (currentPage > 1) {
      params.append('page', currentPage.toString());
    }

    const newURL = `/search${params.toString() ? `?${params}` : ''}`;
    router.push(newURL, { scroll: false });
  }, [query, filters, currentPage, router]);

  useEffect(() => {
    if (
      query ||
      Object.keys(filters).some(
        key =>
          filters[key as keyof SearchFilters] !==
          INITIAL_FILTERS[key as keyof SearchFilters]
      )
    ) {
      updateURL();
    }
  }, [updateURL, query, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setShowSuggestions(false);
    searchProducts();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'product' || suggestion.type === 'popular') {
      if (suggestion.url.startsWith('/search')) {
        const url = new URL(suggestion.url, window.location.origin);
        setQuery(url.searchParams.get('q') || '');
      } else {
        router.push(suggestion.url);
      }
    } else {
      router.push(suggestion.url);
    }
    setShowSuggestions(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const allSuggestions = useMemo(() => {
    return [
      ...(suggestions.products || []),
      ...(suggestions.categories || []),
      ...(suggestions.popular || []),
    ];
  }, [suggestions]);

  const ProductCard = ({ product }: { product: Product }) => {
    const primaryImage =
      product.images.find(img => img.isPrimary) || product.images[0];
    const showMemberPrice = isLoggedIn && isMember;
    const savings = product.regularPrice - product.memberPrice;

    return (
      <Card className="group hover:shadow-lg transition-shadow duration-200">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.altText || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured && (
              <Badge variant="secondary" className="bg-yellow-500 text-white">
                Featured
              </Badge>
            )}
            {product.stockQuantity === 0 && (
              <Badge variant="outline" className="bg-white">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <WishlistButton
              productId={product.id}
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
            />
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Category */}
            <Link
              href={`/products?category=${product.category.id}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {product.category.name}
            </Link>

            {/* Product Name */}
            <Link href={`/products/${product.slug}`}>
              <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                {product.name}
              </h3>
            </Link>

            {/* Description */}
            {product.shortDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.shortDescription}
              </p>
            )}

            {/* Rating */}
            {product.averageRating > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= product.averageRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  ({product.reviewCount})
                </span>
              </div>
            )}

            {/* Pricing */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  {showMemberPrice ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-green-600">
                          {formatPrice(product.memberPrice)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Member
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.regularPrice)}
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          Save {formatPrice(savings)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="font-bold text-lg">
                        {formatPrice(product.regularPrice)}
                      </span>
                      {!isLoggedIn &&
                        product.memberPrice < product.regularPrice && (
                          <div className="text-xs text-muted-foreground">
                            Member price: {formatPrice(product.memberPrice)}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full"
              disabled={product.stockQuantity === 0}
              onClick={async () => {
                if (!isLoggedIn) {
                  window.location.href = '/auth/signin';
                  return;
                }

                if (product.stockQuantity === 0) {
                  return;
                }

                try {
                  const response = await fetch('/api/cart', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      productId: product.id,
                      quantity: 1,
                    }),
                  });

                  if (response.ok) {
                    const data = await response.json();
                    // You could add a toast notification here
                    console.log('Added to cart:', data.message);
                  } else {
                    const data = await response.json();
                    alert(data.message || 'Failed to add to cart');
                  }
                } catch (error) {
                  console.error('Failed to add to cart:', error);
                  alert('Failed to add to cart');
                }
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products, brands, categories..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-12 pr-12 h-12 text-lg"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              size="sm"
            >
              Search
            </Button>
          </form>

          {/* Search Suggestions */}
          {showSuggestions && allSuggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
              <CardContent className="p-0">
                {allSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="text-sm">{suggestion.text}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize">
                        {suggestion.type}
                      </span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search Results Summary */}
        {query && (
          <div className="text-center mt-6">
            <h1 className="text-2xl font-bold mb-2">
              {loading ? 'Searching...' : `Search results for "${query}"`}
            </h1>
            {!loading && (
              <p className="text-muted-foreground">
                {totalCount > 0
                  ? `Found ${totalCount} ${totalCount === 1 ? 'product' : 'products'}`
                  : 'No products found'}
              </p>
            )}
          </div>
        )}
      </div>

      {query && (
        <>
          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Sort Options */}
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={value => {
                const [sortBy, sortOrder] = value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance-desc">Most Relevant</SelectItem>
                <SelectItem value="newest-desc">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating-desc">Highest Rated</SelectItem>
                <SelectItem value="popularity-desc">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div
              className={`lg:w-80 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}
            >
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={filters.category}
                      onValueChange={value =>
                        handleFilterChange('category', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Price Range</label>
                    <div className="px-2">
                      <Slider
                        value={[filters.minPrice, filters.maxPrice]}
                        onValueChange={([min, max]) => {
                          handleFilterChange('minPrice', min);
                          handleFilterChange('maxPrice', max);
                        }}
                        max={10000}
                        step={50}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formatPrice(filters.minPrice)}</span>
                      <span>{formatPrice(filters.maxPrice)}</span>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Minimum Rating
                    </label>
                    <div className="space-y-2">
                      {[4, 3, 2, 1].map(rating => (
                        <div
                          key={rating}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`rating-${rating}`}
                            checked={filters.rating === rating}
                            onCheckedChange={checked =>
                              handleFilterChange('rating', checked ? rating : 0)
                            }
                          />
                          <label
                            htmlFor={`rating-${rating}`}
                            className="flex items-center gap-1 text-sm cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-1">& up</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* In Stock Filter */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={filters.inStock}
                      onCheckedChange={checked =>
                        handleFilterChange('inStock', checked)
                      }
                    />
                    <label htmlFor="inStock" className="text-sm font-medium">
                      In Stock Only
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Searching...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => searchProducts()}>Try Again</Button>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {query
                      ? `No products found for "${query}"`
                      : 'Enter a search query to find products'}
                  </p>
                  {query && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Try:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Checking your spelling</li>
                        <li>• Using more general terms</li>
                        <li>• Browsing our categories</li>
                      </ul>
                      <Button onClick={clearFilters} className="mt-4">
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Products Grid */}
                  <div
                    className={`grid gap-6 ${
                      viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1'
                    }`}
                  >
                    {products.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        disabled={currentPage <= 1}
                        onClick={() =>
                          setCurrentPage(prev => Math.max(1, prev - 1))
                        }
                      >
                        Previous
                      </Button>

                      <div className="flex gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const page = i + Math.max(1, currentPage - 2);
                          if (page > totalPages) {
                            return null;
                          }

                          return (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        disabled={currentPage >= totalPages}
                        onClick={() =>
                          setCurrentPage(prev => Math.min(totalPages, prev + 1))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
