# Fix n8n Chat Workflow

## Problem
The n8n workflow is failing with `Cannot find module 'crypto'` because:
1. The workflow was designed for WordPress webhook integration (not embedded chat)
2. Uses `require('crypto')` which isn't available in n8n's sandbox
3. Has custom response formatting that's incompatible with the chat widget

## Solution: Reconfigure Workflow in n8n UI

### Step 1: Open Your Workflow
Go to: https://general-n8n.l30n8p.easypanel.host/
Open the "Wordpress Chatbot" workflow

### Step 2: Delete Unnecessary Nodes
Delete these nodes (they're for WordPress webhooks, not embedded chat):
- **"Code in JavaScript1"** (the one causing the crypto error)
- **"Respond to Webhook"** (if present)

### Step 3: Configure Chat Trigger
Click on the **"Chat Trigger"** node:

1. **Mode**: Change from `webhook` to `window` (embedded chat mode)
2. **Initial Messages**: Add this in the "Initial Messages" field:
   ```
   Hello! 👋
   How can I help you today?
   ```
3. Click **Save**

### Step 4: Connect Nodes Properly
The workflow should be simple:
```
Chat Trigger → OpenAI Agent
```

The OpenAI Agent's response automatically flows back to the chat widget - no custom code needed!

### Step 5: Activate Workflow
1. Click **Save** in the top right
2. Make sure the workflow is **Active** (toggle should be ON)
3. The webhook URL should be:
   ```
   https://general-n8n.l30n8p.easypanel.host/webhook/31852ca2-1581-4862-85df-a5f8a7499b88/chat
   ```

### Step 6: Test
1. Go to your site: https://ecomm2-production.up.railway.app/
2. Click the chat bubble
3. The chat should now show the welcome message and respond properly!

## How n8n Embedded Chat Works

**Before (WordPress mode - WRONG for embedded chat):**
```
Chat Trigger (webhook) → OpenAI Agent → Code (crypto) → Respond to Webhook
```

**After (Embedded chat mode - CORRECT):**
```
Chat Trigger (window + initial messages) → OpenAI Agent
```

The Chat Trigger in `window` mode automatically:
- Displays initial messages
- Sends user input to the next node
- Receives the AI response and displays it
- No custom code needed!

## Verification

After fixing, the chat should:
- ✅ Show initial message: "Hello! 👋 How can I help you today?"
- ✅ Accept user input
- ✅ Call OpenAI and return responses
- ✅ Display conversation properly (no blurry container)

## Why This Fixes the Issue

1. **No crypto module**: We removed the Code node entirely
2. **Proper response format**: Chat Trigger handles responses automatically
3. **Initial messages**: Users see a welcome message immediately
4. **Embedded mode**: Works with the @n8n/chat widget on your site

---

If you prefer to keep the WordPress webhook functionality, you'll need **two separate workflows**:
1. One for embedded chat (simple: Chat Trigger → OpenAI Agent)
2. One for WordPress webhooks (complex: with crypto signatures)
