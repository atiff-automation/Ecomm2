# Complete Chat System Setup Guide

## 🎯 Overview
This guide will walk you through setting up your chat system with n8n integration step by step. No technical knowledge required.

---

## 📋 Pre-Requirements
- ✅ Your e-commerce website is running (localhost:3000)
- ✅ n8n Cloud account: https://atiffautomate93.app.n8n.cloud
- ✅ Admin access to your website

---

## 🚀 **STEP 1: Configure Your Chat System**

### 1.1 Access Admin Panel
1. Open your browser and go to: `http://localhost:3000/admin/chat/config`
2. Login with your admin credentials

### 1.2 Generate Security Keys
1. **Generate Webhook Secret**:
   - Click the "Generate" button next to "Webhook Secret"
   - Copy the generated value (you'll need it for n8n)

2. **Generate API Key**:
   - Click the "Generate" button next to "API Key"  
   - Copy the generated value (you'll need it for n8n)

3. **Set Webhook URL**:
   - Enter: `https://atiffautomate93.app.n8n.cloud/webhook-test/chat`

### 1.3 Save Configuration
1. Click "Save Configuration"
2. You should see a success message
3. **IMPORTANT**: Keep the Webhook Secret and API Key handy for Step 2

---

## 🔧 **STEP 2: Setup n8n Workflow**

### 2.1 Import Workflow to n8n
1. Go to your n8n Cloud: https://atiffautomate93.app.n8n.cloud
2. Click "Workflows" in the sidebar
3. Click "Import from File" 
4. Upload the `n8n-chat-workflow.json` file
5. The workflow will be imported with 6 nodes

### 2.2 Configure Workflow Variables
1. Open the imported workflow in n8n
2. Click on the **"📋 Config Variables"** node (second node)
3. Update these 3 values:

| Field Name | Update With | Example |
|------------|-------------|---------|
| `webhook_secret` | Your generated webhook secret | `a1b2c3d4e5f6789012345...` |
| `api_key` | Your generated API key | `f7e8d9c0a1b2c3d4e5f6...` |
| `app_webhook_url` | Your app's webhook URL | `http://localhost:3000/api/chat/webhook` |

4. **Save the node** by clicking the checkmark

### 2.3 Configure Webhook Authentication
1. Open the imported workflow
2. Click on the **"Chat Webhook"** node (first node)
3. In the settings, find **"Authentication"**
4. Select **"Header Auth"**
5. Create new credential:
   - **Name**: `x-api-key`
   - **Value**: Your generated API key (same as `CHAT_API_KEY`)
6. Save the credential

### 2.4 Update Webhook URL (if needed)
1. In the **"Send Response to Chat App"** node
2. Update the URL if your domain is not localhost:
   - Development: `http://localhost:3000/api/chat/webhook`
   - Production: `https://yourdomain.com/api/chat/webhook`

### 2.5 Activate Workflow
1. Click the toggle switch to **activate** the workflow
2. You should see it marked as "Active"

---

## 🧪 **STEP 3: Test the Integration**

### 3.1 Test from Admin Panel
1. Go back to: `http://localhost:3000/admin/chat/config`
2. Click **"Test Connection"** button
3. You should see: ✅ "Webhook is responding correctly"

### 3.2 Test with Sample Messages
Open your terminal and test with these commands:

```bash
# Test 1: Create a chat session
curl -X POST http://localhost:3000/api/chat/session \
  -H "Content-Type: application/json" \
  -d '{"guestEmail": "test@example.com"}'
```

Copy the `sessionId` from the response, then:

```bash
# Test 2: Send a message (replace SESSION_ID with actual ID)
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "content": "Hello, I need help with my order",
    "messageType": "text"
  }'
```

### 3.3 Check n8n Execution
1. In n8n, go to **"Executions"** tab
2. You should see successful executions
3. Click on an execution to see the data flow

---

## 🎨 **STEP 4: Add Chat Widget to Your Website**

### 4.1 Choose Integration Method
You have several options:

**Option A: Simple Test Page**
- Go to: `http://localhost:3000/test-chat`
- This gives you a basic chat interface for testing

**Option B: Add to Existing Pages**
- Add the chat widget component to your product pages
- Add the chat widget component to your checkout pages

### 4.2 Frontend Integration (Optional)
If you want to add chat to specific pages:

1. Import the chat components in your React pages:
```jsx
import { ChatWidget } from '@/components/chat/ChatWidget';

// Add to your page component
<ChatWidget />
```

---

## 🔍 **STEP 5: Verify Everything Works**

### 5.1 Complete Flow Test
1. **Open your website** in a browser
2. **Start a chat** (either test page or widget)
3. **Send a message**: "Hello, I need help"
4. **Check n8n executions**: Should see the workflow run
5. **Wait for response**: Should receive bot response
6. **Verify in database**: Check chat messages in Prisma Studio

### 5.2 Check Prisma Studio
1. Go to: `http://localhost:5566` (Prisma Studio)
2. Check tables:
   - `chat_sessions`: Should have your test session
   - `chat_messages`: Should have user message and bot response
   - `chat_webhook_queue`: Should show successful webhook deliveries

---

## 🚨 **Troubleshooting**

### Problem: "Test Connection" fails
**Solution:**
1. Check n8n workflow is activated
2. Verify environment variables in n8n are correct
3. Check webhook URL is correct
4. Verify API key authentication is set up

### Problem: Messages not getting responses
**Solution:**
1. Check n8n executions for errors
2. Verify webhook signature is correct
3. Check environment variables match your config
4. Review n8n logs for processing errors

### Problem: Authentication errors
**Solution:**
1. Regenerate API key and webhook secret
2. Update both your admin config AND n8n environment variables
3. Make sure header authentication is set up with correct API key

---

## 🎉 **Success Checklist**

- [ ] Admin config page shows all green statuses
- [ ] Test connection succeeds
- [ ] n8n workflow is active and receiving webhooks
- [ ] Sample message gets a response
- [ ] Database shows chat sessions and messages
- [ ] Chat widget displays on your website

---

## 📞 **Support**

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check n8n execution logs
3. Check your server logs
4. Verify all environment variables are correctly set

Your chat system is now ready for production! 🚀

---

## 🔧 **Production Deployment Notes**

When deploying to production:
1. Update `CHAT_APP_WEBHOOK_URL` to your production domain
2. Update webhook URL in admin config to production URL
3. Ensure your production server can receive webhooks from n8n
4. Test the complete flow in production environment