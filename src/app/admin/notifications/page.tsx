/**
 * Admin Telegram Notifications Configuration - Malaysian E-commerce Platform
 * SIMPLIFIED: Single page for Telegram configuration following KISS principle
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH | CENTRALIZED
 */

'use client';

import React from 'react';
import { AdminPageLayout } from '@/components/admin/layout';
import { SimpleTelegramConfig } from '@/components/admin/telegram/SimpleTelegramConfig';

export default function NotificationsPage() {
  return (
    <AdminPageLayout
      title="Telegram Notifications"
      subtitle="Configure automated notifications for orders, inventory, and system alerts"
    >
      <SimpleTelegramConfig />
    </AdminPageLayout>
  );
}
