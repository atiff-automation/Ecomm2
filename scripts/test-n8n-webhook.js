const crypto = require('crypto');

// Test configuration
const WEBHOOK_SECRET = 'chat-webhook-secret-2024-secure-key-for-n8n-integration';
const BASE_URL = 'http://localhost:3001';

// Generate webhook signature like n8n would
function generateWebhookSignature(payload, secret) {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString, 'utf8')
    .digest('hex');
  return `sha256=${signature}`;
}

// Test webhook with proper n8n format
async function testN8NWebhook() {
  console.log('🧪 Testing n8n Webhook Integration...\n');

  // Create a test session first (would normally be done by chat initiation)
  console.log('1. Creating test chat session...');
  
  const testPayload = {
    sessionId: 'test-session-123',
    response: {
      content: 'Hello! This is a test response from n8n integration. How can I help you today?',
      type: 'text'
    },
    timestamp: new Date().toISOString(),
    source: 'n8n-workflow'
  };

  const payloadString = JSON.stringify(testPayload);
  const signature = generateWebhookSignature(payloadString, WEBHOOK_SECRET);

  console.log('2. Generated webhook signature:', signature.substring(0, 20) + '...');
  console.log('3. Test payload:', JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch(`${BASE_URL}/api/chat/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature
      },
      body: payloadString
    });

    const result = await response.text();
    
    console.log('\n📋 Response Status:', response.status);
    console.log('📋 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    console.log('📋 Response Body:');
    
    try {
      const jsonResult = JSON.parse(result);
      console.log(JSON.stringify(jsonResult, null, 2));
    } catch {
      console.log(result);
    }

    if (response.status === 200) {
      console.log('\n✅ Webhook test successful! n8n integration is working.');
    } else {
      console.log('\n❌ Webhook test failed. Status:', response.status);
    }

  } catch (error) {
    console.error('\n❌ Error testing webhook:', error.message);
  }

  // Test webhook without signature (should fail)
  console.log('\n4. Testing webhook security (should fail without signature)...');
  
  try {
    const unsecureResponse = await fetch(`${BASE_URL}/api/chat/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payloadString
    });

    const unsecureResult = await unsecureResponse.text();
    
    if (unsecureResponse.status === 401 || unsecureResponse.status === 403) {
      console.log('✅ Security test passed! Unsigned requests are properly rejected.');
    } else {
      console.log('⚠️  Security concern: Unsigned request was not rejected properly.');
    }
    
  } catch (error) {
    console.error('❌ Error testing security:', error.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('- Webhook endpoint: ' + BASE_URL + '/api/chat/webhook');
  console.log('- Webhook secret: ' + WEBHOOK_SECRET.substring(0, 10) + '...');
  console.log('- Signature format: HMAC SHA-256 with sha256= prefix');
  console.log('- Expected headers: x-webhook-signature');
  console.log('- Expected payload: JSON with sessionId and response fields');
}

// Test with ngrok URL if available
async function testWithNgrok() {
  const ngrokUrl = 'https://c2e6f6ff12f7.ngrok-free.app';
  
  console.log('\n🌐 Testing with ngrok tunnel...');
  
  const testPayload = {
    sessionId: 'ngrok-test-session-456',
    response: {
      content: 'This is a test from ngrok tunnel for n8n cloud integration!',
      type: 'text'
    },
    timestamp: new Date().toISOString(),
    source: 'n8n-cloud-test'
  };

  const payloadString = JSON.stringify(testPayload);
  const signature = generateWebhookSignature(payloadString, WEBHOOK_SECRET);

  try {
    const response = await fetch(`${ngrokUrl}/api/chat/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
        'ngrok-skip-browser-warning': 'true'
      },
      body: payloadString
    });

    console.log('🌐 Ngrok Response Status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Ngrok tunnel is working! n8n cloud can reach the webhook.');
    } else {
      console.log('❌ Ngrok tunnel test failed. Status:', response.status);
    }

  } catch (error) {
    console.error('❌ Ngrok tunnel test error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testN8NWebhook();
  await testWithNgrok();
  
  console.log('\n📊 Integration Test Complete!');
  console.log('\nNext steps for n8n configuration:');
  console.log('1. Use webhook URL: https://c2e6f6ff12f7.ngrok-free.app/api/chat/webhook');
  console.log('2. Set webhook secret in n8n HTTP Request authentication');
  console.log('3. Add x-webhook-signature header with generated HMAC SHA-256');
  console.log('4. Send POST requests with JSON payload containing sessionId and response');
}

runTests().catch(console.error);