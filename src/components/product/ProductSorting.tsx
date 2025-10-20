/**
 * Product Sorting Component - JRM E-commerce Platform
 * Advanced sorting system with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SortAsc,
  SortDesc,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Heart,
  Package,
  Zap,
  Award,
  Eye,
  Clock,
  Users,
} from 'lucide-react';

export interface SortOption {
  id: string;
  label: string;
  field: string;
  direction: 'asc' | 'desc';
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  default?: boolean;
}

export interface ProductSortingProps {
  options: SortOption[];
  currentSort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  onSortChange: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  variant?: 'select' | 'dropdown' | 'buttons' | 'toggle';
  showDirection?: boolean;
  showLabel?: boolean;
  className?: string;
}

// Default sorting options for e-commerce products
export const defaultSortOptions: SortOption[] = [
  {
    id: 'relevance',
    label: 'Relevance',
    field: 'relevance',
    direction: 'desc',
    icon: Zap,
    description: 'Most relevant to your search',
    default: true,
  },
  {
    id: 'newest',
    label: 'Newest First',
    field: 'createdAt',
    direction: 'desc',
    icon: Calendar,
    description: 'Latest products first',
  },
  {
    id: 'oldest',
    label: 'Oldest First',
    field: 'createdAt',
    direction: 'asc',
    icon: Clock,
    description: 'Oldest products first',
  },
  {
    id: 'price-low',
    label: 'Price: Low to High',
    field: 'price',
    direction: 'asc',
    icon: DollarSign,
    description: 'Cheapest first',
  },
  {
    id: 'price-high',
    label: 'Price: High to Low',
    field: 'price',
    direction: 'desc',
    icon: DollarSign,
    description: 'Most expensive first',
  },
  {
    id: 'rating',
    label: 'Highest Rated',
    field: 'rating',
    direction: 'desc',
    icon: Star,
    description: 'Best ratings first',
  },
  {
    id: 'popularity',
    label: 'Most Popular',
    field: 'popularity',
    direction: 'desc',
    icon: TrendingUp,
    description: 'Most viewed and purchased',
  },
  {
    id: 'name-asc',
    label: 'Name: A to Z',
    field: 'name',
    direction: 'asc',
    icon: SortAsc,
    description: 'Alphabetical order',
  },
  {
    id: 'name-desc',
    label: 'Name: Z to A',
    field: 'name',
    direction: 'desc',
    icon: SortDesc,
    description: 'Reverse alphabetical order',
  },
  {
    id: 'wishlist',
    label: 'Most Favorited',
    field: 'wishlistCount',
    direction: 'desc',
    icon: Heart,
    description: 'Most added to wishlists',
  },
  {
    id: 'stock',
    label: 'Stock Level',
    field: 'stock',
    direction: 'desc',
    icon: Package,
    description: 'Highest stock first',
  },
  {
    id: 'discount',
    label: 'Biggest Discount',
    field: 'discountPercentage',
    direction: 'desc',
    icon: Award,
    description: 'Largest savings first',
  },
];

// Sort direction toggle component
function SortDirectionToggle({
  direction,
  onDirectionChange,
  disabled = false,
}: {
  direction: 'asc' | 'desc';
  onDirectionChange: (direction: 'asc' | 'desc') => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onDirectionChange(direction === 'asc' ? 'desc' : 'asc')}
      disabled={disabled}
      className="h-9 px-3"
    >
      {direction === 'asc' ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      )}
      <span className="sr-only">
        {direction === 'asc' ? 'Sort ascending' : 'Sort descending'}
      </span>
    </Button>
  );
}

// Select variant
function SortingSelect({
  options,
  currentSort,
  onSortChange,
  showLabel,
  className,
}: {
  options: SortOption[];
  currentSort?: { field: string; direction: 'asc' | 'desc' };
  onSortChange: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  showLabel?: boolean;
  className?: string;
}) {
  const currentOption = options.find(
    opt =>
      opt.field === currentSort?.field &&
      opt.direction === currentSort?.direction
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Sort by:
        </span>
      )}
      <Select
        value={
          currentOption?.id ||
          options.find(opt => opt.default)?.id ||
          options[0]?.id
        }
        onValueChange={value => {
          const option = options.find(opt => opt.id === value);
          if (option) {
            onSortChange({ field: option.field, direction: option.direction });
          }
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select sorting..." />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.id} value={option.id}>
              <div className="flex items-center gap-2">
                {option.icon && <option.icon className="h-4 w-4" />}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Dropdown variant
function SortingDropdown({
  options,
  currentSort,
  onSortChange,
  showLabel,
  className,
}: {
  options: SortOption[];
  currentSort?: { field: string; direction: 'asc' | 'desc' };
  onSortChange: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  showLabel?: boolean;
  className?: string;
}) {
  const currentOption = options.find(
    opt =>
      opt.field === currentSort?.field &&
      opt.direction === currentSort?.direction
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Sort by:
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-between min-w-48">
            <div className="flex items-center gap-2">
              {currentOption?.icon && (
                <currentOption.icon className="h-4 w-4" />
              )}
              <span>{currentOption?.label || 'Select sorting...'}</span>
            </div>
            <ArrowUpDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map(option => (
            <DropdownMenuItem
              key={option.id}
              onClick={() =>
                onSortChange({
                  field: option.field,
                  direction: option.direction,
                })
              }
              className={cn(
                'flex items-start gap-3 py-3',
                currentOption?.id === option.id && 'bg-primary/10'
              )}
            >
              {option.icon && (
                <option.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.label}</span>
                  {currentOption?.id === option.id && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                {option.description && (
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Button variant
function SortingButtons({
  options,
  currentSort,
  onSortChange,
  showLabel,
  className,
}: {
  options: SortOption[];
  currentSort?: { field: string; direction: 'asc' | 'desc' };
  onSortChange: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {showLabel && (
        <h3 className="text-sm font-medium text-muted-foreground">Sort by:</h3>
      )}
      <div className="grid grid-cols-2 gap-2">
        {options.map(option => {
          const isActive =
            currentSort?.field === option.field &&
            currentSort?.direction === option.direction;
          return (
            <Button
              key={option.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                onSortChange({
                  field: option.field,
                  direction: option.direction,
                })
              }
              className="justify-start h-auto p-3"
            >
              <div className="flex items-center gap-2 w-full">
                {option.icon && (
                  <option.icon className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="text-left flex-1 truncate">
                  {option.label}
                </span>
                {isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Toggle variant with separate field and direction controls
function SortingToggle({
  options,
  currentSort,
  onSortChange,
  showLabel,
  className,
}: {
  options: SortOption[];
  currentSort?: { field: string; direction: 'asc' | 'desc' };
  onSortChange: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  showLabel?: boolean;
  className?: string;
}) {
  // Group options by field to avoid duplicates
  const fieldOptions = options.reduce((acc, option) => {
    if (!acc.find(opt => opt.field === option.field)) {
      acc.push(option);
    }
    return acc;
  }, [] as SortOption[]);

  const handleFieldChange = useCallback(
    (field: string) => {
      const option = options.find(opt => opt.field === field);
      if (option) {
        onSortChange({
          field: option.field,
          direction:
            currentSort?.field === field
              ? currentSort.direction
              : option.direction,
        });
      }
    },
    [options, currentSort, onSortChange]
  );

  const handleDirectionChange = useCallback(
    (direction: 'asc' | 'desc') => {
      if (currentSort?.field) {
        onSortChange({ field: currentSort.field, direction });
      }
    },
    [currentSort, onSortChange]
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Sort by:
        </span>
      )}
      <Select
        value={currentSort?.field || fieldOptions[0]?.field}
        onValueChange={handleFieldChange}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Field..." />
        </SelectTrigger>
        <SelectContent>
          {fieldOptions.map(option => (
            <SelectItem key={option.field} value={option.field}>
              <div className="flex items-center gap-2">
                {option.icon && <option.icon className="h-4 w-4" />}
                <span>{option.label.split(':')[0]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SortDirectionToggle
        direction={currentSort?.direction || 'desc'}
        onDirectionChange={handleDirectionChange}
        disabled={!currentSort?.field}
      />
    </div>
  );
}

export function ProductSorting({
  options,
  currentSort,
  onSortChange,
  variant = 'select',
  showDirection = false,
  showLabel = true,
  className,
}: ProductSortingProps) {
  const currentOption = options.find(
    opt =>
      opt.field === currentSort?.field &&
      opt.direction === currentSort?.direction
  );

  // If no current sort is set, use the default option
  const effectiveCurrentSort = currentSort || {
    field: options.find(opt => opt.default)?.field || options[0]?.field || '',
    direction:
      options.find(opt => opt.default)?.direction ||
      options[0]?.direction ||
      'desc',
  };

  const renderSorting = () => {
    const commonProps = {
      options,
      currentSort: effectiveCurrentSort,
      onSortChange,
      showLabel,
      className: '',
    };

    switch (variant) {
      case 'dropdown':
        return <SortingDropdown {...commonProps} />;
      case 'buttons':
        return <SortingButtons {...commonProps} />;
      case 'toggle':
        return <SortingToggle {...commonProps} />;
      case 'select':
      default:
        return <SortingSelect {...commonProps} />;
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {renderSorting()}
      {showDirection && variant !== 'toggle' && currentSort && (
        <SortDirectionToggle
          direction={currentSort.direction}
          onDirectionChange={direction =>
            onSortChange({ field: currentSort.field, direction })
          }
        />
      )}
    </div>
  );
}

// Specialized sorting components
export const CompactProductSorting = ({
  className,
  ...props
}: Omit<ProductSortingProps, 'variant' | 'showLabel'>) => (
  <ProductSorting
    variant="select"
    showLabel={false}
    className={className}
    {...props}
  />
);

export const AdvancedProductSorting = ({
  className,
  ...props
}: Omit<ProductSortingProps, 'variant' | 'showDirection'>) => (
  <ProductSorting
    variant="dropdown"
    showDirection={true}
    className={className}
    {...props}
  />
);

export const MobileProductSorting = ({
  className,
  ...props
}: Omit<ProductSortingProps, 'variant'>) => (
  <ProductSorting variant="dropdown" className={className} {...props} />
);

export const SidebarProductSorting = ({
  className,
  ...props
}: Omit<ProductSortingProps, 'variant'>) => (
  <ProductSorting variant="buttons" className={className} {...props} />
);

// Quick sort buttons for common scenarios
export function QuickSortButtons({
  onSortChange,
  currentSort,
  className,
}: {
  onSortChange: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  currentSort?: { field: string; direction: 'asc' | 'desc' };
  className?: string;
}) {
  const quickSorts = [
    {
      field: 'price',
      direction: 'asc' as const,
      label: 'Cheapest',
      icon: DollarSign,
    },
    {
      field: 'price',
      direction: 'desc' as const,
      label: 'Most Expensive',
      icon: DollarSign,
    },
    {
      field: 'rating',
      direction: 'desc' as const,
      label: 'Best Rated',
      icon: Star,
    },
    {
      field: 'popularity',
      direction: 'desc' as const,
      label: 'Popular',
      icon: TrendingUp,
    },
    {
      field: 'createdAt',
      direction: 'desc' as const,
      label: 'Newest',
      icon: Calendar,
    },
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {quickSorts.map(sort => {
        const isActive =
          currentSort?.field === sort.field &&
          currentSort?.direction === sort.direction;
        return (
          <Button
            key={`${sort.field}-${sort.direction}`}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortChange(sort)}
            className="flex items-center gap-1"
          >
            <sort.icon className="h-3 w-3" />
            <span>{sort.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

export default ProductSorting;
