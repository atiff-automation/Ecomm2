/**
 * Main Navigation Component - JRM E-commerce Platform
 * Modern navigation with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Star, Zap, Gift, Truck } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  children?: NavigationItem[];
  featured?: boolean;
  imageUrl?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface MainNavProps {
  items: NavigationItem[];
  className?: string;
}

export function MainNav({ items, className }: MainNavProps) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleDropdownChange = (itemLabel: string, isOpen: boolean) => {
    setOpenDropdown(isOpen ? itemLabel : null);
  };

  return (
    <nav
      className={cn(
        'hidden md:flex items-center space-x-1',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const active = isActive(item.href);

        if (hasChildren) {
          return (
            <DropdownMenu
              key={item.label}
              onOpenChange={(isOpen) => handleDropdownChange(item.label, isOpen)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'h-auto px-3 py-2 font-medium text-sm',
                    'hover:text-primary hover:bg-primary/5',
                    'focus:text-primary focus:bg-primary/5',
                    'transition-all duration-200',
                    active && 'text-primary bg-primary/10',
                    'group relative'
                  )}
                  aria-expanded={openDropdown === item.label}
                  aria-haspopup="menu"
                >
                  <span className="flex items-center gap-1">
                    {item.icon && (
                      <item.icon className="h-4 w-4" />
                    )}
                    {item.label}
                    <ChevronDown className={cn(
                      'h-3 w-3 transition-transform duration-200',
                      openDropdown === item.label && 'rotate-180'
                    )} />
                  </span>
                  {item.badge && (
                    <Badge
                      variant={item.badge.variant || 'secondary'}
                      className="ml-2 text-xs"
                    >
                      {item.badge.text}
                    </Badge>
                  )}
                  {/* Active indicator */}
                  {active && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={cn(
                  'w-56 p-2',
                  'border border-border/50 shadow-lg',
                  'bg-background/95 backdrop-blur-sm'
                )}
                align="start"
                sideOffset={4}
              >
                {item.children.map((child) => (
                  <DropdownMenuItem key={child.href} asChild className="p-0">
                    <Link
                      href={child.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md',
                        'text-sm transition-colors duration-200',
                        'hover:bg-primary/5 hover:text-primary',
                        'focus:bg-primary/5 focus:text-primary',
                        isActive(child.href) && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      {child.icon && (
                        <child.icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{child.label}</span>
                          {child.featured && (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          )}
                          {child.badge && (
                            <Badge
                              variant={child.badge.variant || 'secondary'}
                              className="text-xs"
                            >
                              {child.badge.text}
                            </Badge>
                          )}
                        </div>
                        {child.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {child.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative px-3 py-2 text-sm font-medium',
              'rounded-md transition-all duration-200',
              'hover:text-primary hover:bg-primary/5',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'focus:text-primary focus:bg-primary/5',
              active && 'text-primary bg-primary/10',
              'flex items-center gap-2'
            )}
          >
            {item.icon && (
              <item.icon className="h-4 w-4" />
            )}
            <span>{item.label}</span>
            {item.badge && (
              <Badge
                variant={item.badge.variant || 'secondary'}
                className="text-xs"
              >
                {item.badge.text}
              </Badge>
            )}
            {item.featured && (
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            )}
            {/* Active indicator */}
            {active && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// Default navigation configuration
export const defaultNavigationItems: NavigationItem[] = [
  {
    label: 'Products',
    href: '/products',
    icon: Zap,
    children: [
      {
        label: 'All Products',
        href: '/products',
        description: 'Browse our complete collection'
      },
      {
        label: 'New Arrivals',
        href: '/products/new',
        featured: true,
        description: 'Latest additions to our store',
        badge: { text: 'New', variant: 'destructive' }
      },
      {
        label: 'Best Sellers',
        href: '/products/bestsellers',
        featured: true,
        description: 'Most popular items',
        icon: Star
      },
      {
        label: 'On Sale',
        href: '/products/sale',
        description: 'Discounted items',
        badge: { text: 'Sale', variant: 'destructive' }
      }
    ]
  },
  {
    label: 'Categories',
    href: '/categories',
    children: [
      {
        label: 'Electronics',
        href: '/categories/electronics',
        description: 'Phones, laptops, accessories'
      },
      {
        label: 'Fashion',
        href: '/categories/fashion',
        description: 'Clothing, shoes, accessories'
      },
      {
        label: 'Home & Garden',
        href: '/categories/home-garden',
        description: 'Furniture, decor, gardening'
      },
      {
        label: 'Sports & Outdoor',
        href: '/categories/sports',
        description: 'Fitness, outdoor activities'
      }
    ]
  },
  {
    label: 'Deals',
    href: '/deals',
    icon: Gift,
    badge: { text: 'Hot', variant: 'destructive' },
    featured: true
  },
  {
    label: 'Track Order',
    href: '/track-order',
    icon: Truck
  },
  {
    label: 'About',
    href: '/about'
  }
];

export default MainNav;