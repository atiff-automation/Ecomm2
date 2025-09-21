/**
 * Chat Data Management Utilities
 * Following @CLAUDE.md centralized approach - Single Source of Truth
 */

export interface DataManagementConfig {
  retentionDays: number;
  backupDirectory: string;
  gracePeriodDays: number;
  autoDeleteEnabled: boolean;
  backupEnabled: boolean;
}

export interface ExportOptions {
  startDate: Date;
  endDate: Date;
  format: 'json' | 'csv' | 'pdf';
  includeMessages: boolean;
}

export interface BackupResult {
  success: boolean;
  filename?: string;
  fileSize?: number;
  sessionCount?: number;
  error?: string;
}

export interface ChatSessionData {
  id: string;
  userId?: string;
  guestEmail?: string;
  status: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  guestPhone?: string;
  ipAddress?: string;
  lastActivity: Date;
  sessionId: string;
  userAgent?: string;
  messages: ChatMessageData[];
}

export interface ChatMessageData {
  id: string;
  sessionId: string;
  senderType: string;
  content: string;
  messageType: string;
  metadata?: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface DeletionResult {
  success: boolean;
  deletedSessionsCount: number;
  deletedMessagesCount: number;
  error?: string;
}

// Single source of configuration
export const getDataManagementConfig = (): DataManagementConfig => ({
  retentionDays: parseInt(process.env.CHAT_DATA_RETENTION_DAYS || '180'),
  backupDirectory: process.env.CHAT_BACKUP_DIRECTORY || 'backups/chat',
  gracePeriodDays: parseInt(process.env.CHAT_AUTO_DELETE_GRACE_PERIOD_DAYS || '7'),
  autoDeleteEnabled: process.env.CHAT_AUTO_DELETE_ENABLED === 'true',
  backupEnabled: process.env.CHAT_BACKUP_ENABLED === 'true',
});

// Validation utilities
export const validateExportOptions = (options: ExportOptions): ValidationResult => {
  const errors: string[] = [];

  if (!options.startDate) {
    errors.push('Start date is required');
  }

  if (!options.endDate) {
    errors.push('End date is required');
  }

  if (options.startDate && options.endDate && options.startDate > options.endDate) {
    errors.push('Start date must be before end date');
  }

  if (!['json', 'csv', 'pdf'].includes(options.format)) {
    errors.push('Invalid format. Must be json, csv, or pdf');
  }

  const now = new Date();
  if (options.endDate && options.endDate > now) {
    errors.push('End date cannot be in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateDateRange = (startDate: Date, endDate: Date): ValidationResult => {
  const errors: string[] = [];

  if (startDate > endDate) {
    errors.push('Start date must be before end date');
  }

  const maxRangeMonths = 12;
  const monthsDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (monthsDiff > maxRangeMonths) {
    errors.push(`Date range cannot exceed ${maxRangeMonths} months`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// File utilities
export const generateBackupFilename = (year: number, month: number): string => {
  const monthStr = month.toString().padStart(2, '0');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `chat-backup-${year}-${monthStr}-${timestamp}.json`;
};

export const generateExportFilename = (options: ExportOptions): string => {
  const startStr = options.startDate.toISOString().slice(0, 10);
  const endStr = options.endDate.toISOString().slice(0, 10);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `chat-export-${startStr}-to-${endStr}-${timestamp}.${options.format}`;
};

// Date utilities
export const getCutoffDate = (retentionDays: number, gracePeriodDays: number = 0): Date => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays - gracePeriodDays);
  return cutoff;
};

export const getMonthRange = (year: number, month: number): { start: Date; end: Date } => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

// Backup utilities
export const createBackupMetadata = (sessionCount: number, fileSize: number) => ({
  version: '1.0',
  createdAt: new Date().toISOString(),
  sessionCount,
  fileSize,
  format: 'json',
  retentionPolicy: getDataManagementConfig(),
});

// Error handling utilities
export const createErrorResult = (error: string): BackupResult => ({
  success: false,
  error,
});

export const createSuccessResult = (
  filename: string,
  fileSize: number,
  sessionCount: number
): BackupResult => ({
  success: true,
  filename,
  fileSize,
  sessionCount,
});

// Logging utilities
export const logDataOperation = (
  operation: string,
  details: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'info'
) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    details,
    level,
  };

  if (level === 'error') {
    console.error('[Chat Data Management Error]', logEntry);
  } else if (level === 'warn') {
    console.warn('[Chat Data Management Warning]', logEntry);
  } else {
    console.log('[Chat Data Management]', logEntry);
  }
};