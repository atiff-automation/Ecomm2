'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageCircle,
  Settings,
  BarChart3,
  Users,
  Archive,
  Activity
} from 'lucide-react';

interface ChatLayoutProps {
  children: React.ReactNode;
}

const chatNavigationItems = [
  {
    label: 'Sessions',
    href: '/admin/chat',
    icon: Users,
    description: 'Session Management & Metrics',
  },
  {
    label: 'Analytics',
    href: '/admin/chat/analytics',
    icon: BarChart3,
    description: 'Performance & Usage Analytics',
  },
  {
    label: 'Configuration',
    href: '/admin/chat/config',
    icon: Settings,
    description: 'n8n Integration & Settings',
  },
  {
    label: 'Operations',
    href: '/admin/chat/operations',
    icon: Activity,
    description: 'Queue & Monitoring',
  },
  {
    label: 'Archive',
    href: '/admin/chat/archive',
    icon: Archive,
    description: 'Archived Sessions',
  },
];

export default function ChatLayout({ children }: ChatLayoutProps) {
  const pathname = usePathname();

  const isActiveTab = (href: string) => {
    if (href === '/admin/chat') {
      return pathname === '/admin/chat';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
                  Chat Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Monitor and manage customer chat interactions
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 overflow-x-auto">
            {chatNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveTab(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group relative min-w-0 flex-1 text-center py-4 px-1 font-medium text-sm transition-colors ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-transparent'
                  } border-b-2`}
                  title={item.description}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}