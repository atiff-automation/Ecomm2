/**
 * Section Header Component - JRM E-commerce Platform
 * Reusable section header with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { designSystem, sectionTypography } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
  Fire,
  Gift,
  Heart,
  ShoppingBag,
  Crown,
  Gem,
  Award
} from 'lucide-react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  variant?: 'default' | 'featured' | 'compact' | 'minimal' | 'hero';
  alignment?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ComponentType<{ className?: string }>;
  iconVariant?: 'default' | 'primary' | 'accent' | 'gradient';
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    icon?: React.ComponentType<{ className?: string }>;
  };
  action?: {
    label: string;
    href: string;
    variant?: 'default' | 'outline' | 'ghost' | 'link';
    icon?: React.ComponentType<{ className?: string }>;
  };
  showDecorations?: boolean;
  decorativeElements?: {
    showLines?: boolean;
    showDots?: boolean;
    showGradient?: boolean;
  };
  className?: string;
}

const iconVariants = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  accent: 'text-accent',
  gradient: 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'
};

const sizeClasses = {
  sm: {
    title: 'text-xl md:text-2xl',
    subtitle: 'text-sm',
    description: 'text-sm',
    icon: 'h-4 w-4',
    spacing: 'space-y-2'
  },
  md: {
    title: 'text-2xl md:text-3xl',
    subtitle: 'text-sm',
    description: 'text-base',
    icon: 'h-5 w-5',
    spacing: 'space-y-3'
  },
  lg: {
    title: 'text-3xl md:text-4xl',
    subtitle: 'text-base',
    description: 'text-lg',
    icon: 'h-6 w-6',
    spacing: 'space-y-4'
  },
  xl: {
    title: 'text-4xl md:text-5xl lg:text-6xl',
    subtitle: 'text-lg',
    description: 'text-xl',
    icon: 'h-8 w-8',
    spacing: 'space-y-6'
  }
};

const alignmentClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
};

const variantSpacing = {
  default: 'mb-8',
  featured: 'mb-12',
  compact: 'mb-6',
  minimal: 'mb-4',
  hero: 'mb-16'
};

export function SectionHeader({
  title,
  subtitle,
  description,
  variant = 'default',
  alignment = 'center',
  size = 'md',
  icon: IconComponent,
  iconVariant = 'primary',
  badge,
  action,
  showDecorations = false,
  decorativeElements = {
    showLines: true,
    showDots: false,
    showGradient: false
  },
  className
}: SectionHeaderProps) {
  const sizeConfig = sizeClasses[size];
  const alignmentClass = alignmentClasses[alignment];
  const spacingClass = variantSpacing[variant];

  return (
    <div className={cn(
      'relative',
      alignmentClass,
      spacingClass,
      sizeConfig.spacing,
      className
    )}>
      {/* Decorative Background Elements */}
      {showDecorations && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {decorativeElements.showGradient && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-3xl" />
          )}
          {decorativeElements.showDots && (
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
              <div className="grid grid-cols-8 gap-1 h-full w-full">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{
                    animationDelay: `${i * 50}ms`
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtitle with Icon */}
      {subtitle && (
        <div className={cn(
          'flex items-center gap-2 mb-3',
          alignment === 'center' && 'justify-center',
          alignment === 'right' && 'justify-end'
        )}>
          {IconComponent && (
            <IconComponent className={cn(
              sizeConfig.icon,
              iconVariants[iconVariant]
            )} />
          )}
          <span className={cn(
            sectionTypography.overline(),
            'font-medium tracking-wide uppercase',
            iconVariant === 'primary' ? 'text-primary' : 'text-muted-foreground',
            sizeConfig.subtitle
          )}>
            {subtitle}
          </span>
          {badge && (
            <Badge variant={badge.variant || 'secondary'} className="text-xs">
              {badge.icon && <badge.icon className="w-3 h-3 mr-1" />}
              {badge.text}
            </Badge>
          )}
        </div>
      )}

      {/* Main Title */}
      <div className="relative">
        <h2 className={cn(
          'font-bold text-foreground',
          sizeConfig.title,
          variant === 'hero' && 'bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent'
        )}>
          {title}
        </h2>

        {/* Decorative Lines */}
        {showDecorations && decorativeElements.showLines && alignment === 'center' && (
          <div className="absolute top-1/2 left-0 right-0 flex items-center justify-center -translate-y-1/2 pointer-events-none">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent max-w-xs" />
            <div className="px-6">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent max-w-xs" />
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className={cn(
          'text-muted-foreground leading-relaxed',
          sizeConfig.description,
          alignment === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl',
          variant === 'hero' && 'max-w-3xl'
        )}>
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <div className={cn(
          'mt-6',
          alignment === 'center' && 'flex justify-center',
          alignment === 'right' && 'flex justify-end'
        )}>
          <Link href={action.href}>
            <Button
              variant={action.variant || 'outline'}
              size={size === 'xl' ? 'lg' : 'default'}
              className="group"
            >
              <span>{action.label}</span>
              {action.icon ? (
                <action.icon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              ) : (
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              )}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Predefined section header variants
export const FeaturedSectionHeader = ({ className, ...props }: Omit<SectionHeaderProps, 'variant' | 'icon'>) => (
  <SectionHeader
    variant="featured"
    icon={Star}
    iconVariant="primary"
    size="lg"
    showDecorations={true}
    decorativeElements={{ showLines: true, showGradient: true }}
    className={className}
    {...props}
  />
);

export const TrendingSectionHeader = ({ className, ...props }: Omit<SectionHeaderProps, 'variant' | 'icon'>) => (
  <SectionHeader
    variant="featured"
    icon={TrendingUp}
    iconVariant="accent"
    badge={{ text: 'Hot', variant: 'destructive', icon: Fire }}
    showDecorations={true}
    decorativeElements={{ showDots: true }}
    className={className}
    {...props}
  />
);

export const NewArrivalsSectionHeader = ({ className, ...props }: Omit<SectionHeaderProps, 'variant' | 'icon'>) => (
  <SectionHeader
    variant="default"
    icon={Sparkles}
    iconVariant="primary"
    badge={{ text: 'New', variant: 'secondary', icon: Zap }}
    className={className}
    {...props}
  />
);

export const SaleSectionHeader = ({ className, ...props }: Omit<SectionHeaderProps, 'variant' | 'icon'>) => (
  <SectionHeader
    variant="featured"
    icon={Gift}
    iconVariant="accent"
    badge={{ text: 'Limited Time', variant: 'destructive' }}
    showDecorations={true}
    decorativeElements={{ showLines: true, showDots: true }}
    className={className}
    {...props}
  />
);

export const PremiumSectionHeader = ({ className, ...props }: Omit<SectionHeaderProps, 'variant' | 'icon'>) => (
  <SectionHeader
    variant="featured"
    icon={Crown}
    iconVariant="gradient"
    badge={{ text: 'Exclusive', variant: 'outline', icon: Gem }}
    size="lg"
    showDecorations={true}
    decorativeElements={{ showGradient: true }}
    className={className}
    {...props}
  />
);

export const CategorySectionHeader = ({ className, ...props }: Omit<SectionHeaderProps, 'variant' | 'icon'>) => (
  <SectionHeader
    variant="default"
    icon={ShoppingBag}
    iconVariant="primary"
    className={className}
    {...props}
  />
);

export const WishlistSectionHeader = ({ className, ...props }: Omit<SectionHeaderProps, 'variant' | 'icon'>) => (
  <SectionHeader
    variant="compact"
    icon={Heart}
    iconVariant="accent"
    alignment="left"
    className={className}
    {...props}
  />
);

export const BestSellersSectionHeader = ({ className, ...props }: Omit<SectionHeaderProps, 'variant' | 'icon'>) => (
  <SectionHeader
    variant="featured"
    icon={Award}
    iconVariant="primary"
    badge={{ text: 'Top Rated', variant: 'secondary' }}
    showDecorations={true}
    className={className}
    {...props}
  />
);

// Minimal header for compact spaces
export const MinimalSectionHeader = ({ className, ...props }: Omit<SectionHeaderProps, 'variant' | 'size'>) => (
  <SectionHeader
    variant="minimal"
    size="sm"
    alignment="left"
    className={className}
    {...props}
  />
);

// Hero section header for landing pages
export const HeroSectionHeader = ({ className, ...props }: Omit<SectionHeaderProps, 'variant' | 'size' | 'alignment'>) => (
  <SectionHeader
    variant="hero"
    size="xl"
    alignment="center"
    showDecorations={true}
    decorativeElements={{ showLines: true, showGradient: true, showDots: true }}
    className={className}
    {...props}
  />
);

export default SectionHeader;