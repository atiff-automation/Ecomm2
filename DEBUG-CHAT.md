# Chat Widget Debug Script

Copy and paste this entire script into your browser console (F12 → Console tab):

```javascript
(async function debugChatWidget() {
  console.log('='.repeat(60));
  console.log('🔍 CHAT WIDGET DEBUG SCRIPT');
  console.log('='.repeat(60));

  console.log('\n1️⃣ Environment Check:');
  console.log('   Current URL:', window.location.href);

  console.log('\n2️⃣ Fetching Chat Configuration...');
  try {
    const response = await fetch('/api/chat-config/public');
    const config = await response.json();
    console.log('   Status:', response.status, response.statusText);
    console.log('   Config:', JSON.stringify(config, null, 2));

    console.log('\n3️⃣ Configuration Analysis:');
    console.log('   ✓ Is Enabled:', config.isEnabled);
    console.log('   ✓ Has Webhook URL:', !!config.webhookUrl);
    console.log('   ✓ Webhook URL:', config.webhookUrl || '(empty)');
    console.log('   ✓ Position:', config.position);
    console.log('   ✓ Primary Color:', config.primaryColor);

    console.log('\n4️⃣ Rendering Conditions:');
    const canRender = config.isEnabled && !!config.webhookUrl;
    console.log('   Can Render:', canRender);

    if (!canRender) {
      console.log('   ❌ WIDGET WILL NOT RENDER:');
      if (!config.isEnabled) {
        console.log('      - Chat is disabled in admin settings');
      }
      if (!config.webhookUrl) {
        console.log('      - Webhook URL is not configured');
      }
    } else {
      console.log('   ✅ Widget should render!');
    }

  } catch (error) {
    console.error('   ❌ Error fetching config:', error);
  }

  console.log('\n5️⃣ DOM Element Check:');
  const chatBubble = document.querySelector('[data-testid="chat-bubble"]');
  const chatContainer = document.querySelector('.n8n-chat-container');
  console.log('   Chat Bubble Element:', chatBubble ? '✅ Found' : '❌ Not found');
  console.log('   Chat Container:', chatContainer ? '✅ Found' : '❌ Not found');

  console.log('\n6️⃣ Library Check:');
  console.log('   @n8n/chat loaded:', typeof window.createChat === 'function' ? '✅ Yes' : '❌ No');

  console.log('\n7️⃣ Admin API Test:');
  try {
    const adminResponse = await fetch('/api/admin/chat-config');
    console.log('   Status:', adminResponse.status, adminResponse.statusText);
    if (adminResponse.ok) {
      const adminConfig = await adminResponse.json();
      console.log('   Admin Config:', JSON.stringify(adminConfig, null, 2));
    } else if (adminResponse.status === 401) {
      console.log('   ⚠️  Not authenticated as admin');
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('DEBUG COMPLETE');
  console.log('='.repeat(60));
})();
```

## Instructions:

1. Go to: https://ecomm2-production.up.railway.app/
2. Press **F12** (or Right-click → Inspect)
3. Click **Console** tab
4. Copy the code above (starting from `(async function` to the last `();`)
5. Paste into console and press **Enter**
6. Share the output here

The output will show exactly why the chat bubble is not appearing!
