'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface TabConfig {
  id: string;
  label: string;
  href: string;
  badge?: number;
}

interface ContextualTabsProps {
  tabs: TabConfig[];
  className?: string;
}

export function ContextualTabs({ tabs, className = '' }: ContextualTabsProps) {
  const pathname = usePathname();

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-white border-b border-gray-200', className)}>
      <div className="px-6">
        <nav className="flex space-x-8 h-12" role="tablist">
          {tabs.map(tab => {
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                  'hover:text-gray-700 hover:border-gray-300',
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                )}
                role="tab"
                aria-selected={isActive}
              >
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <Badge
                    variant={isActive ? 'default' : 'secondary'}
                    className="ml-2 h-5 min-w-[20px] text-xs"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
