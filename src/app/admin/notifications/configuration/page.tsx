'use client';

import React from 'react';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';
import { ConfigurationManager } from '@/components/telegram/ConfigurationManager';
import { Settings } from 'lucide-react';

export default function NotificationsConfigurationPage() {
  // Define streamlined tabs for Telegram system
  const tabs: TabConfig[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/admin/notifications',
    },
    {
      id: 'configuration',
      label: 'Configuration',
      href: '/admin/notifications/configuration',
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      href: '/admin/notifications/monitoring',
    },
  ];

  return (
    <AdminPageLayout
      title="Telegram Configuration"
      subtitle="Configure bot settings, channels, and manage your Telegram notification system"
      tabs={tabs}
    >
      <ConfigurationManager />
    </AdminPageLayout>
  );
}