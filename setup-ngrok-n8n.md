# ngrok Setup for n8n Integration

## Install ngrok
```bash
# Install ngrok (if not installed)
brew install ngrok/ngrok/ngrok

# Or download from https://ngrok.com/download
```

## Setup Steps

### 1. Start your development server
```bash
npm run dev
# Server running on http://localhost:3000
```

### 2. Expose localhost with ngrok
```bash
# In a new terminal
ngrok http 3000

# You'll get output like:
# Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### 3. Configure your system
1. Go to admin panel: `/admin/chat/config`
2. Set webhook URL to: `https://abc123.ngrok.io/api/chat/webhook`
3. Generate webhook secret and API key
4. Save configuration

### 4. Configure n8n workflow
- Import the workflow JSON
- The webhook will now receive requests from your ngrok URL
- n8n can send responses back to `https://abc123.ngrok.io/api/chat/webhook`

## Test with ngrok
```bash
# Update the test script URL
node test-n8n-integration.js
# Change BASE_URL to your ngrok URL: https://abc123.ngrok.io
```

## Important Notes
- ⚠️ ngrok URLs change when restarted (unless you have a paid plan)
- ⚠️ Update the webhook URL in admin panel when ngrok restarts
- ✅ Perfect for development and testing
- ✅ Works with n8n Cloud, self-hosted n8n, and other webhook services