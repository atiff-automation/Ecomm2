'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicAdminLogo } from '@/components/admin/DynamicAdminLogo';
import { Sidebar } from '@/components/admin/layout/Sidebar';
import { Menu, X, LogOut, User, Bell, ExternalLink } from 'lucide-react';
import { UserRole } from '@prisma/client';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Hide sidebar for full-width editor pages (create/edit click pages)
  const isFullWidthPage = React.useMemo(() => {
    if (!pathname) return false;

    const fullWidthRoutes = [
      '/admin/click-pages/create',
      '/admin/click-pages/',
      '/admin/landing-pages/create',
      '/admin/landing-pages/',
    ];

    return fullWidthRoutes.some(route => {
      if (route.endsWith('/create')) {
        return pathname === route;
      }
      // Match edit routes: /admin/click-pages/[id]/edit or /admin/landing-pages/[id]/edit
      if (route.endsWith('/')) {
        return new RegExp(`^${route.replace('/', '\\/')}[^/]+\\/edit$`).test(pathname);
      }
      return false;
    });
  }, [pathname]);

  // Handle redirects in useEffect to avoid setState during render
  React.useEffect(() => {
    if (status === 'loading') {
      return; // Still loading, wait
    }

    if (status === 'unauthenticated' || !session?.user) {
      console.log('❌ Admin access denied: No valid session', {
        status,
        hasUser: !!session?.user,
      });
      router.push(
        '/auth/signin?callbackUrl=' + encodeURIComponent('/admin/dashboard')
      );
      return;
    }

    const userRole = (session.user as any)?.role;
    const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF];
    const hasValidRole = allowedRoles.includes(userRole);

    console.log('🔐 Admin access check:', {
      userRole,
      isSuperAdmin: userRole === UserRole.SUPERADMIN,
      isAdmin: userRole === UserRole.ADMIN,
      isStaff: userRole === UserRole.STAFF,
      allowedRoles,
      hasValidRole,
    });

    if (!hasValidRole) {
      console.log('❌ Admin access denied: Insufficient role', {
        userRole,
        required: allowedRoles,
      });
      router.push('/?error=access_denied');
      return;
    }

    console.log('✅ Admin access granted:', {
      userRole,
      user: session.user.name,
    });
  }, [status, session, router]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading admin panel...</p>
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

  // Check role access
  const userRole = (session.user as any)?.role;
  const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF];
  const hasValidRole = allowedRoles.includes(userRole);

  if (!hasValidRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the admin panel.
          </p>
          <p className="text-sm text-gray-500 mb-4">Current role: {userRole}</p>
          <p className="text-sm text-gray-500 mb-4">
            Required roles: SUPERADMIN, ADMIN, or STAFF
          </p>
          <Button onClick={() => router.push('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Hidden for full-width editor pages */}
      {!isFullWidthPage && (
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 md:w-56 lg:w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
        >
        <div className="flex items-center justify-center h-20 px-6 border-b border-gray-200 relative">
          <DynamicAdminLogo />
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute right-6 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col flex-1">
          <Sidebar userRole={session.user.role as any} />

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
      )}

      {/* Sidebar overlay for mobile/tablet */}
      {!isFullWidthPage && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={isFullWidthPage ? '' : 'md:pl-56 lg:pl-64'}>
        {/* Top navigation */}
        {!isFullWidthPage && (
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
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
        )}

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
