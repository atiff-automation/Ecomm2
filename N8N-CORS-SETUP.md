# n8n CORS Configuration - REQUIRED

According to the official @n8n/chat documentation, you **MUST** configure CORS in your Chat Trigger node.

## Why CORS is Required

The browser blocks requests from your website (https://ecomm2-production.up.railway.app) to n8n (https://general-n8n.l30n8p.easypanel.host) unless n8n explicitly allows it.

This is a browser security feature - n8n needs to tell the browser "yes, I accept requests from this website."

## How to Fix

### Step 1: Open Your n8n Workflow

1. Go to: https://general-n8n.l30n8p.easypanel.host/
2. Open your chat workflow (the one with the Chat Trigger node)

### Step 2: Configure Chat Trigger Node

1. Click on the **Chat Trigger** node
2. Look for the field: **"Allowed Origins (CORS)"**
3. Add your domain:
   ```
   https://ecomm2-production.up.railway.app
   ```

4. **Important**: Also add localhost for testing:
   ```
   https://ecomm2-production.up.railway.app
   http://localhost:3000
   ```

### Step 3: Other Chat Trigger Settings

While you're there, make sure these are configured:

- **Mode**: Should be `window` (NOT `webhook`)
- **Public Chat**: Enable this (allows embedding on your website)
- **Chat Session Key**: `sessionId` (default)
- **Chat Input Key**: `chatInput` (default)

### Step 4: Save and Activate

1. Click **Save** on the Chat Trigger node
2. Click **Save** on the workflow (top right)
3. Make sure the workflow is **Active** (toggle should be green)

## What This Does

When you add your domain to "Allowed Origins", n8n will:
1. Accept requests from your website
2. Send back CORS headers that tell the browser "this is allowed"
3. The chat widget will work properly

## Testing After CORS Setup

Once CORS is configured:

1. Go to: https://ecomm2-production.up.railway.app/
2. Open browser console (F12)
3. You should see n8n chat bubble appear
4. Click it to open
5. Type a message
6. You should get a response from n8n

## If It Still Doesn't Work

Check browser console for errors:

**CORS Error Example:**
```
Access to fetch at 'https://general-n8n.l30n8p.easypanel.host/webhook/...'
from origin 'https://ecomm2-production.up.railway.app' has been blocked by CORS policy
```

**If you see this:** CORS is not configured correctly in n8n.

**No Error, but no response:** The workflow might not be active or there's an issue with the workflow logic.

## Summary

✅ **Required**: Add your domain to "Allowed Origins (CORS)" in Chat Trigger node
✅ **Required**: Workflow must be Active
✅ **Recommended**: Add both production and localhost URLs for testing

This is **not optional** - without CORS configuration, the browser will block all requests to n8n!
