/**
 * Section Component - JRM E-commerce Platform
 * Semantic section wrapper with consistent padding and background variants
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';

export interface SectionProps {
  variant?: 'default' | 'muted' | 'accent' | 'primary' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  decoration?: 'none' | 'subtle' | 'pattern' | 'gradient';
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  id?: string;
}

const sectionVariants = {
  default: 'bg-background text-foreground',
  muted: 'bg-muted/30 text-foreground',
  accent: 'bg-accent/5 text-foreground',
  primary: 'bg-primary/5 text-foreground',
  dark: 'bg-neutral-900 text-white'
};

const sectionSizes = {
  xs: 'py-8',         // 32px
  sm: 'py-12',        // 48px
  md: 'py-16',        // 64px
  lg: 'py-20',        // 80px
  xl: 'py-24'         // 96px
};

const decorationVariants = {
  none: '',
  subtle: 'relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-background/5 before:to-transparent',
  pattern: 'relative overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.02),transparent)]',
  gradient: 'bg-gradient-to-b from-background via-muted/20 to-background'
};

export function Section({
  variant = 'default',
  size = 'md',
  decoration = 'none',
  fullWidth = false,
  children,
  className,
  as: Component = 'section',
  id,
  ...props
}: SectionProps) {
  return (
    <Component
      id={id}
      className={cn(
        // Base section styles
        'relative',

        // Size variants
        sectionSizes[size],

        // Background variants
        sectionVariants[variant],

        // Decoration variants
        decorationVariants[decoration],

        // Full width handling
        fullWidth && 'w-full',

        // Custom className
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// Specialized section components
export const HeroSection = ({ children, className, ...props }: Omit<SectionProps, 'size'>) => (
  <Section
    size="xl"
    decoration="gradient"
    className={cn('min-h-[600px] flex items-center', className)}
    {...props}
  >
    {children}
  </Section>
);

export const FeatureSection = ({ children, className, ...props }: Omit<SectionProps, 'variant' | 'size'>) => (
  <Section
    variant="muted"
    size="lg"
    decoration="subtle"
    className={className}
    {...props}
  >
    {children}
  </Section>
);

export const ProductSection = ({ children, className, ...props }: Omit<SectionProps, 'size'>) => (
  <Section
    size="lg"
    className={className}
    {...props}
  >
    {children}
  </Section>
);

export const TestimonialSection = ({ children, className, ...props }: Omit<SectionProps, 'variant' | 'decoration'>) => (
  <Section
    variant="accent"
    decoration="pattern"
    className={className}
    {...props}
  >
    {children}
  </Section>
);

export const CallToActionSection = ({ children, className, ...props }: Omit<SectionProps, 'variant' | 'decoration'>) => (
  <Section
    variant="primary"
    decoration="gradient"
    className={className}
    {...props}
  >
    {children}
  </Section>
);

export const FooterSection = ({ children, className, ...props }: Omit<SectionProps, 'variant' | 'size'>) => (
  <Section
    variant="dark"
    size="lg"
    className={className}
    {...props}
  >
    {children}
  </Section>
);

// Section with automatic container
export interface SectionWithContainerProps extends SectionProps {
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function SectionWithContainer({
  containerSize = 'xl',
  children,
  ...sectionProps
}: SectionWithContainerProps) {
  const Container = React.lazy(() => import('./Container').then(module => ({ default: module.Container })));

  return (
    <Section {...sectionProps}>
      <React.Suspense fallback={<div className="min-h-4" />}>
        <Container size={containerSize}>
          {children}
        </Container>
      </React.Suspense>
    </Section>
  );
}

// Section header component for consistent section introductions
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  description,
  align = 'center',
  className
}: SectionHeaderProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <div className={cn('mb-12 lg:mb-16', alignClasses[align], className)}>
      {subtitle && (
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
          {subtitle}
        </p>
      )}
      <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight mb-4 text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
          {description}
        </p>
      )}
    </div>
  );
}

// Section footer component for CTAs and additional content
export interface SectionFooterProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function SectionFooter({
  children,
  align = 'center',
  className
}: SectionFooterProps) {
  const alignClasses = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right'
  };

  return (
    <div className={cn('mt-12 lg:mt-16 flex', alignClasses[align], className)}>
      {children}
    </div>
  );
}

// Export types
export type SectionVariant = keyof typeof sectionVariants;
export type SectionSize = keyof typeof sectionSizes;
export type SectionDecoration = keyof typeof decorationVariants;