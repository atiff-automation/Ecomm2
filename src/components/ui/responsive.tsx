/**
 * Responsive UI Components - Centralized Responsive Design System
 * Following CLAUDE.md systematic approach for DRY and centralized implementation
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  responsiveTypography,
  gridPatterns,
  responsiveSpacing,
  layoutPatterns,
  imagePatterns,
  responsiveButtons,
  formPatterns,
  utils
} from '@/lib/design-tokens';

// Responsive Typography Component
interface ResponsiveHeadingProps {
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const ResponsiveHeading: React.FC<ResponsiveHeadingProps> = ({
  level,
  children,
  className,
  ...props
}) => {
  const Component = level;
  const responsiveClass = responsiveTypography[level];

  return (
    <Component
      className={cn(responsiveClass, className)}
      {...props}
    >
      {children}
    </Component>
  );
};

// Responsive Text Component
interface ResponsiveTextProps {
  variant?: 'body' | 'small' | 'caption';
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  variant = 'body',
  children,
  className
}) => {
  const responsiveClass = responsiveTypography[variant];

  return (
    <p className={cn(responsiveClass, className)}>
      {children}
    </p>
  );
};

// Responsive Grid Component
interface ResponsiveGridProps {
  pattern: keyof typeof gridPatterns;
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  pattern,
  children,
  className
}) => {
  const gridClass = gridPatterns[pattern];

  return (
    <div className={cn(gridClass, className)}>
      {children}
    </div>
  );
};

// Responsive Container Component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = '2xl'
}) => {
  const maxWidthClass = maxWidth === 'full' ? 'w-full' : `max-w-${maxWidth}`;

  return (
    <div className={cn('mx-auto', responsiveSpacing.container, maxWidthClass, className)}>
      {children}
    </div>
  );
};

// Responsive Section Component
interface ResponsiveSectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'wide';
}

export const ResponsiveSection: React.FC<ResponsiveSectionProps> = ({
  children,
  className,
  spacing = 'normal'
}) => {
  const spacingClass = spacing === 'tight' ? 'py-6 sm:py-8 lg:py-12' :
                      spacing === 'wide' ? 'py-12 sm:py-16 lg:py-24' :
                      responsiveSpacing.section;

  return (
    <section className={cn(spacingClass, className)}>
      {children}
    </section>
  );
};

// Responsive Image Component
interface ResponsiveImageProps {
  src: string;
  alt: string;
  pattern: keyof typeof imagePatterns;
  className?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  pattern,
  className
}) => {
  const imageClass = imagePatterns[pattern];

  return (
    <img
      src={src}
      alt={alt}
      className={cn(imageClass, 'rounded-lg', className)}
    />
  );
};

// Responsive Button Component
interface ResponsiveButtonProps {
  variant?: keyof typeof responsiveButtons;
  children: React.ReactNode;
  className?: string;
  fullWidthOnMobile?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  variant = 'primary',
  children,
  className,
  fullWidthOnMobile = false,
  ...props
}) => {
  const buttonClass = responsiveButtons[variant];
  const mobileClass = fullWidthOnMobile ? 'w-full sm:w-auto' : '';

  return (
    <button
      className={cn(buttonClass, mobileClass, className)}
      {...props}
    >
      {children}
    </button>
  );
};

// Responsive Stack Component
interface ResponsiveStackProps {
  spacing?: 'tight' | 'normal' | 'wide';
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  spacing = 'normal',
  children,
  className
}) => {
  const spacingClass = spacing === 'tight' ? layoutPatterns.stackTight :
                      spacing === 'wide' ? layoutPatterns.stackWide :
                      layoutPatterns.stack;

  return (
    <div className={cn(spacingClass, className)}>
      {children}
    </div>
  );
};

// Responsive Flex Component
interface ResponsiveFlexProps {
  direction?: 'col' | 'row' | 'col-reverse' | 'row-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: keyof typeof responsiveSpacing.gap;
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'md',
  children,
  className
}) => {
  const directionClass = direction === 'row' ? layoutPatterns.flexRow :
                        direction === 'col' ? layoutPatterns.flexCol :
                        `flex flex-${direction}`;

  const alignClass = `items-${align}`;
  const justifyClass = justify === 'between' ? 'justify-between' :
                      justify === 'around' ? 'justify-around' :
                      justify === 'evenly' ? 'justify-evenly' :
                      `justify-${justify}`;

  const wrapClass = wrap ? 'flex-wrap' : '';
  const gapClass = responsiveSpacing.gap[gap];

  return (
    <div className={cn(directionClass, alignClass, justifyClass, wrapClass, gapClass, className)}>
      {children}
    </div>
  );
};

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'tight' | 'normal' | 'wide';
  shadow?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  padding = 'normal',
  shadow = true
}) => {
  const paddingClass = padding === 'tight' ? 'p-3 sm:p-4' :
                      padding === 'wide' ? responsiveSpacing.component :
                      responsiveSpacing.card;

  const shadowClass = shadow ? 'shadow-sm hover:shadow-md transition-shadow' : '';

  return (
    <div className={cn('bg-white rounded-lg border', paddingClass, shadowClass, className)}>
      {children}
    </div>
  );
};

// Responsive Table Wrapper for mobile optimization
interface ResponsiveTableProps {
  children: React.ReactNode;
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveTableWrapper: React.FC<ResponsiveTableProps> = ({
  children,
  mobileBreakpoint = 'lg',
  className
}) => {
  const hideClass = `hidden ${mobileBreakpoint}:block`;

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Table */}
      <div className={hideClass}>
        <div className="overflow-x-auto">
          {children}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className={`${mobileBreakpoint}:hidden`}>
        <div className="space-y-4">
          {/* Mobile card implementation would be handled by the parent component */}
          {children}
        </div>
      </div>
    </div>
  );
};

// Responsive Form Field Component
interface ResponsiveFormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}

export const ResponsiveFormField: React.FC<ResponsiveFormFieldProps> = ({
  label,
  children,
  required = false,
  error,
  className
}) => {
  return (
    <div className={cn(formPatterns.field, className)}>
      <label className={cn(formPatterns.label, required && 'after:content-["*"] after:text-red-500 after:ml-1')}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

// Responsive Input Component
interface ResponsiveInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  className,
  ...props
}) => {
  return (
    <input
      className={cn(formPatterns.input, 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500', className)}
      {...props}
    />
  );
};

// Mobile-only and Desktop-only visibility components
export const MobileOnly: React.FC<{ children: React.ReactNode; breakpoint?: 'sm' | 'md' | 'lg' }> = ({
  children,
  breakpoint = 'lg'
}) => (
  <div className={`${breakpoint}:hidden`}>
    {children}
  </div>
);

export const DesktopOnly: React.FC<{ children: React.ReactNode; breakpoint?: 'sm' | 'md' | 'lg' }> = ({
  children,
  breakpoint = 'lg'
}) => (
  <div className={`hidden ${breakpoint}:block`}>
    {children}
  </div>
);

// Export utility hook for responsive utilities
export const useResponsiveUtils = () => {
  return {
    gridPatterns,
    responsiveSpacing,
    layoutPatterns,
    imagePatterns,
    responsiveButtons,
    formPatterns,
    responsiveTypography,
    utils,
  };
};