#!/usr/bin/env node

/**
 * Test Webhook Endpoint Directly
 * This script sends a POST request directly to your webhook to test signature verification
 */

const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = 'https://eca5935689ac.ngrok-free.app/api/chat/webhook';
const WEBHOOK_SECRET = 'chat-webhook-secret-2024-secure-key-for-n8n-integration';
const API_KEY = '4cb769e04a4a46a588553a442fb3d3db';

// Generate a valid CUID-like sessionId (CUID format: c + 24 characters)
function generateCUID() {
  return 'c' + Array.from({ length: 24 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
  ).join('');
}

// Test payload
const testPayload = {
  sessionId: generateCUID(),
  response: {
    content: 'Direct test response from script',
    type: 'text'
  },
  metadata: {
    intent: 'chat_response',
    confidence: 1.0,
    processedAt: new Date().toISOString(),
    source: 'direct_test'
  }
};

async function testWebhook() {
  try {
    console.log('=== Testing Webhook Directly ===\n');

    // Convert payload to string (exactly like N8N should)
    const payloadString = JSON.stringify(testPayload);
    console.log('1. Payload string:');
    console.log(payloadString);

    // Generate signature
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(payloadString, 'utf8');
    const signature = `sha256=${hmac.digest('hex')}`;

    console.log('\n2. Generated signature:');
    console.log(signature);

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-API-Key': API_KEY,
      'ngrok-skip-browser-warning': 'true'  // Skip ngrok browser warning
    };

    console.log('\n3. Request headers:');
    console.log(JSON.stringify(headers, null, 2));

    // Make the request
    console.log('\n4. Sending POST request to:', WEBHOOK_URL);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: headers,
      body: payloadString
    });

    console.log('\n5. Response status:', response.status);

    const responseData = await response.text();
    console.log('\n6. Response body:');

    try {
      const jsonResponse = JSON.parse(responseData);
      console.log(JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }

    if (response.ok) {
      console.log('\n✅ Webhook test SUCCESSFUL!');
    } else {
      console.log('\n❌ Webhook test FAILED!');
      console.log('Status:', response.status);
      console.log('Response:', responseData);
    }

  } catch (error) {
    console.error('\n❌ Error testing webhook:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

// Run the test
testWebhook();