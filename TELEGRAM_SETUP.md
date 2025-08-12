# Telegram Notification System - Always Running Setup

## Overview
The Telegram notification system is now configured to be **always connected and running** when the server starts. This ensures reliable delivery of order notifications, low stock alerts, and daily summaries.

## Auto-Initialization Features

### 1. Server Instrumentation (Primary)
- **File**: `src/instrumentation.ts`
- **Trigger**: Runs once when Next.js server starts
- **Features**:
  - Initializes Telegram service immediately
  - Starts health monitoring (every 5 minutes)
  - Initializes cron jobs for daily summaries
  - Registers graceful shutdown handlers

### 2. Client-Side Health Monitoring (Backup)
- **Component**: `src/components/system/TelegramHealthCheck.tsx`
- **Location**: Added to main layout (`src/app/layout.tsx`)
- **Features**:
  - Calls health check endpoint on page load
  - Periodic health checks (every 5 minutes)
  - Ensures service stays alive

### 3. Health Check API
- **Endpoint**: `/api/health/telegram`
- **Purpose**: Monitor and restart services if needed
- **Response**: Service status, configuration, and health metrics

## Monitoring & Health Checks

### Real-time Health Status
The system performs automatic health checks every 5 minutes:

```bash
curl http://localhost:3000/api/health/telegram
```

**Healthy Response:**
```json
{
  "status": "ok",
  "telegram": {
    "configured": true,
    "healthy": true,
    "lastHealthCheck": "2025-08-12T05:17:42.584Z",
    "queuedMessages": 0,
    "channels": {
      "orders": true,
      "inventory": true
    }
  },
  "message": "Telegram service is running"
}
```

### Automatic Features

1. **Message Retry Queue**
   - Failed messages are automatically queued
   - Up to 3 retry attempts per message
   - Processes retry queue when connection recovers

2. **Cron Jobs**
   - Daily summary at 00:00 Malaysian time
   - Automatic initialization on server start
   - Low stock monitoring (integrated)

3. **Connection Recovery**
   - Automatic reconnection attempts
   - Health status monitoring
   - Optimistic startup (assumes healthy if configured)

## Configuration

The system loads configuration from:
1. **Database** (SystemConfig table) - Primary
2. **Environment variables** - Fallback

Required configurations:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ORDERS_CHAT_ID`
- `TELEGRAM_INVENTORY_CHAT_ID` (optional)

## Troubleshooting

### Check Service Status
```bash
# Basic health check
curl http://localhost:3000/api/health/telegram

# Look for startup logs
npm run dev
# Should show:
# ✅ Telegram service initialized
# 📅 Daily summary cron job started
```

### Common Issues

1. **Service Not Starting**
   - Check bot token and chat IDs in admin settings
   - Verify instrumentation logs in terminal

2. **Missing Notifications**
   - Check health endpoint for `healthy: false`
   - Verify `queuedMessages` count
   - Test connection in admin panel

3. **Cron Jobs Not Running**
   - Check timezone setting (Asia/Kuala_Lumpur)
   - Verify service initialization logs

## Technical Implementation

### Files Modified
- `next.config.mjs` - Enable instrumentation hook
- `src/instrumentation.ts` - Server startup initialization
- `src/lib/telegram/telegram-service.ts` - Enhanced singleton pattern
- `src/app/layout.tsx` - Added health check component
- `src/components/system/TelegramHealthCheck.tsx` - Client monitoring
- `src/app/api/health/telegram/route.ts` - Health check endpoint
- `src/lib/server/init.ts` - Server initialization utilities
- `src/types/global.d.ts` - TypeScript declarations

### Startup Sequence
1. Next.js starts → `instrumentation.ts` runs
2. TelegramService singleton created
3. Configuration loaded from database/environment
4. Health monitoring starts (5-minute intervals)
5. Cron jobs initialized
6. Client-side health check begins monitoring
7. Service remains active throughout server lifetime

## Benefits

✅ **Always Connected**: Service starts with server  
✅ **Auto-Recovery**: Automatic reconnection and retry logic  
✅ **Health Monitoring**: Real-time status and diagnostics  
✅ **Reliable Delivery**: Message queue prevents notification loss  
✅ **Scheduled Tasks**: Daily summaries run automatically  
✅ **Zero Configuration**: Works out of the box when properly configured  

The Telegram notification system is now **enterprise-ready** with automatic initialization, health monitoring, and reliable message delivery.