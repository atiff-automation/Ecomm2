'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Truck,
  Gift,
  Palette,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { UserRole } from '@prisma/client';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.STAFF],
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    roles: [UserRole.ADMIN, UserRole.STAFF],
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
    roles: [UserRole.ADMIN, UserRole.STAFF],
    submenu: [
      { label: 'All Products', href: '/admin/products' },
      { label: 'Add Product', href: '/admin/products/create' },
      { label: 'Categories', href: '/admin/categories' },
      { label: 'Import Products', href: '/admin/products/import' },
    ],
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.STAFF],
  },
  {
    label: 'Membership',
    href: '/admin/membership',
    icon: Gift,
    roles: [UserRole.ADMIN, UserRole.STAFF],
    submenu: [
      { label: 'Analytics', href: '/admin/membership/analytics' },
      { label: 'Configuration', href: '/admin/membership/config' },
      { label: 'Member Promotions', href: '/admin/member-promotions' },
    ],
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.STAFF],
  },
  {
    label: 'Shipping',
    href: '/admin/shipping',
    icon: Truck,
    roles: [UserRole.ADMIN, UserRole.STAFF],
  },
  {
    label: 'Site Customization',
    href: '/admin/site-customization',
    icon: Palette,
    roles: [UserRole.ADMIN],
    submenu: [
      {
        label: 'Hero Section',
        href: '/admin/site-customization/hero',
      },
      {
        label: 'Theme Colors',
        href: '/admin/site-customization/theme',
      },
    ],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: [UserRole.ADMIN],
  },
  // Development only - Test tools
  ...(process.env.NODE_ENV === 'development'
    ? [
        {
          label: '🧪 Payment Tests',
          href: '/admin/test/payment-flow',
          icon: Settings,
          roles: [UserRole.ADMIN, UserRole.STAFF],
        },
      ]
    : []),
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if not authenticated or not admin/staff
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user) {
    router.push('/auth/signin');
    return null;
  }

  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.STAFF
  ) {
    router.push('/');
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActiveRoute = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const filteredNavigationItems = navigationItems.filter(item => {
    return item.roles.some(role => role === session.user.role);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/admin/dashboard" className="flex items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">JRM</span>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">
                Admin
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col flex-1">
          <nav className="mt-6 px-3 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {filteredNavigationItems.map(item => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isExpanded = expandedMenus.includes(item.label);

                return (
                  <div key={item.label}>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        className={`flex-1 group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Icon
                          className={`mr-3 h-5 w-5 ${
                            isActive
                              ? 'text-blue-500'
                              : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        {item.label}
                      </Link>
                      {hasSubmenu && (
                        <button
                          onClick={() => toggleSubmenu(item.label)}
                          className="p-1 ml-1 rounded text-gray-400 hover:text-gray-500"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transform transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {hasSubmenu && isExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu?.map(subItem => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === subItem.href
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* User Profile Section at Bottom */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user.name}
                </p>
                <div className="flex items-center">
                  <Badge variant="outline" className="text-xs">
                    {session.user.role}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* View Live Site */}
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="View Live Site"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Live Site
                </a>

                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
                  <Bell className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
