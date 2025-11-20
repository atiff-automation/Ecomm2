/**
 * ProductShowcaseSelector Component
 * Allows admins to search and select products for landing page showcase
 * Features: Search, drag-and-drop reordering, layout selection, 12 product limit
 */

'use client';

import React, { useState, useCallback } from 'react';
import { X, GripVertical, Search, Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LANDING_PAGE_CONSTANTS } from '@/lib/constants/landing-page-constants';
import Image from 'next/image';
import { useDebounce } from '@/hooks/use-debounce';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  stock: number;
  status: string;
  category: {
    id: string;
    name: string;
  } | null;
  available: boolean;
}

interface ProductShowcaseSelectorProps {
  selectedProductIds: string[];
  layout: 'GRID' | 'CAROUSEL' | 'FEATURED';
  onChange: (productIds: string[], layout: 'GRID' | 'CAROUSEL' | 'FEATURED') => void;
}

interface SortableProductItemProps {
  product: Product;
  onRemove: () => void;
}

// Sortable product item component
function SortableProductItem({ product, onRemove }: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          RM {product.price.toFixed(2)}
        </p>
        {product.category && (
          <Badge variant="outline" className="text-xs mt-1">
            {product.category.name}
          </Badge>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function ProductShowcaseSelector({
  selectedProductIds,
  layout,
  onChange,
}: ProductShowcaseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/admin/products/search?query=${encodeURIComponent(query)}&available=true&pageSize=20`
      );

      if (!response.ok) {
        throw new Error('Failed to search products');
      }

      const data = await response.json();
      setSearchResults(data.products || []);
    } catch (error) {
      console.error('[ProductShowcaseSelector] Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Load selected products on mount
  React.useEffect(() => {
    if (selectedProductIds.length > 0 && selectedProducts.length === 0) {
      const loadSelectedProducts = async () => {
        try {
          const response = await fetch(
            `/api/admin/products/search?pageSize=50`
          );
          const data = await response.json();
          const loaded = data.products.filter((p: Product) =>
            selectedProductIds.includes(p.id)
          );
          // Maintain order from selectedProductIds
          const ordered = selectedProductIds
            .map((id) => loaded.find((p: Product) => p.id === id))
            .filter(Boolean) as Product[];
          setSelectedProducts(ordered);
        } catch (error) {
          console.error('[ProductShowcaseSelector] Load error:', error);
        }
      };
      loadSelectedProducts();
    }
  }, [selectedProductIds, selectedProducts.length]);

  // Search when debounced query changes
  React.useEffect(() => {
    searchProducts(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchProducts]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        onChange(
          newOrder.map((p) => p.id),
          layout
        );
        return newOrder;
      });
    }
  };

  // Add product to selection
  const handleAddProduct = (product: Product) => {
    if (selectedProducts.length >= LANDING_PAGE_CONSTANTS.PRODUCT_SHOWCASE.MAX_FEATURED_PRODUCTS) {
      alert(
        `Maximum ${LANDING_PAGE_CONSTANTS.PRODUCT_SHOWCASE.MAX_FEATURED_PRODUCTS} products allowed`
      );
      return;
    }

    if (selectedProducts.some((p) => p.id === product.id)) {
      return; // Already selected
    }

    const newSelection = [...selectedProducts, product];
    setSelectedProducts(newSelection);
    onChange(
      newSelection.map((p) => p.id),
      layout
    );
  };

  // Remove product from selection
  const handleRemoveProduct = (productId: string) => {
    const newSelection = selectedProducts.filter((p) => p.id !== productId);
    setSelectedProducts(newSelection);
    onChange(
      newSelection.map((p) => p.id),
      layout
    );
  };

  // Handle layout change
  const handleLayoutChange = (newLayout: 'GRID' | 'CAROUSEL' | 'FEATURED') => {
    onChange(selectedProducts.map((p) => p.id), newLayout);
  };

  const layouts = Object.values(LANDING_PAGE_CONSTANTS.PRODUCT_SHOWCASE.LAYOUTS);

  return (
    <div className="space-y-6">
      {/* Layout Selector */}
      <div className="space-y-3">
        <Label>Showcase Layout</Label>
        <RadioGroup value={layout} onValueChange={handleLayoutChange}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {layouts.map((layoutOption) => (
              <div key={layoutOption.value} className="relative">
                <RadioGroupItem
                  value={layoutOption.value}
                  id={layoutOption.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={layoutOption.value}
                  className="flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                >
                  <span className="font-semibold">{layoutOption.label}</span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {layoutOption.description}
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Selected Products */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>
            Selected Products ({selectedProducts.length}/
            {LANDING_PAGE_CONSTANTS.PRODUCT_SHOWCASE.MAX_FEATURED_PRODUCTS})
          </Label>
          {selectedProducts.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProducts([]);
                onChange([], layout);
              }}
            >
              Clear All
            </Button>
          )}
        </div>

        {selectedProducts.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedProducts.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {selectedProducts.map((product) => (
                  <SortableProductItem
                    key={product.id}
                    product={product}
                    onRemove={() => handleRemoveProduct(product.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No products selected. Search and add products below.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Search */}
      <div className="space-y-3">
        <Label>Add Products</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isSearching && hasSearched && searchResults.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No products found
            </CardContent>
          </Card>
        )}

        {!isSearching && searchResults.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((product) => {
              const isSelected = selectedProducts.some((p) => p.id === product.id);

              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-white border rounded-lg"
                >
                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      RM {product.price.toFixed(2)}
                    </p>
                    {product.category && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {product.category.name}
                      </Badge>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddProduct(product)}
                    disabled={
                      isSelected ||
                      selectedProducts.length >=
                        LANDING_PAGE_CONSTANTS.PRODUCT_SHOWCASE.MAX_FEATURED_PRODUCTS
                    }
                  >
                    {isSelected ? 'Selected' : 'Add'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
