import { Building2, Calculator, Palette, Receipt } from 'lucide-react';

export interface SettingsTab {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

export interface SettingsConfig {
  defaultTab: string;
  tabs: SettingsTab[];
}

export const SETTINGS_CONFIG: SettingsConfig = {
  defaultTab: 'business-profile',
  tabs: [
    {
      id: 'business-profile',
      label: 'Business Profile',
      description: 'Company information and legal details',
      icon: Building2,
      path: '/admin/settings/business-profile'
    },
    {
      id: 'tax-configuration',
      label: 'Tax Configuration', 
      description: 'GST/SST settings and tax management',
      icon: Calculator,
      path: '/admin/settings/tax-configuration'
    },
    {
      id: 'site-customization',
      label: 'Site Customization',
      description: 'Themes, branding, and content management',
      icon: Palette,
      path: '/admin/settings/site-customization'
    },
    {
      id: 'receipt-templates',
      label: 'Receipt Templates',
      description: 'Configure receipt and invoice templates for customers',
      icon: Receipt,
      path: '/admin/settings/receipt-templates'
    }
  ]
} as const;

export const getSettingsTabById = (id: string): SettingsTab | undefined => {
  return SETTINGS_CONFIG.tabs.find(tab => tab.id === id);
};

export const getSettingsTabByPath = (path: string): SettingsTab | undefined => {
  return SETTINGS_CONFIG.tabs.find(tab => path.startsWith(tab.path));
};

export const getSettingsTabsAsTabConfig = () => {
  return SETTINGS_CONFIG.tabs.map(tab => ({
    id: tab.id,
    label: tab.label,
    href: tab.path
  }));
};