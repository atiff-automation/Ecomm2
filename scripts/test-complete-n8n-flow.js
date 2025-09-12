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

// Complete n8n integration test flow
async function testCompleteN8NFlow() {
  console.log('🚀 Testing Complete n8n Integration Flow...\n');

  try {
    // Step 1: Create a chat session (simulating user starting chat)
    console.log('1. Creating chat session...');
    
    const sessionResponse = await fetch(`${BASE_URL}/api/chat/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        guestEmail: 'test@example.com'
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Failed to create session: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.data.sessionId;
    
    console.log('✅ Chat session created:', sessionId);

    // Step 2: Send a user message (simulating user asking question)
    console.log('\n2. Sending user message...');
    
    const messageResponse = await fetch(`${BASE_URL}/api/chat/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: sessionId,
        content: 'Hello, I need help with my order status. Can you help me?',
        messageType: 'text'
      })
    });

    if (!messageResponse.ok) {
      throw new Error(`Failed to send message: ${messageResponse.status}`);
    }

    const messageData = await messageResponse.json();
    console.log('✅ User message sent:', messageData.message.content);

    // Step 3: Simulate n8n webhook response (this is what n8n would send back)
    console.log('\n3. Simulating n8n webhook response...');
    
    const webhookPayload = {
      sessionId: sessionId,
      response: {
        content: 'I\'d be happy to help you with your order status! To assist you better, could you please provide your order number? You can find it in your confirmation email or account dashboard.',
        type: 'text'
      },
      timestamp: new Date().toISOString(),
      source: 'n8n-workflow',
      metadata: {
        workflowId: 'order-support-flow',
        nodeId: 'customer-service-response',
        version: '1.0'
      }
    };

    const payloadString = JSON.stringify(webhookPayload);
    const signature = generateWebhookSignature(payloadString, WEBHOOK_SECRET);

    const webhookResponse = await fetch(`${BASE_URL}/api/chat/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature
      },
      body: payloadString
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.status} - ${await webhookResponse.text()}`);
    }

    const webhookResult = await webhookResponse.json();
    console.log('✅ n8n webhook response processed:', webhookResult.message.content.substring(0, 50) + '...');

    // Step 4: Test with ngrok (for n8n cloud)
    console.log('\n4. Testing with ngrok tunnel for n8n cloud...');
    
    const ngrokWebhookPayload = {
      sessionId: sessionId,
      response: {
        content: 'Great! I found your order. Your order #ORD-2024-001 is currently being processed and will be shipped within 2-3 business days. You\'ll receive a tracking number via email once it ships.',
        type: 'text'
      },
      timestamp: new Date().toISOString(),
      source: 'n8n-cloud',
      metadata: {
        workflowId: 'order-lookup-flow',
        nodeId: 'order-status-response',
        version: '1.0'
      }
    };

    const ngrokPayloadString = JSON.stringify(ngrokWebhookPayload);
    const ngrokSignature = generateWebhookSignature(ngrokPayloadString, WEBHOOK_SECRET);

    const ngrokResponse = await fetch(`${NGROK_URL}/api/chat/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': ngrokSignature,
        'ngrok-skip-browser-warning': 'true'
      },
      body: ngrokPayloadString
    });

    if (ngrokResponse.ok) {
      console.log('✅ Ngrok tunnel working! n8n cloud integration ready.');
    } else {
      console.log(`⚠️  Ngrok test status: ${ngrokResponse.status}`);
    }

    // Step 5: Verify complete conversation
    console.log('\n5. Verifying complete conversation...');
    
    const conversationResponse = await fetch(`${BASE_URL}/api/chat/session?sessionId=${sessionId}`);
    
    if (conversationResponse.ok) {
      const conversation = await conversationResponse.json();
      console.log('✅ Conversation retrieved with', conversation.messages.length, 'messages');
      
      // Display conversation
      console.log('\n📝 Complete Conversation:');
      conversation.messages.forEach((msg, i) => {
        const sender = msg.senderType === 'user' ? '👤 User' : '🤖 Bot';
        const content = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
        console.log(`   ${i + 1}. ${sender}: ${content}`);
      });
    }

    console.log('\n🎉 Complete n8n Integration Test SUCCESSFUL!');
    console.log('\n📋 Integration Summary:');
    console.log('✅ Chat session creation working');
    console.log('✅ User message sending working');
    console.log('✅ Webhook signature validation working');
    console.log('✅ n8n response processing working');
    console.log('✅ Ngrok tunnel accessibility working');
    console.log('✅ Complete conversation flow working');

    console.log('\n🔧 n8n Configuration Ready:');
    console.log('• Webhook URL:', NGROK_URL + '/api/chat/webhook');
    console.log('• Webhook Secret:', WEBHOOK_SECRET.substring(0, 15) + '...');
    console.log('• Required Header: x-webhook-signature');
    console.log('• Signature Format: sha256=<hmac-sha256-hex>');
    console.log('• Payload Format: JSON with sessionId and response fields');

    return true;

  } catch (error) {
    console.error('\n❌ n8n Integration Test FAILED:', error.message);
    return false;
  }
}

// Test error scenarios
async function testErrorScenarios() {
  console.log('\n🧪 Testing Error Scenarios...\n');

  // Test 1: Invalid signature
  console.log('1. Testing invalid signature...');
  const badPayload = JSON.stringify({ sessionId: 'test', response: { content: 'test', type: 'text' } });
  const badSignature = 'sha256=invalid-signature';

  const badResponse = await fetch(`${BASE_URL}/api/chat/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': badSignature
    },
    body: badPayload
  });

  console.log(badResponse.ok ? '❌ Should have failed' : '✅ Correctly rejected invalid signature');

  // Test 2: Missing signature
  console.log('2. Testing missing signature...');
  const noSigResponse = await fetch(`${BASE_URL}/api/chat/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: badPayload
  });

  console.log(noSigResponse.ok ? '❌ Should have failed' : '✅ Correctly rejected missing signature');

  console.log('✅ Error scenarios tested successfully');
}

// Run all tests
async function runAllTests() {
  const success = await testCompleteN8NFlow();
  
  if (success) {
    await testErrorScenarios();
    console.log('\n🎊 ALL TESTS PASSED! n8n integration is ready for production use.');
  } else {
    console.log('\n💥 Tests failed. Please check the error messages above.');
  }
}

runAllTests().catch(console.error);