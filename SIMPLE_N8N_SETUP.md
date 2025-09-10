# 🔧 Simple n8n Setup Guide (Manual Configuration)

## 🎯 **Alternative Setup Method**

If the Config Variables node doesn't show the values, use this **manual method**:

---

## **Method 1: Direct Node Configuration (Recommended)**

### **Step 1: Import Base Workflow**
1. Import the `n8n-chat-workflow.json` file
2. Don't worry if the Config Variables node is empty

### **Step 2: Configure HTTP Request Node Directly**
1. Click on **"Send Response to Chat App"** node (HTTP Request node)
2. Update these fields:

#### **URL Field:**
```
http://localhost:3000/api/chat/webhook
```

#### **Headers Section:**
Click **"Add Header"** and add these 2 headers:

**Header 1:**
- **Name**: `x-webhook-signature`
- **Value**: `={{ $crypto.createHmac('sha256', 'YOUR_WEBHOOK_SECRET_HERE').update(JSON.stringify($json)).digest('hex') }}`

**Header 2:**
- **Name**: `x-api-key`
- **Value**: `YOUR_API_KEY_HERE`

### **Step 3: Replace Placeholders**
Replace these placeholders with your actual values:

1. **YOUR_WEBHOOK_SECRET_HERE** → Your generated webhook secret from admin config
2. **YOUR_API_KEY_HERE** → Your generated API key from admin config

### **Step 4: Set Webhook Authentication**
1. Click **"Chat Webhook"** node (first node)
2. Authentication: **Header Auth**
3. Name: `x-api-key`
4. Value: Your generated API key (same as above)

---

## **Method 2: Environment Variables (Advanced)**

If you prefer environment variables:

### **Step 1: Add Environment Variables in n8n**
1. Go to n8n **Settings** → **Environment Variables**
2. Add these variables:

```
CHAT_WEBHOOK_SECRET = your-webhook-secret-here
CHAT_API_KEY = your-api-key-here
CHAT_APP_WEBHOOK_URL = http://localhost:3000/api/chat/webhook
```

### **Step 2: Update HTTP Request Node**
Use these expressions in the HTTP Request node:

**URL:**
```
={{ $env.CHAT_APP_WEBHOOK_URL }}
```

**Headers:**
```
x-webhook-signature: ={{ $crypto.createHmac('sha256', $env.CHAT_WEBHOOK_SECRET).update(JSON.stringify($json)).digest('hex') }}
x-api-key: ={{ $env.CHAT_API_KEY }}
```

---

## **Example Configuration**

### **Complete HTTP Request Node Setup:**

**URL:**
```
http://localhost:3000/api/chat/webhook
```

**Headers:**
```json
{
  "x-webhook-signature": "={{ $crypto.createHmac('sha256', 'a1b2c3d4e5f678901234567890abcdef').update(JSON.stringify($json)).digest('hex') }}",
  "x-api-key": "f7e8d9c0a1b2c3d4e5f678901234567890abcdef",
  "Content-Type": "application/json"
}
```

*Replace the long strings with your actual values from the admin config page.*

---

## **Testing Your Setup**

### **Step 1: Get Your Values**
1. Go to `http://localhost:3000/admin/chat/config`
2. Generate and copy:
   - **Webhook Secret** (long string)
   - **API Key** (long string)

### **Step 2: Test Connection**
1. Update the HTTP Request node with your values
2. Activate the workflow in n8n
3. Go back to admin config and click **"Test Connection"**
4. Should see: ✅ "Webhook is responding correctly"

### **Step 3: Send Test Message**
```bash
# Create session
curl -X POST http://localhost:3000/api/chat/session \
  -H "Content-Type: application/json" \
  -d '{"guestEmail": "test@example.com"}'

# Send message (replace SESSION_ID)
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "content": "Hello",
    "messageType": "text"
  }'
```

---

## **Common Issues & Solutions**

### **Issue: "Config Variables node is empty"**
**Solution:** Use Method 1 (Direct Configuration) - manually configure the HTTP Request node

### **Issue: "Webhook signature invalid"**
**Solution:** 
1. Verify webhook secret matches exactly between admin config and n8n
2. Check for extra spaces or characters
3. Regenerate both webhook secret and API key

### **Issue: "Authentication failed"**  
**Solution:**
1. Verify API key matches exactly
2. Check Header Auth is configured with correct API key
3. Make sure header name is exactly `x-api-key` (lowercase)

### **Issue: "Connection timeout"**
**Solution:**
1. Verify your app is running on `http://localhost:3000`
2. Check the webhook URL is correct
3. Try the Test Connection button in admin config

---

## **Quick Setup Checklist**

- [ ] Import workflow to n8n
- [ ] Generate webhook secret and API key in admin config
- [ ] Configure HTTP Request node with your values
- [ ] Set Header Auth on webhook trigger
- [ ] Activate workflow
- [ ] Test connection from admin panel
- [ ] Send test message
- [ ] Verify response in n8n executions

This manual method is **more reliable** and works with all n8n versions! 🎯