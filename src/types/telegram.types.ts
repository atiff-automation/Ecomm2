/**
 * Telegram notification types and interfaces
 * Used for form submission notifications and Telegram service integration
 */

export enum TelegramChannel {
  ORDERS = 'ORDERS',
  INVENTORY = 'INVENTORY',
  CHAT_MANAGEMENT = 'CHAT_MANAGEMENT',
  SYSTEM_ALERTS = 'SYSTEM_ALERTS',
  FORM_SUBMISSIONS = 'FORM_SUBMISSIONS',
}

export interface TelegramConfig {
  botToken: string;
  ordersChatId: string;
  ordersEnabled: boolean;
  inventoryChatId: string | null;
  inventoryEnabled: boolean;
  chatManagementChatId: string | null;
  chatManagementEnabled: boolean;
  systemAlertsChatId: string | null;
  systemAlertsEnabled: boolean;
  formSubmissionsChatId: string | null;
  formSubmissionsEnabled: boolean;
}

export interface FormSubmissionData {
  id: string;
  clickPageId: string;
  blockId: string;
  data: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface ClickPageData {
  id: string;
  title: string;
  slug: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface FormBlockData {
  id: string;
  type: 'FORM';
  settings: {
    title?: string;
    description?: string;
    fields: FormField[];
    submitButtonText: string;
    successMessage: string;
    redirectUrl?: string;
    webhookUrl?: string;
    emailNotification?: {
      enabled: boolean;
      recipients: string[];
      subject: string;
    };
  };
}
