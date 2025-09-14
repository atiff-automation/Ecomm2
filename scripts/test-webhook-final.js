#!/usr/bin/env node

/**
 * Final Webhook Test with Real Session
 */

const crypto = require('crypto');

const BASE_URL = 'https://eca5935689ac.ngrok-free.app';
const WEBHOOK_SECRET = 'chat-webhook-secret-2024-secure-key-for-n8n-integration';
const API_KEY = '4cb769e04a4a46a588553a442fb3d3db';

async function testWebhookFinal() {
  console.log('=== Final Webhook Test ===\n');

  // Use the real session from our previous test
  const realSessionId = 'cmfjojn2m002jgpab39aqnbfj';

  const testPayload = {
    sessionId: realSessionId,
    response: {
      content: 'Untuk masalah kulit kering, Mya cadangkan EU Soap dengan susu kambing. Produk ini mengandungi hyaluronic acid yang membantu melembapkan kulit. InsyaAllah bermanfaat.',
      type: 'text'
    },
    metadata: {
      intent: 'skincare_recommendation',
      confidence: 0.95,
      processedAt: new Date().toISOString(),
      source: 'n8n_workflow_test'
    }
  };

  console.log('Testing with real session:', realSessionId);
  console.log('Payload:', JSON.stringify(testPayload, null, 2));

  // Generate signature
  const payloadString = JSON.stringify(testPayload);
  const signature = `sha256=${crypto.createHmac('sha256', WEBHOOK_SECRET).update(payloadString, 'utf8').digest('hex')}`;

  console.log('\nGenerated signature:', signature.substring(0, 30) + '...');

  // Send to webhook
  const response = await fetch(`${BASE_URL}/api/chat/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-API-Key': API_KEY,
      'ngrok-skip-browser-warning': 'true'
    },
    body: payloadString
  });

  console.log('\nWebhook Response Status:', response.status);

  if (response.ok) {
    const responseData = await response.json();
    console.log('✅ Webhook SUCCESS!');
    console.log('Response:', JSON.stringify(responseData, null, 2));
  } else {
    const errorText = await response.text();
    console.log('❌ Webhook FAILED:');
    console.log('Error:', errorText);
  }
}

testWebhookFinal();