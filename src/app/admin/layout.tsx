'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicAdminLogo } from '@/components/admin/DynamicAdminLogo';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Truck,
  Palette,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  ExternalLink,
  MessageCircle,
  CreditCard,
  Monitor,
  BarChart3,
} from 'lucide-react';
import { UserRole } from '@prisma/client';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  // 🏠 Dashboard Section
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Overview & Alerts',
  },

  // 📦 Orders Section - Flat structure, contextual tabs handle sub-sections
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'All Orders, Shipping, Fulfillment, Analytics',
  },

  // 🛍️ Products Section - Flat structure, contextual tabs handle sub-sections
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Catalog, Categories, Inventory',
  },

  // 👥 Customers Section - Flat structure, contextual tabs handle sub-sections
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: Users,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Directory, Membership, Referrals',
  },

  // 👤 Agent Applications Section - Agent application management
  {
    label: 'Agent Applications',
    href: '/admin/agent-applications',
    icon: User,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Manage and review agent applications',
  },

  // 💳 Payments Section - New section per standard
  {
    label: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Gateways, Transactions, Refunds',
  },

  // 🚚 Shipping Section - Contextual tabs handle Configuration, Couriers, Tracking
  {
    label: 'Shipping',
    href: '/admin/shipping',
    icon: Truck,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Configuration, Couriers, Tracking',
  },

  // 📊 Reports Section - Sales analytics and reporting
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Sales Analytics, Performance Reports',
  },

  // 💬 Chat Management Section - Chat monitoring and analytics
  {
    label: 'Chat Management',
    href: '/admin/chat',
    icon: MessageCircle,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Chat Sessions, Analytics, Support',
  },

  // Additional sections that exist but don't fit main categories
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    description: 'System Notifications',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    description: 'Business Profile, Tax Config, Site Customization',
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
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
      console.log('❌ Admin access denied: No valid session', { status, hasUser: !!session?.user });
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/admin/dashboard'));
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
      hasValidRole
    });

    if (!hasValidRole) {
      console.log('❌ Admin access denied: Insufficient role', { userRole, required: allowedRoles });
      router.push('/?error=access_denied');
      return;
    }

    console.log('✅ Admin access granted:', { userRole, user: session.user.name });
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
          <p className="text-sm text-gray-500 mb-4">Current role: {userRole}</p>
          <p className="text-sm text-gray-500 mb-4">Required roles: SUPERADMIN, ADMIN, or STAFF</p>
          <Button onClick={() => router.push('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Removed toggleSubmenu - no longer needed for flat structure

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
          <DynamicAdminLogo />
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

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title={item.description}
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
