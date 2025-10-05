# Chat Data Management System - Implementation Plan

## Overview
**Following @CLAUDE.md principles**: Systematic, NO hardcode, DRY, single source of truth, centralized approach

This document outlines the implementation of a simplified chat data management system with date-based exports, monthly auto-backups, and 180-day automatic deletion.

## System Architecture

### Design Principles (Following @CLAUDE.md)
- **Single Source of Truth**: All chat data in `ChatSession` table
- **DRY Approach**: Centralized data management utilities
- **No Hardcoded Values**: All configurations via environment variables
- **Systematic Implementation**: Phased rollout with clear dependencies

### Data Flow
```
Active Sessions → 180 days → Auto-Delete (with monthly backups)
                ↓
         Monthly Backup (1st of month)
                ↓
         Admin Download Portal
```

## Implementation Phases

### Phase 1: Environment Configuration
**Single source of truth for all data management settings**

```bash
# Environment variables to add to .env
CHAT_DATA_RETENTION_DAYS=180
CHAT_BACKUP_ENABLED=true
CHAT_BACKUP_DIRECTORY="backups/chat"
CHAT_BACKUP_NOTIFICATION_EMAIL=""
CHAT_AUTO_DELETE_ENABLED=true
CHAT_AUTO_DELETE_GRACE_PERIOD_DAYS=7
```

### Phase 2: Database Schema Updates
**No additional tables needed - following simplicity principle**

```prisma
model ChatSession {
  // Existing fields remain unchanged
  // No new archive table - single source of truth
}

// New model for tracking backup operations
model ChatBackup {
  id          String   @id @default(cuid())
  filename    String   @unique
  month       Int
  year        Int
  createdAt   DateTime @default(now())
  fileSize    BigInt
  sessionCount Int
  status      String   // "completed", "failed", "in_progress"

  @@unique([month, year])
  @@map("chat_backups")
}
```

### Phase 3: Core Data Management Utilities
**Centralized utilities following DRY principles**

#### File: `src/lib/chat/data-management.ts`
```typescript
/**
 * Chat Data Management Utilities
 * Following @CLAUDE.md centralized approach
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

// Single source of configuration
export const getDataManagementConfig = (): DataManagementConfig => ({
  retentionDays: parseInt(process.env.CHAT_DATA_RETENTION_DAYS || '180'),
  backupDirectory: process.env.CHAT_BACKUP_DIRECTORY || 'backups/chat',
  gracePeriodDays: parseInt(process.env.CHAT_AUTO_DELETE_GRACE_PERIOD_DAYS || '7'),
  autoDeleteEnabled: process.env.CHAT_AUTO_DELETE_ENABLED === 'true',
  backupEnabled: process.env.CHAT_BACKUP_ENABLED === 'true',
});
```

#### File: `src/lib/chat/export-service.ts`
```typescript
/**
 * Chat Export Service
 * Centralized export functionality following DRY principles
 */

export class ChatExportService {
  private static instance: ChatExportService;

  public static getInstance(): ChatExportService {
    if (!ChatExportService.instance) {
      ChatExportService.instance = new ChatExportService();
    }
    return ChatExportService.instance;
  }

  async exportByDateRange(options: ExportOptions): Promise<Buffer> {
    // Implementation details
  }

  async generateFilename(options: ExportOptions): string {
    // Systematic filename generation
  }
}
```

#### File: `src/lib/chat/backup-service.ts`
```typescript
/**
 * Chat Backup Service
 * Monthly backup functionality following centralized approach
 */

export class ChatBackupService {
  private static instance: ChatBackupService;

  public static getInstance(): ChatBackupService {
    if (!ChatBackupService.instance) {
      ChatBackupService.instance = new ChatBackupService();
    }
    return ChatBackupService.instance;
  }

  async createMonthlyBackup(year: number, month: number): Promise<BackupResult> {
    // Implementation details
  }

  async getAvailableBackups(): Promise<ChatBackup[]> {
    // Implementation details
  }
}
```

### Phase 4: API Endpoints
**RESTful API following systematic approach**

#### File: `src/app/api/admin/chat/export/route.ts`
```typescript
/**
 * Chat Export API
 * Centralized export endpoint
 */

export async function POST(request: Request) {
  // Date-based export with validation
  // Single endpoint for all export formats
}
```

#### File: `src/app/api/admin/chat/backups/route.ts`
```typescript
/**
 * Chat Backup Management API
 * CRUD operations for backup files
 */

export async function GET() {
  // List available backups
}

export async function POST() {
  // Manual backup creation
}
```

#### File: `src/app/api/admin/chat/backups/[filename]/route.ts`
```typescript
/**
 * Individual Backup Download API
 */

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  // Secure backup file download
}
```

### Phase 5: Background Jobs System
**Centralized job management following systematic approach**

#### File: `src/lib/jobs/chat-data-management.ts`
```typescript
/**
 * Chat Data Management Jobs
 * Centralized background job definitions
 */

export const chatDataManagementJobs = {
  monthlyBackup: {
    name: 'chat-monthly-backup',
    cron: '0 2 1 * *', // 2 AM on 1st of each month
    timezone: process.env.TIMEZONE || 'Asia/Kuala_Lumpur',
  },

  dailyCleanup: {
    name: 'chat-daily-cleanup',
    cron: '0 3 * * *', // 3 AM daily
    timezone: process.env.TIMEZONE || 'Asia/Kuala_Lumpur',
  },
};
```

#### File: `src/lib/jobs/handlers/monthly-backup-handler.ts`
```typescript
/**
 * Monthly Backup Job Handler
 * Systematic backup creation and notification
 */

export async function handleMonthlyBackup() {
  const config = getDataManagementConfig();

  if (!config.backupEnabled) {
    return;
  }

  // Create backup for previous month
  // Send notifications
  // Update backup tracking
}
```

#### File: `src/lib/jobs/handlers/daily-cleanup-handler.ts`
```typescript
/**
 * Daily Cleanup Job Handler
 * Systematic data deletion following retention policy
 */

export async function handleDailyCleanup() {
  const config = getDataManagementConfig();

  if (!config.autoDeleteEnabled) {
    return;
  }

  // Find sessions older than retention period
  // Delete with grace period consideration
  // Log deletion activities
}
```

### Phase 6: Enhanced Archive Page
**Transform existing archive page to data management center**

#### File: `src/app/admin/chat/archive/page.tsx`
```typescript
/**
 * Data Management Dashboard
 * Centralized data operations interface
 */

export default function DataManagementPage() {
  // Date picker export interface
  // Backup file management
  // System status monitoring
}
```

#### File: `src/components/chat/DataExportForm.tsx`
```typescript
/**
 * Data Export Form Component
 * Date picker with export functionality
 */

interface DataExportFormProps {
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
}
```

#### File: `src/components/chat/BackupManagement.tsx`
```typescript
/**
 * Backup Management Component
 * Display and download backup files
 */

interface BackupManagementProps {
  backups: ChatBackup[];
  onDownload: (filename: string) => void;
  onCreateBackup: () => void;
}
```

### Phase 7: Notification System
**Centralized notification following existing Telegram setup**

#### File: `src/lib/notifications/chat-notifications.ts`
```typescript
/**
 * Chat Data Management Notifications
 * Following existing Telegram notification pattern
 */

export class ChatNotificationService {
  private static instance: ChatNotificationService;

  public static getInstance(): ChatNotificationService {
    if (!ChatNotificationService.instance) {
      ChatNotificationService.instance = new ChatNotificationService();
    }
    return ChatNotificationService.instance;
  }

  async notifyBackupComplete(backup: ChatBackup): Promise<void> {
    // Telegram notification
    // Email notification (if configured)
  }

  async notifyDataDeletion(sessionCount: number, cutoffDate: Date): Promise<void> {
    // Notify before deletion
  }
}
```

## Configuration Management

### Environment Variables (Single Source of Truth)
```bash
# Chat Data Management Configuration
CHAT_DATA_RETENTION_DAYS=180
CHAT_BACKUP_ENABLED=true
CHAT_BACKUP_DIRECTORY="backups/chat"
CHAT_BACKUP_NOTIFICATION_EMAIL=""
CHAT_AUTO_DELETE_ENABLED=true
CHAT_AUTO_DELETE_GRACE_PERIOD_DAYS=7

# Notification Configuration (reuse existing)
TELEGRAM_BOT_TOKEN="existing_token"
TELEGRAM_ORDERS_CHAT_ID="existing_chat_id"
```

### Database Migration Plan
```sql
-- Create backup tracking table
CREATE TABLE chat_backups (
  id VARCHAR(255) PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_size BIGINT NOT NULL,
  session_count INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  UNIQUE(month, year)
);

-- Add index for efficient queries
CREATE INDEX idx_chat_backups_year_month ON chat_backups(year, month);
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Environment configuration setup
- [ ] Database schema updates
- [ ] Core utility classes
- [ ] Unit tests for utilities

### Week 2: API Development
- [ ] Export API endpoints
- [ ] Backup management APIs
- [ ] API authentication and validation
- [ ] API integration tests

### Week 3: Background Jobs
- [ ] Job scheduling system
- [ ] Monthly backup job
- [ ] Daily cleanup job
- [ ] Job monitoring and logging

### Week 4: UI Enhancement
- [ ] Enhanced archive page
- [ ] Date picker export form
- [ ] Backup management interface
- [ ] User acceptance testing

### Week 5: Notification & Testing
- [ ] Notification system integration
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Production deployment

## Quality Assurance

### Testing Strategy (Following @CLAUDE.md systematic approach)
1. **Unit Tests**: All utility classes and services
2. **Integration Tests**: API endpoints and database operations
3. **End-to-End Tests**: Complete data management workflows
4. **Performance Tests**: Large dataset export and backup operations

### Monitoring and Logging
- Background job execution logs
- Export operation metrics
- Backup file integrity verification
- System resource usage monitoring

### Security Considerations
- Secure backup file storage
- API endpoint authentication
- Data export access control
- Audit trail for data operations

## Migration from Current System

### Compatibility Plan
1. **Phase 1**: Implement new system alongside existing archive
2. **Phase 2**: Data migration from archive table to new system
3. **Phase 3**: Remove old archive table and related code
4. **Phase 4**: Update all references to use new system

### Rollback Strategy
- Keep existing archive system during initial deployment
- Parallel operation mode for safety
- Quick rollback procedure documented
- Data integrity verification at each step

## Success Metrics

### Performance Targets
- Export generation: < 30 seconds for 10,000 sessions
- Monthly backup: < 5 minutes for full month data
- UI responsiveness: < 2 seconds for all operations
- Database cleanup: < 10 seconds for daily operations

### User Experience Goals
- Single-click date range exports
- Clear backup file management
- Automatic background operations
- Reliable notification system

## Maintenance and Support

### Regular Maintenance Tasks
- Monthly backup verification
- Quarterly system performance review
- Annual retention policy review
- Backup storage cleanup (keep last 24 months)

### Documentation Requirements
- Admin user guide for data management
- Technical documentation for maintenance
- Troubleshooting guide for common issues
- API documentation for integrations

---

**Implementation Lead**: Follow this plan systematically, ensuring each phase is completed before proceeding to the next. All implementations must adhere to @CLAUDE.md principles of no hardcoding, DRY approach, and centralized architecture.