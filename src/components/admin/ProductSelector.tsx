/**
 * Product Selector Component
 * Searchable dropdown for selecting products in admin forms
 * Used in Click Page Product Card block settings
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Check,
  X,
  Package,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  regularPrice: number;
  stockQuantity: number;
  status: string;
}

interface ProductSelectorProps {
  value?: string; // Selected product ID
  onSelect: (
    productId: string,
    productSlug: string,
    productName: string
  ) => void;
  className?: string;
  label?: string;
  placeholder?: string;
  error?: string;
}

export function ProductSelector({
  value,
  onSelect,
  className,
  label = 'Select Product',
  placeholder = 'Search products by name, SKU, or slug...',
  error,
}: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch products on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setFetchError(null);

        const response = await fetch(
          '/api/admin/products?limit=100&status=ACTIVE'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);

        // If value is provided, find and set the selected product
        if (value && data.products) {
          const selected = data.products.find((p: Product) => p.id === value);
          if (selected) {
            setSelectedProduct(selected);
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setFetchError(
          err instanceof Error ? err.message : 'Failed to load products'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [value]);

  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(product => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query)
      );
    });

    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    return undefined;
  }, [isOpen]);

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery('');
    setIsOpen(false);
    onSelect(product.id, product.slug, product.name);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedProduct(null);
    setSearchQuery('');
    onSelect('', '', '');
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          <span className="text-destructive ml-1">*</span>
        </Label>
      )}

      {/* Selected Product Display / Search Input */}
      <div className="relative">
        {selectedProduct ? (
          <div className="flex items-center justify-between gap-2 p-3 border rounded-md bg-background">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedProduct.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  SKU: {selectedProduct.sku} •{' '}
                  {formatPrice(selectedProduct.regularPrice)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className={cn(
                'pl-9',
                error && 'border-destructive focus-visible:ring-destructive'
              )}
            />
          </div>
        )}

        {/* Dropdown List */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
            {loading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : fetchError ? (
              <Alert variant="destructive" className="m-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fetchError}</AlertDescription>
              </Alert>
            ) : filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery
                  ? 'No products found matching your search'
                  : 'No active products available'}
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="p-1">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 p-3 rounded-md hover:bg-accent transition-colors text-left',
                        selectedProduct?.id === product.id && 'bg-accent'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {product.sku} •{' '}
                            {formatPrice(product.regularPrice)} • Stock:{' '}
                            {product.stockQuantity}
                          </p>
                        </div>
                      </div>
                      {selectedProduct?.id === product.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Helper Text */}
      {!error && !selectedProduct && (
        <p className="text-xs text-muted-foreground">
          Search and select a product to display in this block
        </p>
      )}
    </div>
  );
}
