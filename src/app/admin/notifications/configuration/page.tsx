'use client';

import React from 'react';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';
import { SimpleTelegramConfig } from '@/components/admin/telegram/SimpleTelegramConfig';
import { Settings } from 'lucide-react';

export default function NotificationsConfigurationPage() {
  // SIMPLIFIED: Admin-focused tabs following @CLAUDE.md CENTRALIZED approach
  const tabs: TabConfig[] = [
    {
      id: 'notifications',
      label: 'Dashboard',
      href: '/admin/notifications',
    },
    {
      id: 'configuration',
      label: 'Configuration',
      href: '/admin/notifications/configuration',
    },
  ];

  return (
    <AdminPageLayout
      title="Telegram Configuration"
      subtitle="Configure bot settings, channels, and manage your Telegram notification system"
      tabs={tabs}
    >
      <SimpleTelegramConfig />
    </AdminPageLayout>
  );
}