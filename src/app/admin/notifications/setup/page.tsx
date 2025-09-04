'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SetupWizard, WizardData } from '@/components/telegram/setup-wizard/SetupWizard';
import { AdminPageLayout } from '@/components/admin/layout';
import { toast } from 'sonner';

export default function TelegramSetupPage() {
  const router = useRouter();

  const handleSetupComplete = (data: WizardData) => {
    toast.success('Telegram notifications setup completed successfully!');
    router.push('/admin/notifications');
  };

  const handleSetupCancel = () => {
    router.push('/admin/notifications');
  };

  return (
    <AdminPageLayout>
      <div className="container mx-auto py-8">
        <SetupWizard
          onComplete={handleSetupComplete}
          onCancel={handleSetupCancel}
        />
      </div>
    </AdminPageLayout>
  );
}