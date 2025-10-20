import { Metadata } from 'next';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import ThemeConsistentTemplateSelector from '@/components/settings/receipt-templates/ThemeConsistentTemplateSelector';

export const metadata: Metadata = {
  title: 'Receipt Templates - Settings',
  description: 'Configure receipt and invoice templates for customer purchases',
};

export default function ReceiptTemplatesPage() {
  return (
    <SettingsLayout>
      <ThemeConsistentTemplateSelector />
    </SettingsLayout>
  );
}
