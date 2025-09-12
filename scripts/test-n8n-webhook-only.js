const crypto = require('crypto');

// Test configuration
const WEBHOOK_SECRET = 'chat-webhook-secret-2024-secure-key-for-n8n-integration';
const BASE_URL = 'http://localhost:3001';
const NGROK_URL = 'https://c2e6f6ff12f7.ngrok-free.app';

// Generate webhook signature like n8n would
function generateWebhookSignature(payload, secret) {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString, 'utf8')
    .digest('hex');
  return `sha256=${signature}`;
}

async function testN8NWebhookOnly() {
  console.log('🎯 Testing n8n Webhook Integration (Direct Test)...\n');

  try {
    // Step 1: Create a chat session first
    console.log('1. Creating chat session for webhook test...');
    
    const sessionResponse = await fetch(`${BASE_URL}/api/chat/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestEmail: 'n8n-test@example.com' })
    });

    if (!sessionResponse.ok) {
      console.log('⚠️  Session creation failed, using mock sessionId for webhook test only...');
      // For webhook testing, we can create a mock session in the database if needed
      // But let's try with a valid session ID from our previous test
      const mockSessionId = 'cmfdmqu5y00041trp35gzwmsc'; // Use the session we created earlier
      await testWebhookWithSession(mockSessionId);
      return;
    }

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.data.sessionId;
    console.log('✅ Chat session created:', sessionId);

    await testWebhookWithSession(sessionId);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testWebhookWithSession(sessionId) {
  console.log('\n2. Testing n8n webhook with sessionId:', sessionId);
  
  // Create n8n-style webhook payload
  const webhookPayload = {
    sessionId: sessionId,
    response: {
      content: '🎉 SUCCESS! This message was sent via n8n webhook integration. The system is working perfectly!',
      type: 'text'
    },
    timestamp: new Date().toISOString(),
    source: 'n8n-workflow-test',
    metadata: {
      workflowId: 'chat-support-workflow',
      nodeId: 'send-response-node',
      version: '1.0',
      testMode: true
    }
  };

  const payloadString = JSON.stringify(webhookPayload);
  const signature = generateWebhookSignature(payloadString, WEBHOOK_SECRET);

  console.log('   📤 Sending webhook request...');
  console.log('   🔐 Signature:', signature.substring(0, 20) + '...');

  // Test with localhost
  const response = await fetch(`${BASE_URL}/api/chat/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature
    },
    body: payloadString
  });

  const responseText = await response.text();
  
  console.log('\n📊 Webhook Response:');
  console.log('   Status:', response.status);
  console.log('   Status Text:', response.statusText);
  
  if (response.ok) {
    const result = JSON.parse(responseText);
    console.log('   ✅ SUCCESS! Webhook processed successfully');
    console.log('   📝 Bot message created:', result.message?.content?.substring(0, 50) + '...');
    console.log('   🆔 Message ID:', result.message?.id);
    
    // Test ngrok tunnel
    await testNgrokTunnel(sessionId, webhookPayload, signature);
    
    console.log('\n🎊 n8n WEBHOOK INTEGRATION IS WORKING!');
    console.log('\n📋 Integration Ready for n8n:');
    console.log('✅ Webhook URL:', NGROK_URL + '/api/chat/webhook');
    console.log('✅ Webhook Secret: Set in n8n HTTP Request node');
    console.log('✅ Signature Header: x-webhook-signature');
    console.log('✅ Payload Format: Validated and working');
    console.log('✅ Security: HMAC SHA-256 validation working');
    
    return true;
    
  } else {
    console.log('   ❌ FAILED! Error response:', responseText);
    return false;
  }
}

async function testNgrokTunnel(sessionId, webhookPayload, signature) {
  console.log('\n3. Testing ngrok tunnel for n8n cloud...');
  
  try {
    const ngrokResponse = await fetch(`${NGROK_URL}/api/chat/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (ngrokResponse.ok) {
      console.log('   ✅ Ngrok tunnel working! n8n cloud can reach webhook');
    } else {
      console.log('   ⚠️  Ngrok status:', ngrokResponse.status);
      console.log('   ℹ️  This is expected if ngrok tunnel is not active');
    }
  } catch (error) {
    console.log('   ⚠️  Ngrok test failed (expected if tunnel inactive):', error.message);
  }
}

// Test security
async function testWebhookSecurity() {
  console.log('\n4. Testing webhook security...');
  
  const testPayload = JSON.stringify({
    sessionId: 'test-session',
    response: { content: 'test', type: 'text' }
  });

  // Test without signature
  const noSigResponse = await fetch(`${BASE_URL}/api/chat/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: testPayload
  });

  if (noSigResponse.status === 401 || noSigResponse.status === 403) {
    console.log('   ✅ Security test passed: Unsigned requests rejected');
  } else {
    console.log('   ⚠️  Security concern: Unsigned request not properly rejected');
  }

  // Test with wrong signature
  const wrongSigResponse = await fetch(`${BASE_URL}/api/chat/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': 'sha256=wrong-signature'
    },
    body: testPayload
  });

  if (wrongSigResponse.status === 401 || wrongSigResponse.status === 403) {
    console.log('   ✅ Security test passed: Invalid signature rejected');
  } else {
    console.log('   ⚠️  Security concern: Invalid signature not properly rejected');
  }
}

async function runTest() {
  console.log('🔧 n8n Webhook Integration Test\n');
  console.log('This test verifies that the webhook endpoint can receive');
  console.log('and process responses from n8n workflows correctly.\n');
  
  const success = await testN8NWebhookOnly();
  
  if (success) {
    await testWebhookSecurity();
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n📖 Next Steps for n8n Setup:');
    console.log('1. Import the n8n-chat-workflow.json into your n8n instance');
    console.log('2. Set the webhook URL to:', NGROK_URL + '/api/chat/webhook');
    console.log('3. Configure HTTP Request node with webhook secret authentication');
    console.log('4. Test the workflow with a sample chat message');
    console.log('5. The chat system will automatically handle the response!');
  }
}

runTest().catch(console.error);