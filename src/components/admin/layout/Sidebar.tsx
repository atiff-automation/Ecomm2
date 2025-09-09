'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Home,
  Package,
  Users,
  CreditCard,
  Truck,
  Settings,
  BarChart3,
  Bell,
  FileText,
  FolderOpen,
  BarChart,
  User,
  Crown,
  DollarSign,
  Building2,
  Banknote,
  RotateCcw,
  Wrench,
  ChevronDown,
  Menu,
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: Home,
    children: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/admin/dashboard',
        icon: BarChart3,
      },
      {
        id: 'alerts',
        label: 'Alerts',
        href: '/admin/dashboard/alerts',
        icon: Bell,
      },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/admin/orders',
    icon: Package,
    children: [
      {
        id: 'all-orders',
        label: 'All Orders',
        href: '/admin/orders',
        icon: FileText,
      },
      {
        id: 'shipping',
        label: 'Shipping',
        href: '/admin/orders/shipping',
        icon: Truck,
      },
      {
        id: 'fulfillment',
        label: 'Fulfillment',
        href: '/admin/orders/fulfillment',
        icon: Package,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/admin/orders/analytics',
        icon: BarChart,
      },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    href: '/admin/products',
    icon: FolderOpen,
    children: [
      {
        id: 'catalog',
        label: 'Catalog',
        href: '/admin/products',
        icon: FileText,
      },
      {
        id: 'categories',
        label: 'Categories',
        href: '/admin/products/categories',
        icon: FolderOpen,
      },
      {
        id: 'inventory',
        label: 'Inventory',
        href: '/admin/products/inventory',
        icon: BarChart,
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/admin/customers',
    icon: Users,
    children: [
      {
        id: 'directory',
        label: 'Directory',
        href: '/admin/customers',
        icon: User,
      },
      {
        id: 'membership',
        label: 'Membership',
        href: '/admin/customers/membership',
        icon: Crown,
      },
      {
        id: 'referrals',
        label: 'Referrals',
        href: '/admin/customers/referrals',
        icon: DollarSign,
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
    children: [
      {
        id: 'gateways',
        label: 'Gateways',
        href: '/admin/payments/gateways',
        icon: Building2,
      },
      {
        id: 'transactions',
        label: 'Transactions',
        href: '/admin/payments/transactions',
        icon: Banknote,
      },
      {
        id: 'refunds',
        label: 'Refunds',
        href: '/admin/payments/refunds',
        icon: RotateCcw,
      },
    ],
  },
  {
    id: 'shipping',
    label: 'Shipping',
    href: '/admin/shipping',
    icon: Truck,
    children: [
      {
        id: 'configuration',
        label: 'Configuration',
        href: '/admin/shipping/config',
        icon: Wrench,
      },
      {
        id: 'couriers',
        label: 'Couriers',
        href: '/admin/shipping/couriers',
        icon: Package,
      },
      {
        id: 'tracking',
        label: 'Tracking',
        href: '/admin/shipping/tracking',
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    children: [
      {
        id: 'sales-reports',
        label: 'Sales Reports',
        href: '/admin/reports/sales',
        icon: BarChart,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/admin/reports/analytics',
        icon: BarChart3,
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({
  className = '',
  isMobile = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isActiveParent = (item: NavigationItem) => {
    if (pathname === item.href) {
      return true;
    }
    if (item.children) {
      return item.children.some(
        child =>
          pathname === child.href || pathname.startsWith(child.href + '/')
      );
    }
    return false;
  };

  const isActiveChild = (item: NavigationItem) => {
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  // Auto-expand active parent items
  useEffect(() => {
    const activeParent = navigationItems.find(item => isActiveParent(item));
    if (activeParent && !expandedItems.has(activeParent.id)) {
      setExpandedItems(prev => new Set([...prev, activeParent.id]));
    }
  }, [pathname, expandedItems]);

  const renderNavigationItem = (item: NavigationItem, isChild = false) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = isChild ? isActiveChild(item) : isActiveParent(item);

    return (
      <div key={item.id}>
        <div
          className={cn(
            'group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors',
            isChild ? 'ml-6 pl-3' : '',
            isActive
              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            }
          }}
        >
          {!hasChildren ? (
            <Link
              href={item.href}
              className="flex items-center w-full"
              onClick={onNavigate}
            >
              <Icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-400'
                )}
              />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ) : (
            <div className="flex items-center w-full">
              <Icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-400'
                )}
              />
              <span className="truncate flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center mr-2">
                  {item.badge}
                </span>
              )}
              <ChevronDown
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-transform',
                  isExpanded ? 'rotate-180' : '',
                  isActive ? 'text-blue-600' : 'text-gray-400'
                )}
              />
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo/Brand */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <Link
          href="/admin/dashboard"
          className="flex items-center"
          onClick={onNavigate}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">JRM</span>
          </div>
          <span className="ml-3 text-xl font-semibold text-gray-900">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map(item => renderNavigationItem(item))}
      </nav>
    </>
  );

  if (isMobile) {
    return sidebarContent;
  }

  return (
    <div
      className={cn(
        'w-64 bg-white border-r border-gray-200 flex-shrink-0',
        className
      )}
    >
      {sidebarContent}
    </div>
  );
}
