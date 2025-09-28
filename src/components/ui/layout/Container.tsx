/**
 * Container Component - JRM E-commerce Platform
 * Responsive container with consistent padding and max-widths
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';

export interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const containerVariants = {
  sm: 'max-w-2xl',     // 672px
  md: 'max-w-4xl',     // 896px
  lg: 'max-w-6xl',     // 1152px
  xl: 'max-w-7xl',     // 1280px
  full: 'max-w-none'   // Full width
};

export function Container({
  size = 'xl',
  children,
  className,
  as: Component = 'div',
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        // Base container styles
        'mx-auto w-full',

        // Responsive padding using design system tokens
        'px-4 sm:px-6 lg:px-8',

        // Size variants
        containerVariants[size],

        // Custom className
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// Named size variants for convenience
export const SmallContainer = ({ children, className, ...props }: Omit<ContainerProps, 'size'>) => (
  <Container size="sm" className={className} {...props}>
    {children}
  </Container>
);

export const MediumContainer = ({ children, className, ...props }: Omit<ContainerProps, 'size'>) => (
  <Container size="md" className={className} {...props}>
    {children}
  </Container>
);

export const LargeContainer = ({ children, className, ...props }: Omit<ContainerProps, 'size'>) => (
  <Container size="lg" className={className} {...props}>
    {children}
  </Container>
);

export const XLargeContainer = ({ children, className, ...props }: Omit<ContainerProps, 'size'>) => (
  <Container size="xl" className={className} {...props}>
    {children}
  </Container>
);

export const FullContainer = ({ children, className, ...props }: Omit<ContainerProps, 'size'>) => (
  <Container size="full" className={className} {...props}>
    {children}
  </Container>
);

// Container with specific use cases
export const PageContainer = ({ children, className, ...props }: Omit<ContainerProps, 'size'>) => (
  <Container
    size="xl"
    className={cn('py-8 lg:py-12', className)}
    {...props}
  >
    {children}
  </Container>
);

export const SectionContainer = ({ children, className, ...props }: Omit<ContainerProps, 'size'>) => (
  <Container
    size="xl"
    className={cn('py-16 lg:py-20', className)}
    {...props}
  >
    {children}
  </Container>
);

export const HeroContainer = ({ children, className, ...props }: Omit<ContainerProps, 'size'>) => (
  <Container
    size="xl"
    className={cn('py-20 lg:py-32', className)}
    {...props}
  >
    {children}
  </Container>
);

// Export types
export type ContainerSize = keyof typeof containerVariants;