/**
 * Chat Widget Debug Script
 * Paste this in browser console (F12) to diagnose chat widget issues
 */

(async function debugChatWidget() {
  console.log('='.repeat(60));
  console.log('🔍 CHAT WIDGET DEBUG SCRIPT');
  console.log('='.repeat(60));

  // 1. Check if running in production mode
  console.log('\n1️⃣ Environment Check:');
  console.log('   NODE_ENV:', process?.env?.NODE_ENV || 'unknown');
  console.log('   Production Mode:', typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production');

  // 2. Fetch public chat config
  console.log('\n2️⃣ Fetching Chat Configuration...');
  try {
    const response = await fetch('/api/chat-config/public');
    const config = await response.json();
    console.log('   Status:', response.status, response.statusText);
    console.log('   Config:', JSON.stringify(config, null, 2));

    // Analyze config
    console.log('\n3️⃣ Configuration Analysis:');
    console.log('   ✓ Is Enabled:', config.isEnabled);
    console.log('   ✓ Has Webhook URL:', !!config.webhookUrl);
    console.log('   ✓ Webhook URL:', config.webhookUrl || '(empty)');
    console.log('   ✓ Position:', config.position);
    console.log('   ✓ Primary Color:', config.primaryColor);

    // Check rendering conditions
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

  // 5. Check DOM for chat widget elements
  console.log('\n5️⃣ DOM Element Check:');
  const chatBubble = document.querySelector('[data-testid="chat-bubble"]');
  const chatContainer = document.querySelector('.n8n-chat-container');

  console.log('   Chat Bubble Element:', chatBubble ? '✅ Found' : '❌ Not found');
  console.log('   Chat Container:', chatContainer ? '✅ Found' : '❌ Not found');

  // 6. Check if @n8n/chat library is loaded
  console.log('\n6️⃣ Library Check:');
  console.log('   @n8n/chat loaded:', typeof window !== 'undefined' && typeof window.createChat === 'function' ? '✅ Yes' : '❌ No');

  // 7. Check for console errors
  console.log('\n7️⃣ Check Browser Console:');
  console.log('   Look above for any errors related to:');
  console.log('   - @n8n/chat');
  console.log('   - N8nChatWidget');
  console.log('   - chat-config');

  // 8. Test admin API (requires auth)
  console.log('\n8️⃣ Admin API Test (requires authentication):');
  try {
    const adminResponse = await fetch('/api/admin/chat-config');
    console.log('   Status:', adminResponse.status, adminResponse.statusText);

    if (adminResponse.ok) {
      const adminConfig = await adminResponse.json();
      console.log('   Admin Config:', JSON.stringify(adminConfig, null, 2));
    } else if (adminResponse.status === 401) {
      console.log('   ⚠️  Not authenticated as admin (this is normal for public users)');
    }
  } catch (error) {
    console.error('   ❌ Error fetching admin config:', error);
  }

  // 9. Database direct check (for debugging)
  console.log('\n9️⃣ Direct Database Config Keys:');
  console.log('   Run this SQL in your database to check:');
  console.log('   SELECT key, value FROM system_config WHERE key LIKE \'n8n_chat%\';');

  console.log('\n' + '='.repeat(60));
  console.log('DEBUG COMPLETE');
  console.log('='.repeat(60));
  console.log('\nIf you still don\'t see the chat bubble:');
  console.log('1. Make sure webhook URL is configured in admin panel');
  console.log('2. Make sure "Enable chat widget" is checked');
  console.log('3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
  console.log('4. Check Network tab for /api/chat-config/public request');
})();
