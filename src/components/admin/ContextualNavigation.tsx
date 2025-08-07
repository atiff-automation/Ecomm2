'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ContextualNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function ContextualNavigation({
  items,
  className = '',
}: ContextualNavigationProps) {
  const pathname = usePathname();

  return (
    <div className={`bg-white border-b border-gray-100 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <nav className="flex items-center space-x-1 text-sm text-gray-500">
          <Link
            href="/admin/dashboard"
            className="hover:text-gray-700 flex items-center"
          >
            <Home className="h-4 w-4" />
          </Link>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <div key={item.href} className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                {isLast ? (
                  <span className="font-medium text-gray-900 flex items-center gap-1">
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={`hover:text-gray-700 flex items-center gap-1 ${
                      isActive ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
