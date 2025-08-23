'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Home,
  Package,
  FolderOpen,
  Users,
  MoreHorizontal,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

interface MobileNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: MobileNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { id: 'orders', label: 'Orders', href: '/admin/orders', icon: Package },
  { id: 'products', label: 'Products', href: '/admin/products', icon: FolderOpen },
  { id: 'customers', label: 'Customers', href: '/admin/customers', icon: Users },
];

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const closeMoreMenu = () => setIsMoreOpen(false);

  return (
    <div className={cn('fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden', className)}>
      <nav className="flex items-center justify-around px-2 py-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-[60px]',
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className={cn('h-5 w-5 mb-1', active ? 'text-blue-600' : 'text-gray-400')} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        
        {/* More Menu */}
        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-[60px]',
                'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <MoreHorizontal className="h-5 w-5 mb-1 text-gray-400" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[80vh] p-0 bg-white"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">More Options</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <Sidebar isMobile onNavigate={closeMoreMenu} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}