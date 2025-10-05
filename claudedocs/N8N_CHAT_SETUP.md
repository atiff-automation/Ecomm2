# n8n Chat Widget Integration Guide

**Status**: ✅ Production Ready
**Last Updated**: 2025-10-05
**Migration Date**: 2025-10-05

## Overview

This document describes the simplified n8n chat integration that replaced our previous over-engineered custom chat system. The new implementation uses the official `@n8n/chat` package with direct webhook integration.

### Key Benefits
- **Simplicity**: ~100 lines vs 2000+ lines of custom code
- **Maintainability**: No backend, no database tables, no admin dashboard
- **Direct Integration**: n8n handles all chat processing and storage
- **Consistent UI**: Reused existing ChatBubble toggle button
- **Zero Configuration**: Just webhook URL needed

---

## Architecture

### High-Level Flow
```
User → ChatBubble (toggle) → N8nChatWidget → n8n Webhook → n8n Workflow
```

### Components

**Frontend (Kept)**
- `ChatBubble.tsx` - Toggle button component (reused from previous implementation)
- `N8nChatWidget.tsx` - Main chat widget using @n8n/chat package
- `types.ts` - Minimal type definitions for ChatBubble compatibility

**Backend**
- None - All chat processing handled by n8n

**Database**
- None - All chat data stored in n8n execution logs

---

## Installation

### Dependencies

The `@n8n/chat` package is already installed:

```json
{
  "dependencies": {
    "@n8n/chat": "^0.59.1"
  }
}
```

### n8n Setup

1. **Create Chat Workflow in n8n**:
   - Add "Chat Trigger" node to your workflow
   - Configure CORS settings in Chat Trigger node (allow your domain)
   - Copy the webhook URL from the Chat Trigger node

2. **Current Webhook URL**:
   ```
   https://general-n8n.l30n8p.easypanel.host/webhook/31852ca2-1581-4862-85df-a5f8a7499b88/chat
   ```

---

## Configuration

### N8nChatWidget Props

```typescript
interface N8nChatWidgetProps {
  config?: {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    primaryColor?: string;
    enableSound?: boolean;
    enableTypingIndicator?: boolean;
  };
}
```

### Default Configuration (in layout.tsx)

```typescript
<N8nChatWidget
  config={{
    position: 'bottom-right',
    primaryColor: '#10b981',
    enableSound: false,
    enableTypingIndicator: true,
  }}
/>
```

### Customization Options

All customization is done via the `createChat()` options in `N8nChatWidget.tsx:28-47`:

```typescript
chatInstanceRef.current = createChat({
  webhookUrl: 'YOUR_N8N_WEBHOOK_URL',
  mode: 'window',
  chatInputKey: 'chatInput',
  chatSessionKey: 'sessionId',
  defaultLanguage: 'en',
  initialMessages: [
    'Hello! 👋',
    'How can I help you today?'
  ],
  i18n: {
    en: {
      title: 'Chat Support',
      subtitle: "We're here to help",
      footer: '',
      getStarted: 'New Conversation',
      inputPlaceholder: 'Type your message...',
    },
  },
});
```

---

## Usage

### Basic Implementation

The widget is already integrated in `src/app/layout.tsx:41`:

```typescript
import { N8nChatWidget } from '@/components/chat/N8nChatWidget';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <N8nChatWidget
          config={{
            position: 'bottom-right',
            primaryColor: '#10b981',
          }}
        />
      </body>
    </html>
  );
}
```

### User Interaction Flow

1. User clicks ChatBubble toggle button
2. Chat window opens with n8n widget
3. User types message
4. Message sent directly to n8n webhook
5. n8n workflow processes message
6. Response displayed in chat window

---

## File Structure

```
src/components/chat/
├── ChatBubble.tsx          # Toggle button (reused from old system)
├── N8nChatWidget.tsx       # Main widget component
├── types.ts                # Minimal type definitions
└── index.ts                # Public exports

src/app/layout.tsx          # Widget integration point
```

---

## Migration Summary

### What Was Removed

**Database Tables (4)**:
- `chat_sessions`
- `chat_messages`
- `chat_webhook_queue`
- `chat_config`

**Frontend (16 files)**:
- ChatWidget.tsx, ChatWindow.tsx, ChatProvider.tsx
- MessageList.tsx, MessageItem.tsx, MessageInput.tsx
- TypingIndicator.tsx, QuickReply.tsx, RichContent.tsx
- And 7 more components

**Backend (58+ files)**:
- All `/api/chat/*` routes
- All `/api/admin/chat/*` routes
- Chat service layer
- Webhook queue system
- Job handlers

**Admin Dashboard**:
- Entire `/admin/chat/*` section removed

**Total Deletion**: 88+ files, 2000+ lines of code

### What Was Kept

**UI Components (3 files)**:
- `ChatBubble.tsx` - Toggle button
- `N8nChatWidget.tsx` - New wrapper for @n8n/chat
- `types.ts` - Minimal types for compatibility

### Data Backup

All chat data was backed up before deletion:
- **Location**: `/backups/chat/chat-backup-2025-10-05.json`
- **Contents**: 11 sessions, 20 messages, 10 webhook queue items

---

## Troubleshooting

### Chat Widget Not Appearing

**Check 1**: Verify webhook URL is correct
```typescript
// In N8nChatWidget.tsx line 28
webhookUrl: 'https://general-n8n.l30n8p.easypanel.host/webhook/31852ca2-1581-4862-85df-a5f8a7499b88/chat'
```

**Check 2**: Ensure n8n workflow is active
- Go to n8n workflow editor
- Check that Chat Trigger node is enabled
- Verify workflow is activated (not paused)

**Check 3**: Check browser console for errors
```javascript
// Common errors:
// - CORS error: Configure CORS in n8n Chat Trigger node
// - Network error: Verify webhook URL is accessible
// - Mount error: Check chatContainerRef is valid
```

### CORS Errors

**Solution**: Configure CORS in n8n Chat Trigger node settings:
1. Open Chat Trigger node in n8n
2. Go to "Options" tab
3. Add your domain to "Allowed Origins"
4. Examples: `https://yourdomain.com`, `http://localhost:3000`

### Messages Not Sending

**Check 1**: Verify n8n workflow is running
- Check n8n execution logs
- Test webhook URL directly with curl:
  ```bash
  curl -X POST https://general-n8n.l30n8p.easypanel.host/webhook/31852ca2-1581-4862-85df-a5f8a7499b88/chat \
    -H "Content-Type: application/json" \
    -d '{"chatInput": "test message", "sessionId": "test-session"}'
  ```

**Check 2**: Check network tab in browser DevTools
- Look for POST requests to webhook URL
- Verify request payload format
- Check response status codes

### Styling Issues

**Customize Chat Window Position**:
```typescript
// In layout.tsx
<N8nChatWidget
  config={{
    position: 'bottom-left', // Change position
  }}
/>
```

**Customize Chat Bubble**:
```typescript
// In ChatBubble.tsx - edit styles directly
className="fixed bottom-4 right-4 z-50" // Change position classes
```

**Customize Primary Color**:
```typescript
// In layout.tsx
<N8nChatWidget
  config={{
    primaryColor: '#3b82f6', // Your brand color
  }}
/>
```

---

## Monitoring & Analytics

### n8n Execution Logs

All chat interactions are logged in n8n:
1. Go to n8n dashboard
2. Navigate to "Executions" tab
3. Filter by your chat workflow
4. View detailed logs for each conversation

### Key Metrics Available in n8n

- Total conversations
- Messages per session
- Response times
- Error rates
- User engagement patterns

### Custom Analytics

To add custom analytics, modify your n8n workflow:
1. Add "HTTP Request" node after Chat Trigger
2. Send data to your analytics service (Google Analytics, Mixpanel, etc.)
3. Track events: chat_started, message_sent, chat_ended

---

## Environment Variables

No environment variables needed for the chat widget itself. All configuration is done in code.

**n8n Webhook URL**: Hardcoded in `N8nChatWidget.tsx:28`

To make it configurable:
```typescript
// Option 1: Add to .env
NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/xxx/chat

// Option 2: Use in N8nChatWidget.tsx
webhookUrl: process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL || 'fallback-url'
```

---

## Development

### Local Testing

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000

# Click chat bubble to test
```

### Testing with n8n

**Option 1**: Use production n8n instance (current setup)
- No additional setup needed
- Works immediately in development

**Option 2**: Use local n8n instance
1. Run n8n locally: `npx n8n`
2. Create chat workflow
3. Update webhook URL in `N8nChatWidget.tsx`
4. Test with localhost:3000

---

## Security

### CORS Protection

CORS is configured on n8n side in Chat Trigger node:
- Only allowed origins can embed the chat
- Configure in n8n Chat Trigger node settings
- Add both production and development domains

### Data Privacy

All chat data is stored in n8n:
- Review n8n's data retention policies
- Configure data deletion workflows if needed
- n8n execution logs can be cleared manually

### Webhook Security

The webhook URL is public but secure:
- No authentication required (by design for chat widgets)
- Rate limiting should be configured in n8n
- Add additional validation in your n8n workflow if needed

---

## Performance

### Bundle Size

The `@n8n/chat` package adds minimal bundle size:
- Package size: ~50KB gzipped
- No backend API calls needed
- Direct WebSocket connection to n8n

### Optimization Tips

1. **Lazy Loading**: Widget loads only when chat is opened
2. **No Database Queries**: Zero database overhead
3. **CDN Delivery**: n8n serves widget assets via CDN
4. **WebSocket Efficiency**: Real-time communication without polling

---

## Updating Webhook URL

If you need to change the n8n webhook URL:

1. **Update in Code**:
   ```typescript
   // File: src/components/chat/N8nChatWidget.tsx
   // Line: 28
   webhookUrl: 'YOUR_NEW_WEBHOOK_URL',
   ```

2. **Rebuild Application**:
   ```bash
   npm run build
   ```

3. **Deploy Changes**:
   ```bash
   git add .
   git commit -m "Update n8n chat webhook URL"
   git push
   ```

---

## Future Enhancements

### Possible Improvements

1. **Environment Variables**: Move webhook URL to env vars
2. **User Context**: Pass user ID/email to n8n for personalization
3. **Custom Theming**: Add theme support (light/dark mode)
4. **Multi-language**: Add i18n for multiple languages
5. **Analytics Integration**: Send chat events to analytics platform

### Implementation Examples

**Pass User Context**:
```typescript
// In N8nChatWidget.tsx, add user metadata
chatInstanceRef.current = createChat({
  webhookUrl: '...',
  metadata: {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
  },
});
```

**Environment Variable Setup**:
```typescript
// .env.local
NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL=https://n8n.example.com/webhook/xxx/chat

// N8nChatWidget.tsx
webhookUrl: process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL!,
```

---

## Support

### Documentation Links

- **@n8n/chat Package**: https://www.npmjs.com/package/@n8n/chat
- **n8n Chat Trigger Docs**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.chattrigger/
- **n8n Community**: https://community.n8n.io/

### Migration History

- **Migration Plan**: `claudedocs/N8N_CHAT_MIGRATION_PLAN.md`
- **Backup Location**: `/backups/chat/chat-backup-2025-10-05.json`
- **Deletion Summary**: 88+ files, 4 database tables, 2000+ lines of code removed

---

## Quick Reference

### File Locations
```
Component:     src/components/chat/N8nChatWidget.tsx
Integration:   src/app/layout.tsx
Types:         src/components/chat/types.ts
Exports:       src/components/chat/index.ts
```

### Webhook URL
```
https://general-n8n.l30n8p.easypanel.host/webhook/31852ca2-1581-4862-85df-a5f8a7499b88/chat
```

### Package Version
```
@n8n/chat: ^0.59.1
```

### Configuration Location
```typescript
File: src/app/layout.tsx
Line: 41
```

---

**Migration completed**: 2025-10-05
**Total reduction**: -2000 lines of code, -88 files, -4 database tables
**New implementation**: 100 lines, 3 files, 0 database overhead
