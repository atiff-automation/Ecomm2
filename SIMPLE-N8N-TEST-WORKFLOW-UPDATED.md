# Simple n8n Embedded Chat Test - VERIFIED CONFIGURATION

## The Simplest Working Setup (2 Nodes)

Based on official n8n documentation for the Chat Trigger node in embedded/window mode.

---

## Step 1: Create New Workflow in n8n

1. Go to: https://general-n8n.l30n8p.easypanel.host/
2. Click **"+ Add workflow"**
3. Name it: **"Simple Chat Test"**

---

## Step 2: Add Chat Trigger Node

1. Click **"+"** to add a node
2. Search for **"Chat Trigger"**
3. Click on the Chat Trigger node to configure it:

### Chat Trigger Configuration:
- **Mode**: Select **"Chat Window"** (NOT webhook mode)
- **Public Chat**: Toggle ON (allows embedding on your website)

That's the basic configuration! The Chat Trigger in window mode automatically handles:
- Receiving user messages from the embedded widget
- Sending responses back to the chat widget
- Managing the conversation flow

---

## Step 3: Add a Simple Response Node

For testing, add a basic response using the **Edit Fields (Set)** node:

1. Click **"+"** after the Chat Trigger
2. Search for **"Edit Fields (Set)"**
3. Configure it:
   - **Mode**: Manual Mapping
   - Add a field:
     - **Name**: `output`
     - **Value**: `You said: {{ $json.chatInput }}`

This will echo back whatever the user types.

**Alternative**: You can also connect directly to an **AI Agent** node if you want actual AI responses.

---

## Step 4: Activate the Workflow

1. Click **"Save"** in the top right
2. Toggle the workflow to **Active** (switch should turn green)
3. **Copy the Webhook URL** - it should look like:
   ```
   https://general-n8n.l30n8p.easypanel.host/webhook/YOUR-UUID-HERE/chat
   ```

---

## Step 5: Update Your App Configuration

You need to update the webhook URL in your production database.

### Option A: Run the Seed Script Locally (Recommended)

1. Edit the seed script:
   ```bash
   nano scripts/seed-chat-config-production.ts
   ```

2. Update line 13 with your new webhook URL:
   ```typescript
   const webhookUrl = 'https://general-n8n.l30n8p.easypanel.host/webhook/YOUR-UUID-HERE/chat';
   ```

3. Run the script:
   ```bash
   npx tsx scripts/seed-chat-config-production.ts
   ```

### Option B: Use the Admin Seed API

Send a request to your production admin endpoint:
```bash
curl -X POST https://ecomm2-production.up.railway.app/api/admin/chat-config/seed \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE"
```

(You need to be logged in as admin for this to work)

---

## Step 6: Test the Chat

1. Go to: https://ecomm2-production.up.railway.app/
2. You should see the chat bubble in the bottom-right corner
3. Click the bubble to open the chat
4. Type a message
5. You should see: **"You said: [your message]"**

---

## Troubleshooting

### Chat bubble doesn't appear?

Run this in your browser console (F12):
```javascript
fetch('/api/chat-config/public')
  .then(r => r.json())
  .then(console.log)
```

**Expected output:**
```json
{
  "webhookUrl": "https://general-n8n.l30n8p.easypanel.host/webhook/.../chat",
  "isEnabled": true,
  "position": "bottom-right",
  "primaryColor": "#2563eb"
}
```

If `webhookUrl` is empty or `isEnabled` is false, the config didn't update. Try running the seed script again.

### Chat opens but shows empty/blurry container?

Check the browser Network tab (F12 → Network):
- Look for a request to your n8n webhook URL
- If it returns `{"data":[]}` - your workflow isn't responding correctly
- If it shows a 404 - your webhook URL is wrong
- If it shows CORS errors - n8n needs CORS configuration

### Still not working?

**Check n8n workflow execution:**
1. Go to n8n: https://general-n8n.l30n8p.easypanel.host/
2. Click **"Executions"** in the left sidebar
3. Look for recent executions
4. Click on one to see what happened

If there are no executions, the widget isn't reaching n8n at all.

---

## Next Steps

Once this simple echo test works, you can:

1. **Add AI**: Replace the Set node with an **OpenAI Agent** or **AI Agent** node
2. **Add Tools**: Give the AI access to your database, APIs, etc.
3. **Add Memory**: Configure conversation memory for context retention
4. **Customize**: Adjust the chat widget appearance in your app's admin settings

---

## Visual Workflow Structure

```
┌──────────────────┐
│  Chat Trigger    │
│  (Window Mode)   │
│  Public: ON      │
└────────┬─────────┘
         │
         │ (User sends message)
         │ { chatInput: "Hello" }
         │
         ▼
┌──────────────────┐
│   Edit Fields    │
│   (Set Node)     │
│  output = Echo:  │
│  + chatInput     │
└────────┬─────────┘
         │
         │ (Response automatically
         │  sent back to chat widget)
         ▼
    Chat Widget displays response
```

---

## Important Notes

1. **Chat Trigger Mode**: Must be "Chat Window", NOT "Webhook"
2. **Public Chat**: Must be enabled for embedding on your website
3. **No Custom Code Needed**: The Chat Trigger handles all response formatting automatically
4. **Initial Messages**: Can be configured in the Chat Trigger node's "Initial Messages" option (optional)
5. **Response Format**: Whatever your workflow outputs gets sent back to the chat automatically

---

## Configuration Verified Against

- n8n Documentation: Chat Trigger node (window/embedded mode)
- `@n8n/chat` library integration pattern
- Production n8n instance configuration

This is the officially supported way to embed n8n chat in a website!
