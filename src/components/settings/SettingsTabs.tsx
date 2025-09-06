'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SettingsTab {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

interface SettingsTabsProps {
  tabs: SettingsTab[];
  className?: string;
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  tabs,
  className = ''
}) => {
  const pathname = usePathname();

  return (
    <div className={cn('border-b border-gray-200', className)}>
      <nav className="-mb-px flex space-x-8" aria-label="Settings navigation">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const isDisabled = tab.disabled;

          return (
            <Link
              key={tab.id}
              href={isDisabled ? '#' : tab.href}
              className={cn(
                'flex items-center space-x-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                {
                  'border-primary text-primary': isActive,
                  'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300': 
                    !isActive && !isDisabled,
                  'border-transparent text-muted-foreground/50 cursor-not-allowed': isDisabled
                }
              )}
              aria-current={isActive ? 'page' : undefined}
              tabIndex={isDisabled ? -1 : undefined}
            >
              {tab.icon && (
                <span className={cn('h-5 w-5', {
                  'text-primary': isActive,
                  'text-muted-foreground': !isActive
                })}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  {
                    'bg-primary/10 text-primary': isActive,
                    'bg-muted text-muted-foreground': !isActive
                  }
                )}>
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

interface SettingsTabContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SettingsTabContent: React.FC<SettingsTabContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={cn('py-6', className)}>
      {children}
    </div>
  );
};