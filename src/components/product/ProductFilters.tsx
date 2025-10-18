/**
 * Product Filters Component - JRM E-commerce Platform
 * Advanced filtering system with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  DollarSign,
  Package,
  Tags,
  Heart,
  Award,
  Percent,
  Palette,
  Truck,
  ShieldCheck,
  Zap,
  RefreshCw,
} from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
  count?: number;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterGroup {
  id: string;
  title: string;
  type: 'checkbox' | 'radio' | 'range' | 'price' | 'rating' | 'color' | 'text';
  icon?: React.ComponentType<{ className?: string }>;
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  multiple?: boolean;
}

export interface ProductFiltersProps {
  filterGroups: FilterGroup[];
  activeFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onClearAll?: () => void;
  variant?: 'sidebar' | 'modal' | 'inline' | 'compact';
  showFilterCount?: boolean;
  showClearAll?: boolean;
  className?: string;
}

// Price range formatter
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Star rating component
function StarRating({
  rating,
  interactive = false,
  size = 'sm',
  onRatingChange,
}: {
  rating: number;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onRatingChange?: (rating: number) => void;
}) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRatingChange?.(star)}
          disabled={!interactive}
          className={cn(
            'transition-colors',
            interactive && 'hover:text-yellow-400 cursor-pointer',
            !interactive && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  );
}

// Color swatch component
function ColorSwatch({
  color,
  selected,
  onClick,
  size = 'md',
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border-2 transition-all duration-200',
        'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        sizeClasses[size],
        selected
          ? 'border-primary shadow-lg scale-110'
          : 'border-muted-foreground/20 hover:border-muted-foreground/40'
      )}
      style={{ backgroundColor: color }}
      aria-label={`Select ${color} color`}
    >
      {selected && (
        <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}
    </button>
  );
}

// Single filter group component
function FilterGroupComponent({
  group,
  activeValue,
  onChange,
}: {
  group: FilterGroup;
  activeValue: any;
  onChange: (value: any) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(group.defaultExpanded ?? true);

  const renderFilterContent = () => {
    switch (group.type) {
      case 'checkbox':
        return (
          <div className="space-y-3">
            {group.options?.map(option => (
              <div
                key={option.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={
                      Array.isArray(activeValue)
                        ? activeValue.includes(option.value)
                        : activeValue === option.value
                    }
                    onCheckedChange={checked => {
                      if (group.multiple) {
                        const currentValues = Array.isArray(activeValue)
                          ? activeValue
                          : [];
                        if (checked) {
                          onChange([...currentValues, option.value]);
                        } else {
                          onChange(
                            currentValues.filter(v => v !== option.value)
                          );
                        }
                      } else {
                        onChange(checked ? option.value : null);
                      }
                    }}
                  />
                  <Label
                    htmlFor={option.id}
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    {option.icon && <option.icon className="h-4 w-4" />}
                    {option.label}
                  </Label>
                </div>
                {option.count && (
                  <Badge variant="secondary" className="text-xs">
                    {option.count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {group.options?.map(option => (
              <div
                key={option.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={option.id}
                    name={group.id}
                    checked={activeValue === option.value}
                    onChange={() => onChange(option.value)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                  />
                  <Label
                    htmlFor={option.id}
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    {option.icon && <option.icon className="h-4 w-4" />}
                    {option.label}
                  </Label>
                </div>
                {option.count && (
                  <Badge variant="secondary" className="text-xs">
                    {option.count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        );

      case 'range':
      case 'price':
        const min = group.min ?? 0;
        const max = group.max ?? 100;
        const value = activeValue || [min, max];

        return (
          <div className="space-y-4">
            <div className="px-2">
              <Slider
                value={value}
                onValueChange={onChange}
                min={min}
                max={max}
                step={group.step ?? 1}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {group.type === 'price'
                  ? formatPrice(value[0])
                  : `${value[0]}${group.unit || ''}`}
              </span>
              <span className="text-muted-foreground">to</span>
              <span className="font-medium">
                {group.type === 'price'
                  ? formatPrice(value[1])
                  : `${value[1]}${group.unit || ''}`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label
                  htmlFor={`${group.id}-min`}
                  className="text-xs text-muted-foreground"
                >
                  Min
                </Label>
                <Input
                  id={`${group.id}-min`}
                  type="number"
                  value={value[0]}
                  onChange={e =>
                    onChange([parseInt(e.target.value) || min, value[1]])
                  }
                  min={min}
                  max={value[1]}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label
                  htmlFor={`${group.id}-max`}
                  className="text-xs text-muted-foreground"
                >
                  Max
                </Label>
                <Input
                  id={`${group.id}-max`}
                  type="number"
                  value={value[1]}
                  onChange={e =>
                    onChange([value[0], parseInt(e.target.value) || max])
                  }
                  min={value[0]}
                  max={max}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange(activeValue === rating ? null : rating)}
                className={cn(
                  'flex items-center justify-between w-full p-2 rounded-md text-left transition-colors',
                  'hover:bg-muted/50',
                  activeValue === rating &&
                    'bg-primary/10 border border-primary/20'
                )}
              >
                <div className="flex items-center gap-2">
                  <StarRating rating={rating} />
                  <span className="text-sm">& up</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {Math.floor(Math.random() * 100) + 10}
                </Badge>
              </button>
            ))}
          </div>
        );

      case 'color':
        return (
          <div className="grid grid-cols-6 gap-2">
            {group.options?.map(option => (
              <ColorSwatch
                key={option.id}
                color={option.color || '#000'}
                selected={
                  Array.isArray(activeValue)
                    ? activeValue.includes(option.value)
                    : activeValue === option.value
                }
                onClick={() => {
                  if (group.multiple) {
                    const currentValues = Array.isArray(activeValue)
                      ? activeValue
                      : [];
                    if (currentValues.includes(option.value)) {
                      onChange(currentValues.filter(v => v !== option.value));
                    } else {
                      onChange([...currentValues, option.value]);
                    }
                  } else {
                    onChange(
                      activeValue === option.value ? null : option.value
                    );
                  }
                }}
              />
            ))}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <Input
              type="text"
              value={activeValue || ''}
              onChange={e => onChange(e.target.value || null)}
              placeholder={`Search ${group.title.toLowerCase()}...`}
              className="h-9"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (group.collapsible) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center justify-between w-full p-0 h-auto font-semibold text-sm"
          >
            <div className="flex items-center gap-2">
              {group.icon && <group.icon className="h-4 w-4" />}
              {group.title}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          {renderFilterContent()}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {group.icon && <group.icon className="h-4 w-4" />}
        <h3 className="font-semibold text-sm">{group.title}</h3>
      </div>
      {renderFilterContent()}
    </div>
  );
}

// Active filters display
function ActiveFilters({
  filterGroups,
  activeFilters,
  onRemoveFilter,
  onClearAll,
}: {
  filterGroups: FilterGroup[];
  activeFilters: Record<string, any>;
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
}) {
  const activeFiltersList = Object.entries(activeFilters)
    .filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        (Array.isArray(value) ? value.length > 0 : true)
    )
    .map(([filterId, value]) => {
      const group = filterGroups.find(g => g.id === filterId);
      if (!group) return null;

      if (Array.isArray(value)) {
        return value.map(v => ({
          id: `${filterId}-${v}`,
          filterId,
          label:
            group.options?.find(opt => opt.value === v)?.label || String(v),
          group: group.title,
        }));
      }

      let label = String(value);
      if (group.type === 'price' && Array.isArray(value)) {
        label = `${formatPrice(value[0])} - ${formatPrice(value[1])}`;
      } else if (group.type === 'rating') {
        label = `${value}+ stars`;
      } else if (group.options) {
        label =
          group.options.find(opt => opt.value === value)?.label ||
          String(value);
      }

      return {
        id: filterId,
        filterId,
        label,
        group: group.title,
      };
    })
    .flat()
    .filter(Boolean);

  if (activeFiltersList.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Active Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs"
        >
          Clear All
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFiltersList.map(filter => (
          <Badge
            key={filter.id}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="text-xs">{filter.label}</span>
            <button
              type="button"
              onClick={() => onRemoveFilter(filter.filterId)}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function ProductFilters({
  filterGroups,
  activeFilters,
  onFiltersChange,
  onClearAll,
  variant = 'sidebar',
  showFilterCount = true,
  showClearAll = true,
  className,
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState(activeFilters);

  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  const handleFilterChange = useCallback(
    (filterId: string, value: any) => {
      const newFilters = { ...localFilters, [filterId]: value };
      if (
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete newFilters[filterId];
      }
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [localFilters, onFiltersChange]
  );

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      const newFilters = { ...localFilters };
      delete newFilters[filterId];
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [localFilters, onFiltersChange]
  );

  const handleClearAll = useCallback(() => {
    setLocalFilters({});
    onFiltersChange({});
    onClearAll?.();
  }, [onFiltersChange, onClearAll]);

  const activeFilterCount = Object.values(localFilters).filter(
    value =>
      value !== null &&
      value !== undefined &&
      (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Active Filters */}
      <ActiveFilters
        filterGroups={filterGroups}
        activeFilters={localFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      {/* Filter Groups */}
      {filterGroups.map((group, index) => (
        <div key={group.id}>
          <FilterGroupComponent
            group={group}
            activeValue={localFilters[group.id]}
            onChange={value => handleFilterChange(group.id, value)}
          />
          {index < filterGroups.length - 1 && <Separator className="mt-6" />}
        </div>
      ))}

      {/* Clear All Button */}
      {showClearAll && activeFilterCount > 0 && (
        <div className="pt-4 border-t">
          <Button variant="outline" onClick={handleClearAll} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  if (variant === 'modal') {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {showFilterCount && activeFilterCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Refine your search to find exactly what you're looking for.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">{renderFilters()}</div>
        </SheetContent>
      </Sheet>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
            {showFilterCount && activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{renderFilters()}</CardContent>
      </Card>
    );
  }

  return <div className={cn('space-y-6', className)}>{renderFilters()}</div>;
}

// Default filter groups for e-commerce
export const defaultProductFilterGroups: FilterGroup[] = [
  {
    id: 'category',
    title: 'Category',
    type: 'checkbox',
    icon: Package,
    multiple: true,
    collapsible: true,
    defaultExpanded: true,
    options: [
      {
        id: 'electronics',
        label: 'Electronics',
        value: 'electronics',
        count: 156,
      },
      { id: 'fashion', label: 'Fashion', value: 'fashion', count: 234 },
      { id: 'home', label: 'Home & Garden', value: 'home', count: 89 },
      { id: 'sports', label: 'Sports & Outdoor', value: 'sports', count: 67 },
      { id: 'books', label: 'Books', value: 'books', count: 45 },
    ],
  },
  {
    id: 'price',
    title: 'Price Range',
    type: 'price',
    icon: DollarSign,
    min: 0,
    max: 5000,
    step: 10,
    collapsible: true,
    defaultExpanded: true,
  },
  {
    id: 'rating',
    title: 'Customer Rating',
    type: 'rating',
    icon: Star,
    collapsible: true,
    defaultExpanded: true,
  },
  {
    id: 'brand',
    title: 'Brand',
    type: 'checkbox',
    icon: Award,
    multiple: true,
    collapsible: true,
    defaultExpanded: false,
    options: [
      { id: 'apple', label: 'Apple', value: 'apple', count: 45 },
      { id: 'samsung', label: 'Samsung', value: 'samsung', count: 67 },
      { id: 'nike', label: 'Nike', value: 'nike', count: 34 },
      { id: 'adidas', label: 'Adidas', value: 'adidas', count: 28 },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    type: 'checkbox',
    icon: Zap,
    multiple: true,
    collapsible: true,
    defaultExpanded: false,
    options: [
      {
        id: 'free-shipping',
        label: 'Free Shipping',
        value: 'free-shipping',
        icon: Truck,
        count: 234,
      },
      {
        id: 'on-sale',
        label: 'On Sale',
        value: 'on-sale',
        icon: Percent,
        count: 78,
      },
      {
        id: 'featured',
        label: 'Featured',
        value: 'featured',
        icon: Star,
        count: 56,
      },
      {
        id: 'warranty',
        label: 'Warranty Included',
        value: 'warranty',
        icon: ShieldCheck,
        count: 123,
      },
    ],
  },
  {
    id: 'color',
    title: 'Color',
    type: 'color',
    icon: Palette,
    multiple: true,
    collapsible: true,
    defaultExpanded: false,
    options: [
      { id: 'black', label: 'Black', value: 'black', color: '#000000' },
      { id: 'white', label: 'White', value: 'white', color: '#FFFFFF' },
      { id: 'red', label: 'Red', value: 'red', color: '#EF4444' },
      { id: 'blue', label: 'Blue', value: 'blue', color: '#3B82F6' },
      { id: 'green', label: 'Green', value: 'green', color: '#10B981' },
      { id: 'yellow', label: 'Yellow', value: 'yellow', color: '#F59E0B' },
    ],
  },
];

export default ProductFilters;
