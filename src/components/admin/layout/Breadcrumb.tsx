'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav 
      className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Home link */}
      <Link 
        href="/admin/dashboard" 
        className="flex items-center hover:text-gray-700 transition-colors"
        title="Dashboard Home"
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <React.Fragment key={item.href}>
            {/* Separator */}
            <ChevronRight className="w-4 h-4 text-gray-400" />
            
            {/* Breadcrumb Item */}
            {isLast ? (
              <span 
                className="font-medium text-gray-900 flex items-center"
                aria-current="page"
              >
                {Icon && <Icon className="w-4 h-4 mr-1" />}
                {item.label}
              </span>
            ) : (
              <Link 
                href={item.href}
                className="hover:text-gray-700 transition-colors flex items-center"
              >
                {Icon && <Icon className="w-4 h-4 mr-1" />}
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Helper function to generate breadcrumbs from pathname
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  if (segments[0] !== 'admin') return breadcrumbs;
  
  let path = '/admin';
  
  // Skip 'admin' segment and start from the actual sections
  for (let i = 1; i < segments.length; i++) {
    path += `/${segments[i]}`;
    const segment = segments[i];
    
    // Convert segment to readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      label,
      href: path,
    });
  }
  
  return breadcrumbs;
}

// Predefined breadcrumb configurations for common admin sections
export const BREADCRUMB_CONFIGS = {
  customers: {
    main: { label: 'Customers', href: '/admin/customers' },
    directory: { label: 'Customer Directory', href: '/admin/customers' },
    membership: { label: 'Membership Analytics', href: '/admin/customers/membership' },
    referrals: { label: 'Referral System', href: '/admin/customers/referrals' },
  },
  products: {
    main: { label: 'Products', href: '/admin/products' },
    catalog: { label: 'Product Catalog', href: '/admin/products' },
    categories: { label: 'Categories', href: '/admin/categories' },
    inventory: { label: 'Inventory', href: '/admin/products/inventory' },
    import: { label: 'Import/Export', href: '/admin/products/import' },
  },
  orders: {
    main: { label: 'Orders', href: '/admin/orders' },
    all: { label: 'All Orders', href: '/admin/orders' },
    shipping: { label: 'Shipping', href: '/admin/orders/shipping' },
    fulfillment: { label: 'Fulfillment', href: '/admin/orders/fulfillment' },
    analytics: { label: 'Order Analytics', href: '/admin/orders/analytics' },
  },
};