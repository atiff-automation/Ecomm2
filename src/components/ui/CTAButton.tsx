/**
 * CTA Button Component - JRM E-commerce Platform
 * Modern call-to-action button with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { designSystem, heroTypography } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight, ExternalLink } from 'lucide-react';

export interface CTAButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: 'arrow' | 'chevron' | 'external' | 'none';
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  external?: boolean;
  className?: string;
  'data-testid'?: string;
}

const sizeVariants = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3 text-lg font-semibold',
  xl: 'px-10 py-4 text-xl font-semibold',
};

const iconComponents = {
  arrow: ArrowRight,
  chevron: ChevronRight,
  external: ExternalLink,
  none: null,
};

export function CTAButton({
  variant = 'primary',
  size = 'lg',
  children,
  href,
  onClick,
  icon = 'arrow',
  iconPosition = 'right',
  fullWidth = false,
  disabled = false,
  loading = false,
  external = false,
  className,
  'data-testid': testId,
  ...props
}: CTAButtonProps) {
  const IconComponent = iconComponents[icon];

  const buttonContent = (
    <>
      {iconPosition === 'left' && IconComponent && (
        <IconComponent className="w-5 h-5" aria-hidden="true" />
      )}
      <span
        className={cn('transition-all duration-200', loading && 'opacity-70')}
      >
        {children}
      </span>
      {iconPosition === 'right' && IconComponent && (
        <IconComponent
          className={cn(
            'w-5 h-5 transition-transform duration-200',
            'group-hover:translate-x-1'
          )}
          aria-hidden="true"
        />
      )}
    </>
  );

  const buttonClasses = cn(
    // Base styles
    'group inline-flex items-center justify-center',
    'rounded-lg font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',

    // Size variants
    sizeVariants[size],

    // Icon spacing
    icon !== 'none' && iconPosition === 'left' && 'gap-3',
    icon !== 'none' && iconPosition === 'right' && 'gap-3',

    // Full width
    fullWidth && 'w-full',

    // Hover effects
    'hover:scale-105 active:scale-95',
    'hover:shadow-lg transition-all duration-200',

    // Custom className
    className
  );

  // If href is provided, render as Link
  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses}
          data-testid={testId}
          {...props}
        >
          {buttonContent}
        </a>
      );
    }

    return (
      <Link
        href={href}
        className={buttonClasses}
        data-testid={testId}
        {...props}
      >
        {buttonContent}
      </Link>
    );
  }

  // Otherwise render as Button
  return (
    <Button
      variant={variant}
      size={size === 'xl' ? 'lg' : size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(buttonClasses, 'border-0')}
      data-testid={testId}
      {...props}
    >
      {buttonContent}
    </Button>
  );
}

// Specialized CTA button variants for common use cases
export const PrimaryCTAButton = ({
  children,
  className,
  ...props
}: Omit<CTAButtonProps, 'variant'>) => (
  <CTAButton
    variant="primary"
    className={cn(
      'bg-primary hover:bg-primary/90 text-primary-foreground',
      'shadow-lg hover:shadow-xl',
      'border-2 border-primary hover:border-primary/90',
      className
    )}
    {...props}
  >
    {children}
  </CTAButton>
);

export const SecondaryCTAButton = ({
  children,
  className,
  ...props
}: Omit<CTAButtonProps, 'variant'>) => (
  <CTAButton
    variant="outline"
    className={cn(
      'border-2 border-white text-white hover:bg-white hover:text-foreground',
      'shadow-md hover:shadow-lg',
      className
    )}
    {...props}
  >
    {children}
  </CTAButton>
);

export const GhostCTAButton = ({
  children,
  className,
  ...props
}: Omit<CTAButtonProps, 'variant'>) => (
  <CTAButton
    variant="ghost"
    className={cn(
      'text-white hover:bg-white/10',
      'backdrop-blur-sm',
      className
    )}
    {...props}
  >
    {children}
  </CTAButton>
);

// Hero-specific CTA button group
export interface CTAButtonGroupProps {
  primaryCTA?: {
    text: string;
    href: string;
    external?: boolean;
  };
  secondaryCTA?: {
    text: string;
    href: string;
    external?: boolean;
  };
  alignment?: 'left' | 'center' | 'right';
  spacing?: 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function CTAButtonGroup({
  primaryCTA,
  secondaryCTA,
  alignment = 'left',
  spacing = 'md',
  direction = 'horizontal',
  className,
}: CTAButtonGroupProps) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const spacingClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const directionClasses = {
    horizontal: 'flex-col sm:flex-row',
    vertical: 'flex-col',
  };

  if (!primaryCTA && !secondaryCTA) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        alignmentClasses[alignment],
        spacingClasses[spacing],
        className
      )}
    >
      {primaryCTA && (
        <PrimaryCTAButton
          href={primaryCTA.href}
          external={primaryCTA.external}
          size="xl"
        >
          {primaryCTA.text}
        </PrimaryCTAButton>
      )}

      {secondaryCTA && (
        <SecondaryCTAButton
          href={secondaryCTA.href}
          external={secondaryCTA.external}
          size="xl"
        >
          {secondaryCTA.text}
        </SecondaryCTAButton>
      )}
    </div>
  );
}

// Export types
export type CTAButtonVariant = CTAButtonProps['variant'];
export type CTAButtonSize = CTAButtonProps['size'];
export type CTAButtonIcon = CTAButtonProps['icon'];
