'use client';

import React from 'react';
import { AdminPageLayout } from '@/components/admin/layout';
import { getSettingsTabsAsTabConfig } from './settingsConfig';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const tabs = getSettingsTabsAsTabConfig();

  return (
    <AdminPageLayout
      title="Settings"
      subtitle="Manage your business configuration and system settings"
      tabs={tabs}
    >
      {children}
    </AdminPageLayout>
  );
}
