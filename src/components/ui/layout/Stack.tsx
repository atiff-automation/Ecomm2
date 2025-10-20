/**
 * Stack Component - JRM E-commerce Platform
 * Flexible layout component for vertical and horizontal stacking
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';

export interface StackProps {
  direction?: 'vertical' | 'horizontal';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  responsive?: {
    sm?: {
      direction?: 'vertical' | 'horizontal';
      spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    };
    md?: {
      direction?: 'vertical' | 'horizontal';
      spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    };
    lg?: {
      direction?: 'vertical' | 'horizontal';
      spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    };
  };
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const directionVariants = {
  vertical: 'flex-col',
  horizontal: 'flex-row',
};

const spacingVariants = {
  vertical: {
    xs: 'space-y-2', // 8px
    sm: 'space-y-3', // 12px
    md: 'space-y-4', // 16px
    lg: 'space-y-6', // 24px
    xl: 'space-y-8', // 32px
  },
  horizontal: {
    xs: 'space-x-2', // 8px
    sm: 'space-x-3', // 12px
    md: 'space-x-4', // 16px
    lg: 'space-x-6', // 24px
    xl: 'space-x-8', // 32px
  },
};

const alignVariants = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyVariants = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export function Stack({
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  responsive,
  children,
  className,
  as: Component = 'div',
  ...props
}: StackProps) {
  // Generate responsive classes
  const responsiveClasses = responsive
    ? Object.entries(responsive).flatMap(([breakpoint, config]) => {
        const classes = [];
        if (config.direction) {
          const prefix =
            breakpoint === 'sm' ? 'sm:' : breakpoint === 'md' ? 'md:' : 'lg:';
          classes.push(`${prefix}${directionVariants[config.direction]}`);

          // Add responsive spacing
          if (config.spacing) {
            classes.push(
              `${prefix}${spacingVariants[config.direction][config.spacing]}`
            );
          }
        }
        return classes;
      })
    : [];

  return (
    <Component
      className={cn(
        // Base flex styles
        'flex',

        // Direction
        directionVariants[direction],

        // Spacing
        spacingVariants[direction][spacing],

        // Alignment
        alignVariants[align],

        // Justification
        justifyVariants[justify],

        // Wrap
        wrap && 'flex-wrap',

        // Responsive classes
        ...responsiveClasses,

        // Custom className
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// Predefined stack components for common patterns
export const VStack = ({
  children,
  className,
  ...props
}: Omit<StackProps, 'direction'>) => (
  <Stack direction="vertical" className={className} {...props}>
    {children}
  </Stack>
);

export const HStack = ({
  children,
  className,
  ...props
}: Omit<StackProps, 'direction'>) => (
  <Stack direction="horizontal" className={className} {...props}>
    {children}
  </Stack>
);

// Responsive stack that changes direction based on screen size
export const ResponsiveStack = ({
  children,
  className,
  ...props
}: Omit<StackProps, 'direction' | 'responsive'>) => (
  <Stack
    direction="vertical"
    responsive={{
      md: { direction: 'horizontal' },
    }}
    className={className}
    {...props}
  >
    {children}
  </Stack>
);

// Card stack for organizing related content
export const CardStack = ({
  children,
  className,
  ...props
}: Omit<StackProps, 'direction' | 'spacing'>) => (
  <Stack direction="vertical" spacing="lg" className={className} {...props}>
    {children}
  </Stack>
);

// Form stack for form elements
export const FormStack = ({
  children,
  className,
  ...props
}: Omit<StackProps, 'direction' | 'spacing'>) => (
  <Stack direction="vertical" spacing="md" className={className} {...props}>
    {children}
  </Stack>
);

// Button stack for action groups
export const ButtonStack = ({
  children,
  className,
  ...props
}: Omit<StackProps, 'direction' | 'align'>) => (
  <Stack
    direction="horizontal"
    align="center"
    wrap={true}
    className={className}
    {...props}
  >
    {children}
  </Stack>
);

// Navigation stack for menu items
export const NavStack = ({
  children,
  className,
  ...props
}: Omit<StackProps, 'direction' | 'align'>) => (
  <Stack direction="horizontal" align="center" className={className} {...props}>
    {children}
  </Stack>
);

// Content stack for text content
export const ContentStack = ({
  children,
  className,
  ...props
}: Omit<StackProps, 'direction' | 'spacing'>) => (
  <Stack direction="vertical" spacing="sm" className={className} {...props}>
    {children}
  </Stack>
);

// Feature stack for highlighting features
export const FeatureStack = ({
  children,
  className,
  ...props
}: Omit<StackProps, 'spacing' | 'align'>) => (
  <Stack spacing="xl" align="center" className={className} {...props}>
    {children}
  </Stack>
);

// Stack item component for individual items in a stack
export interface StackItemProps {
  flex?: 'none' | 'auto' | '1';
  align?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const flexVariants = {
  none: 'flex-none',
  auto: 'flex-auto',
  '1': 'flex-1',
};

const selfAlignVariants = {
  auto: 'self-auto',
  start: 'self-start',
  center: 'self-center',
  end: 'self-end',
  stretch: 'self-stretch',
};

export function StackItem({
  flex,
  align,
  children,
  className,
  as: Component = 'div',
  ...props
}: StackItemProps) {
  return (
    <Component
      className={cn(
        // Flex properties
        flex && flexVariants[flex],

        // Self alignment
        align && selfAlignVariants[align],

        // Custom className
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// Spacer component for flexible spacing
export interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

const spacerSizes = {
  vertical: {
    xs: 'h-2', // 8px
    sm: 'h-3', // 12px
    md: 'h-4', // 16px
    lg: 'h-6', // 24px
    xl: 'h-8', // 32px
    auto: 'flex-1',
  },
  horizontal: {
    xs: 'w-2', // 8px
    sm: 'w-3', // 12px
    md: 'w-4', // 16px
    lg: 'w-6', // 24px
    xl: 'w-8', // 32px
    auto: 'flex-1',
  },
};

export function Spacer({
  size = 'md',
  direction = 'vertical',
  className,
}: SpacerProps) {
  return (
    <div
      className={cn(spacerSizes[direction][size], className)}
      aria-hidden="true"
    />
  );
}

// Export types
export type StackDirection = StackProps['direction'];
export type StackSpacing = StackProps['spacing'];
export type StackAlign = StackProps['align'];
export type StackJustify = StackProps['justify'];
