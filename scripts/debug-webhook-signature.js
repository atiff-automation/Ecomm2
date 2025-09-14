#!/usr/bin/env node

/**
 * Debug Webhook Signature Generation
 * This script tests the exact signature generation that should match your webhook
 */

const crypto = require('crypto');

// Use the exact same secret as in .env and N8N
const WEBHOOK_SECRET = 'chat-webhook-secret-2024-secure-key-for-n8n-integration';

// Test payload that matches what N8N should send
const testPayload = {
  sessionId: 'test-session-123',
  response: {
    content: 'Test response from Mya AI',
    type: 'text'
  },
  metadata: {
    intent: 'chat_response',
    confidence: 1.0,
    processedAt: new Date().toISOString(),
    source: 'n8n_workflow'
  }
};

console.log('=== Webhook Signature Debug ===\n');

// Test 1: Generate signature the way N8N should
console.log('1. Test payload:');
console.log(JSON.stringify(testPayload, null, 2));

const payloadString = JSON.stringify(testPayload);
console.log('\n2. Payload string (no formatting):');
console.log(payloadString);

// Generate signature the same way as N8N Sign Payload node
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
hmac.update(payloadString, 'utf8');
const signature = `sha256=${hmac.digest('hex')}`;

console.log('\n3. Generated signature:');
console.log(signature);

// Test 2: Verify signature using your webhook verification function
function verifyWebhookSignature(payload, signature, secret) {
  try {
    // Remove any prefix like "sha256=" if present
    const cleanSignature = signature.replace(/^sha256=/, '');

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    console.log('\n4. Verification details:');
    console.log('   Clean signature:', cleanSignature);
    console.log('   Expected signature:', expectedSignature);
    console.log('   Match:', cleanSignature === expectedSignature);

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

const isValid = verifyWebhookSignature(payloadString, signature, WEBHOOK_SECRET);
console.log('\n5. Signature verification result:', isValid ? 'VALID ✅' : 'INVALID ❌');

// Test 3: Test with different payload formatting
console.log('\n=== Testing Different Payload Formats ===');

// Test with pretty-printed JSON (common mistake)
const prettyPayload = JSON.stringify(testPayload, null, 2);
const prettySignature = `sha256=${crypto.createHmac('sha256', WEBHOOK_SECRET).update(prettyPayload, 'utf8').digest('hex')}`;
const prettyValid = verifyWebhookSignature(prettyPayload, prettySignature, WEBHOOK_SECRET);
console.log('Pretty-printed payload valid:', prettyValid ? 'VALID ✅' : 'INVALID ❌');

// Test with simple payload
const simplePayload = { message: 'test' };
const simplePayloadString = JSON.stringify(simplePayload);
const simpleSignature = `sha256=${crypto.createHmac('sha256', WEBHOOK_SECRET).update(simplePayloadString, 'utf8').digest('hex')}`;
const simpleValid = verifyWebhookSignature(simplePayloadString, simpleSignature, WEBHOOK_SECRET);
console.log('Simple payload valid:', simpleValid ? 'VALID ✅' : 'INVALID ❌');

console.log('\n=== Test Complete ===');