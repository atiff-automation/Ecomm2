# Simple n8n Chat Test Workflow

This is the absolute simplest workflow to test if n8n chat is working with your app.

## Create New Workflow in n8n

1. Go to: https://general-n8n.l30n8p.easypanel.host/
2. Click **"+ Add workflow"**
3. Name it: "Simple Chat Test"

## Add Only 2 Nodes

### Node 1: Chat Trigger
1. Click **"+"** → Search for **"Chat Trigger"**
2. Configure:
   - **Mode**: `window`
   - **Initial Messages**:
     ```
     Hello! 👋
     This is a simple test. Type anything and I'll echo it back.
     ```
3. Click **Save**

### Node 2: Respond to Chat
1. Click **"+"** after Chat Trigger
2. Search for **"Respond to Chat"** (or just use the Chat Trigger's built-in response)
3. Configure:
   - **Message**: `You said: {{ $json.chatInput }}`
4. Connect it back to Chat Trigger
5. Click **Save**

## Even Simpler: Just Chat Trigger + Set Node

Actually, you can make it even simpler:

### Node 1: Chat Trigger
- **Mode**: `window`
- **Initial Messages**: `Hello! 👋 I'm a simple echo bot.`

### Node 2: Set Node
1. Add **Set** node after Chat Trigger
2. Set these values:
   - **Name**: `output`
   - **Value**: `Echo: {{ $json.chatInput }}`

That's it! The Set node output automatically returns to the chat.

## Activate Workflow

1. Click **Save** (top right)
2. Toggle **Active** to ON
3. Copy the webhook URL (should be something like):
   ```
   https://general-n8n.l30n8p.easypanel.host/webhook/SOME-UUID/chat
   ```

## Update Your App Config

### Option 1: Use Seed Script
Edit `scripts/seed-chat-config-production.ts` and update line 13:
```typescript
const webhookUrl = 'YOUR-NEW-WEBHOOK-URL-HERE';
```

Then run:
```bash
npx tsx scripts/seed-chat-config-production.ts
```

### Option 2: Use Admin API
1. Go to: https://ecomm2-production.up.railway.app/admin/settings
2. Update the n8n Webhook URL to your new test workflow URL
3. Click Save

### Option 3: Quick Database Update (if you have access)
Open Prisma Studio:
```bash
npx prisma studio
```

Find `SystemConfig` table → Find record with key `n8n_chat_webhook_url` → Update the value to your new webhook URL

## Test

1. Go to: https://ecomm2-production.up.railway.app/
2. Click the chat bubble
3. You should see: "Hello! 👋 I'm a simple echo bot."
4. Type anything
5. It should echo back: "Echo: [your message]"

## Visual Workflow Structure

```
┌─────────────────┐
│  Chat Trigger   │
│  (window mode)  │
│  Initial Msg ✓  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Set Node      │
│ output = Echo:  │
│  + chat input   │
└────────┬────────┘
         │
         ▼
    (Auto return to chat)
```

## If It Works

✅ Chat bubble appears
✅ Initial message shows
✅ Your messages are echoed back

**Then n8n connection is working!** You can then add your OpenAI Agent node.

## If It Doesn't Work

Check browser console (F12):
```javascript
// Run this in console
fetch('/api/chat-config/public').then(r => r.json()).then(console.log)
```

Should show:
```json
{
  "webhookUrl": "your-new-webhook-url",
  "isEnabled": true,
  ...
}
```

If webhook URL is wrong, update it using one of the 3 options above.
