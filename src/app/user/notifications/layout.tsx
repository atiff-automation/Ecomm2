'use client';

/**
 * User Notifications Layout
 * MULTI-TENANT: User-scoped notification management layout with sidebar navigation
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  ExternalLink,
  MessageSquare,
  Home,
  ChevronLeft,
} from 'lucide-react';
import { UserRole } from '@prisma/client';

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Return to main site',
  },
  {
    label: 'Telegram Notifications',
    href: '/user/notifications/telegram',
    icon: MessageSquare,
    description: 'Configure your personal Telegram notifications',
  },
  {
    label: 'Settings',
    href: '/user/settings',
    icon: Settings,
    description: 'Account Settings',
  },
];

export default function UserNotificationsLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Handle redirects in useEffect to avoid setState during render
  React.useEffect(() => {
    if (status === 'loading') {
      return; // Still loading, wait
    }

    if (status === 'unauthenticated' || !session?.user) {
      console.log('❌ User access denied: No valid session', { status, hasUser: !!session?.user });
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/user/notifications/telegram'));
      return;
    }

    console.log('✅ User access granted:', { user: session.user.name, role: session.user.role });
  }, [status, session, router]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading user panel...</p>
        </div>
      </div>
    );
  }

  // Show loading until auth check completes
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/" className="flex items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">JRM</span>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">
                My Account
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
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title={item.description}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        isActive
                          ? 'text-green-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Admin Access Link (if user has admin role) */}
            {session?.user?.role && [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF].includes(session.user.role as UserRole) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href="/admin/dashboard"
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <Settings className="mr-3 h-5 w-5 text-blue-500 group-hover:text-blue-600" />
                  Admin Panel
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Link>
              </div>
            )}
          </nav>

          {/* User Profile Section at Bottom */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user.name}
                </p>
                <div className="flex items-center">
                  <Badge variant="outline" className="text-xs">
                    {session.user.email}
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

              {/* Left side breadcrumb */}
              <div className="hidden lg:flex items-center text-sm text-gray-500">
                <Link href="/" className="hover:text-gray-700 transition-colors">
                  Home
                </Link>
                <ChevronLeft className="h-4 w-4 mx-2 rotate-180" />
                <span>My Account</span>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Back to Main Site */}
                <Link
                  href="/"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Back to Main Site"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Site</span>
                </Link>
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