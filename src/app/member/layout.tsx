/**
 * Member Layout - JRM E-commerce Platform
 * Layout for member-only pages with navigation
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicMemberLogo } from '@/components/member/DynamicMemberLogo';
import { MEMBER_PAGE_TEXT } from '@/lib/constants/member-text';
import {
  User,
  ShoppingBag,
  MapPin,
  Clock,
  Menu,
  X,
  LogOut,
  Home,
} from 'lucide-react';

interface MemberLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    label: 'Profile',
    href: '/member/profile',
    icon: User,
  },
  {
    label: 'My Orders',
    href: '/member/orders',
    icon: ShoppingBag,
  },
  {
    label: 'Addresses',
    href: '/member/addresses',
    icon: MapPin,
  },
  {
    label: 'Recently Viewed',
    href: '/member/recently-viewed',
    icon: Clock,
  },
];

export default function MemberLayout({ children }: MemberLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if not authenticated
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

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const isActiveRoute = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-center h-20 px-6 border-b border-gray-200 relative">
          <DynamicMemberLogo />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-6 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Member Status */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
          <div className="flex flex-col items-center justify-center space-y-2">
            <p className="font-medium text-gray-900 text-center">{session.user.name}</p>
            <div className="flex items-center justify-center">
              {session.user.isMember ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  ✨ Active Member
                </Badge>
              ) : (
                <Badge variant="outline">{MEMBER_PAGE_TEXT.STATUS.REGULAR}</Badge>
              )}
            </div>
          </div>
        </div>

        <nav className="mt-6 px-3">
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
              );
            })}
          </div>
        </nav>
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

              {/* Navigation breadcrumb */}
              <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500">
                <Link href="/" className="hover:text-gray-700">
                  Home
                </Link>
                <span>/</span>
                <span className="text-gray-900">Member Area</span>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  <Button variant="ghost" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Store
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">{children}</main>
      </div>
    </div>
  );
}
