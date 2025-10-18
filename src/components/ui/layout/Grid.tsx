/**
 * Grid Component - JRM E-commerce Platform
 * Responsive grid system with 12-column base
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';

export interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto-fit' | 'auto-fill';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  };
  minItemWidth?: string; // For auto-fit/auto-fill
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const gridColsVariants = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12'
};

const responsiveColsVariants = {
  sm: {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    5: 'sm:grid-cols-5',
    6: 'sm:grid-cols-6',
    12: 'sm:grid-cols-12'
  },
  md: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
    12: 'md:grid-cols-12'
  },
  lg: {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    12: 'lg:grid-cols-12'
  },
  xl: {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5',
    6: 'xl:grid-cols-6',
    12: 'xl:grid-cols-12'
  }
};

const gapVariants = {
  xs: 'gap-2',    // 8px
  sm: 'gap-3',    // 12px
  md: 'gap-4',    // 16px
  lg: 'gap-6',    // 24px
  xl: 'gap-8'     // 32px
};

export function Grid({
  cols = 4,
  gap = 'md',
  responsive,
  minItemWidth = '280px',
  children,
  className,
  as: Component = 'div',
  ...props
}: GridProps) {
  // Generate responsive grid classes
  const responsiveClasses = responsive
    ? Object.entries(responsive)
        .map(([breakpoint, cols]) =>
          responsiveColsVariants[breakpoint as keyof typeof responsiveColsVariants][cols]
        )
        .filter(Boolean)
    : [];

  // Handle auto-fit/auto-fill grids
  const gridTemplateColumns =
    cols === 'auto-fit' ? `repeat(auto-fit, minmax(${minItemWidth}, 1fr))` :
    cols === 'auto-fill' ? `repeat(auto-fill, minmax(${minItemWidth}, 1fr))` :
    undefined;

  return (
    <Component
      className={cn(
        // Base grid styles
        'grid',

        // Gap styles
        gapVariants[gap],

        // Column styles (for fixed grids)
        typeof cols === 'number' && gridColsVariants[cols],

        // Responsive column styles
        ...responsiveClasses,

        // Custom className
        className
      )}
      style={gridTemplateColumns ? { gridTemplateColumns } : undefined}
      {...props}
    >
      {children}
    </Component>
  );
}

// Predefined grid layouts for common use cases
export const ProductGrid = ({ children, className, ...props }: Omit<GridProps, 'cols' | 'responsive'>) => (
  <Grid
    cols={2}
    responsive={{
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5
    }}
    gap="md"
    className={className}
    {...props}
  >
    {children}
  </Grid>
);

// Compact Product Grid (for sidebars, smaller spaces)
export const CompactProductGrid = ({ children, className, ...props }: Omit<GridProps, 'cols' | 'responsive'>) => (
  <Grid
    cols={2}
    responsive={{
      sm: 2,
      md: 2,
      lg: 3,
      xl: 4
    }}
    gap="sm"
    className={className}
    {...props}
  >
    {children}
  </Grid>
);

// Search Results Grid (optimized for search pages)
export const SearchResultsGrid = ({ children, className, ...props }: Omit<GridProps, 'cols' | 'responsive'>) => (
  <Grid
    cols={2}
    responsive={{
      sm: 2,
      md: 2,
      lg: 3,
      xl: 4
    }}
    gap="lg"
    className={className}
    {...props}
  >
    {children}
  </Grid>
);

// Wishlist Grid (consistent with product display)
export const WishlistGrid = ({ children, className, ...props }: Omit<GridProps, 'cols' | 'responsive'>) => (
  <Grid
    cols={2}
    responsive={{
      sm: 2,
      md: 2,
      lg: 3,
      xl: 4
    }}
    gap="md"
    className={className}
    {...props}
  >
    {children}
  </Grid>
);

export const CategoryGrid = ({ children, className, ...props }: Omit<GridProps, 'cols' | 'responsive'>) => (
  <Grid
    cols={2}
    responsive={{
      sm: 2,
      md: 3,
      lg: 4,
      xl: 6
    }}
    gap="lg"
    className={className}
    {...props}
  >
    {children}
  </Grid>
);

export const FeatureGrid = ({ children, className, ...props }: Omit<GridProps, 'cols' | 'responsive'>) => (
  <Grid
    cols={1}
    responsive={{
      md: 2,
      lg: 3
    }}
    gap="xl"
    className={className}
    {...props}
  >
    {children}
  </Grid>
);

export const BlogGrid = ({ children, className, ...props }: Omit<GridProps, 'cols' | 'responsive'>) => (
  <Grid
    cols={1}
    responsive={{
      md: 2,
      xl: 3
    }}
    gap="lg"
    className={className}
    {...props}
  >
    {children}
  </Grid>
);

export const TestimonialGrid = ({ children, className, ...props }: Omit<GridProps, 'cols' | 'responsive'>) => (
  <Grid
    cols={1}
    responsive={{
      lg: 2
    }}
    gap="xl"
    className={className}
    {...props}
  >
    {children}
  </Grid>
);

// Auto-fit grids for responsive layouts
export const AutoFitGrid = ({
  minItemWidth = '280px',
  children,
  className,
  ...props
}: Omit<GridProps, 'cols'>) => (
  <Grid
    cols="auto-fit"
    minItemWidth={minItemWidth}
    className={className}
    {...props}
  >
    {children}
  </Grid>
);

export const AutoFillGrid = ({
  minItemWidth = '280px',
  children,
  className,
  ...props
}: Omit<GridProps, 'cols'>) => (
  <Grid
    cols="auto-fill"
    minItemWidth={minItemWidth}
    className={className}
    {...props}
  >
    {children}
  </Grid>
);

// Grid item component for precise control
export interface GridItemProps {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full';
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  end?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
  responsive?: {
    sm?: { span?: 1 | 2 | 3 | 4 | 5 | 6 | 12; start?: number; end?: number };
    md?: { span?: 1 | 2 | 3 | 4 | 5 | 6 | 12; start?: number; end?: number };
    lg?: { span?: 1 | 2 | 3 | 4 | 5 | 6 | 12; start?: number; end?: number };
    xl?: { span?: 1 | 2 | 3 | 4 | 5 | 6 | 12; start?: number; end?: number };
  };
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const spanVariants = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  12: 'col-span-12',
  full: 'col-span-full'
};

export function GridItem({
  span,
  start,
  end,
  responsive,
  children,
  className,
  as: Component = 'div',
  ...props
}: GridItemProps) {
  return (
    <Component
      className={cn(
        // Span classes
        span && spanVariants[span],

        // Start and end classes
        start && `col-start-${start}`,
        end && `col-end-${end}`,

        // Responsive classes (if needed, implement similar to Grid)
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// Export types
export type GridCols = GridProps['cols'];
export type GridGap = GridProps['gap'];
export type GridItemSpan = GridItemProps['span'];