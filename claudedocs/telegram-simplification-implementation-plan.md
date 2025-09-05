# Telegram Notification System Simplification Plan
## Following @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH | CENTRALIZED

### **SYSTEMATIC IMPLEMENTATION APPROACH**

## **Phase 1: Database Schema Design**

### **CENTRALIZED CONFIGURATION - Single Source of Truth**
```sql
-- AdminTelegramConfig table - SINGLE SOURCE OF TRUTH
CREATE TABLE admin_telegram_config (
  id SERIAL PRIMARY KEY,
  bot_token VARCHAR(255) NOT NULL,
  orders_chat_id VARCHAR(255) NOT NULL,
  inventory_chat_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255) NOT NULL, -- Admin user ID
  updated_by VARCHAR(255) NOT NULL, -- Admin user ID  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure only one active config (SINGLE SOURCE OF TRUTH)
  CONSTRAINT unique_active_config UNIQUE (is_active) WHERE is_active = true
);
```

### **Migration Strategy - NO HARDCODE**
- Migrate existing .env values to database
- Maintain .env as fallback during transition
- Remove hardcoded values throughout system

## **Phase 2: Service Layer Refactoring**

### **CENTRALIZED TelegramService - DRY Principle**

**Current Issues to Resolve:**
- Multi-user complexity (violates SINGLE SOURCE)
- Multiple configuration sources (violates CENTRALIZED)
- Hardcoded fallback logic (violates NO HARDCODE)

**Simplified Architecture:**
```typescript
// SINGLE SOURCE OF TRUTH: One service, one config source
class TelegramService {
  // CENTRALIZED: Single configuration loader
  private async loadConfiguration(): Promise<AdminTelegramConfig>
  
  // DRY: Reusable notification methods
  public async sendOrderNotification(data: OrderNotificationData)
  public async sendInventoryAlert(data: InventoryAlertData)
  
  // NO HARDCODE: Configuration-driven behavior
  public async isConfigured(): boolean
}
```

## **Phase 3: API Layer Simplification**

### **CENTRALIZED Admin Configuration API**
```typescript
// /api/admin/telegram/config - SINGLE ENDPOINT for all config
// GET: Retrieve current configuration
// POST: Update configuration (admin-only)
// PUT: Test configuration before saving
```

### **Remove Multi-User Complexity**
- Delete user-specific telegram APIs
- Consolidate into admin-only endpoints
- Maintain DRY principle in API design

## **Phase 4: UI Component Refactoring**

### **SINGLE SOURCE UI Components**
```typescript
// SimpleTelegramAdminConfig.tsx - CENTRALIZED configuration
interface AdminTelegramConfigProps {
  config: AdminTelegramConfig | null;
  onUpdate: (config: AdminTelegramConfig) => Promise<void>;
  onTest: (config: AdminTelegramConfig) => Promise<boolean>;
}
```

### **Remove Redundant Components**
- Delete setup wizard (complex, violates SINGLE SOURCE)
- Delete multi-user components (violates CENTRALIZED)
- Keep only essential admin configuration

## **Phase 5: Systematic File Cleanup**

### **Files to Remove (Violate @CLAUDE.md Principles)**
```
src/app/admin/notifications/setup/ - Complex wizard
src/app/admin/notifications/multi-tenant/ - Multi-user complexity
src/app/user/notifications/telegram/ - User-specific configs
src/components/telegram/setup-wizard/ - Complex setup flow
src/lib/services/telegram-service-factory.ts - Factory complexity
```

### **Files to Refactor (Apply @CLAUDE.md)**
```
src/lib/telegram/telegram-service.ts - Simplify, remove multi-user
src/app/admin/notifications/configuration/page.tsx - Simplify UI
src/app/admin/notifications/page.tsx - Remove complexity
```

## **Phase 6: Data Migration & Testing**

### **Migration Script - NO HARDCODE**
```typescript
// migrate-telegram-config.ts
// Systematic migration from .env to database
// Preserve existing functionality
// Remove hardcoded assumptions
```

## **IMPLEMENTATION SEQUENCE**

### **Step 1: Database & Schema**
1. Create AdminTelegramConfig table
2. Add Prisma schema definition
3. Generate migration
4. Run migration

### **Step 2: Service Layer**
1. Refactor TelegramService (remove multi-user)
2. Implement SINGLE SOURCE configuration loading
3. Apply DRY principle to notification methods
4. Remove hardcoded fallback complexity

### **Step 3: API Layer**
1. Create simplified admin config API
2. Remove user-specific APIs
3. Apply CENTRALIZED approach to endpoints

### **Step 4: UI Layer**
1. Create simple admin configuration component
2. Update main notifications page
3. Remove complex wizard components

### **Step 5: Cleanup & Migration**
1. Delete unnecessary files
2. Run data migration
3. Test end-to-end functionality
4. Update navigation and routing

## **SUCCESS CRITERIA**

### **@CLAUDE.md Compliance**
✅ **NO HARDCODE**: All configuration from database/admin UI
✅ **DRY**: Single telegram service, reusable methods
✅ **SINGLE SOURCE OF TRUTH**: One admin config table
✅ **CENTRALIZED**: All telegram logic in one service

### **Functional Requirements**
✅ Admin can configure bot token via UI
✅ Admin can configure orders/inventory chat IDs
✅ Same rich notification formatting
✅ Test functionality works
✅ Fallback to .env during transition
✅ Existing notifications continue working

## **RISK MITIGATION**

### **Backward Compatibility**
- Keep .env fallback during transition
- Migrate existing working configuration
- Test all notification types before deployment

### **Quality Assurance**
- Test order notifications end-to-end
- Test inventory notifications
- Test daily summary functionality
- Verify admin-only access controls

---

*Following @CLAUDE.md: Systematic | NO HARDCODE | DRY | SINGLE SOURCE | CENTRALIZED*