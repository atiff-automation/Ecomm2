'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminNavigation, type NavigationItem } from '@/config/admin-navigation';
import { UserRole } from '@prisma/client';

interface SidebarProps {
  userRole: UserRole;
  className?: string;
}

export function Sidebar({ userRole, className = '' }: SidebarProps) {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const filteredNavigationItems = adminNavigation.filter(item => {
    return item.roles.includes(userRole);
  });

  return (
    <nav className={`mt-6 px-3 flex-1 overflow-y-auto ${className}`}>
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
  );
}
