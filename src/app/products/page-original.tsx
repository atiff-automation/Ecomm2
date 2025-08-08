/**
 * Products Listing Page - Malaysian E-commerce Platform
 * Responsive product grid with advanced filtering and search
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Heart,
  ShoppingCart,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  regularPrice: number;
  memberPrice: number;
  stockQuantity: number;
  featured: boolean;
  isPromotional: boolean;
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
  productCount?: number;
}

interface ProductFilters {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  featured: boolean;
  sortBy: 'name' | 'price' | 'created' | 'rating';
  sortOrder: 'asc' | 'desc';
}

const INITIAL_FILTERS: ProductFilters = {
  search: '',
  category: '',
  minPrice: 0,
  maxPrice: 10000,
  inStock: false,
  featured: false,
  sortBy: 'created',
  sortOrder: 'desc',
};

export default function ProductsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ProductFilters>(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  // Initialize filters from URL params
  useEffect(() => {
    const initialFilters = { ...INITIAL_FILTERS };

    searchParams.forEach((value, key) => {
      if (key in initialFilters) {
        if (key === 'minPrice' || key === 'maxPrice') {
          (initialFilters as Record<string, any>)[key] =
            parseInt(value, 10) || 0;
        } else if (key === 'inStock' || key === 'featured') {
          (initialFilters as Record<string, any>)[key] = value === 'true';
        } else if (key === 'category' && !value) {
          // Skip empty category values from URL
          return;
        } else {
          (initialFilters as Record<string, any>)[key] = value;
        }
      }
    });

    setFilters(initialFilters);
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.search) {
        params.append('search', filters.search);
      }
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
      if (filters.featured) {
        params.append('featured', 'true');
      }

      const response = await fetch(`/api/products?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Update URL when filters change (with debounce to prevent infinite loops)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== INITIAL_FILTERS[key as keyof ProductFilters]) {
          params.append(key, value.toString());
        }
      });

      if (currentPage > 1) {
        params.append('page', currentPage.toString());
      }

      const newURL = `/products${params.toString() ? `?${params}` : ''}`;
      router.replace(newURL, { scroll: false });
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, currentPage, router]);

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    // Handle "all" categories as empty string
    if (key === 'category' && value === 'all') {
      value = '';
    }
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Added to cart successfully');

        // Trigger cart refresh by dispatching custom event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const primaryImage =
      product.images.find(img => img.isPrimary) || product.images[0];
    const isLoggedIn = !!session?.user;
    const isMember = session?.user?.isMember;
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
            {product.isPromotional && (
              <Badge variant="destructive">Promo</Badge>
            )}
            {product.stockQuantity === 0 && (
              <Badge variant="outline" className="bg-white">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
              <Heart className="w-4 h-4" />
            </Button>
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
              onClick={() => handleAddToCart(product.id)}
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            {totalCount > 0
              ? `${totalCount} products found`
              : 'No products found'}
          </p>
        </div>

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

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={filters.category || 'all'}
                  onValueChange={value => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} ({category.productCount || 0})
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

              {/* Checkboxes */}
              <div className="space-y-3">
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={filters.featured}
                    onCheckedChange={checked =>
                      handleFilterChange('featured', checked)
                    }
                  />
                  <label htmlFor="featured" className="text-sm font-medium">
                    Featured Products
                  </label>
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={value => {
                    const [sortBy, sortOrder] = value.split('-');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
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
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-t-lg" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchProducts}>Try Again</Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No products found matching your criteria.
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
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
                          variant={currentPage === page ? 'default' : 'outline'}
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
    </div>
  );
}
