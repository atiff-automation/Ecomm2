#!/usr/bin/env node

/**
 * Test N8N workflow with real session ID
 * This creates a real session and then tests the complete flow
 */

const crypto = require('crypto');

const BASE_URL = 'https://eca5935689ac.ngrok-free.app';
const N8N_WEBHOOK = 'https://urusresit.app.n8n.cloud/webhook-test/chat';
const WEBHOOK_SECRET = 'chat-webhook-secret-2024-secure-key-for-n8n-integration';
const API_KEY = '4cb769e04a4a46a588553a442fb3d3db';

async function testN8NWithRealSession() {
  console.log('=== Testing N8N with Real Session ===\n');

  try {
    // Step 1: Create a real chat session
    console.log('1. Creating real chat session...');

    const sessionResponse = await fetch(`${BASE_URL}/api/chat/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        guestPhone: '+60123456789'
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`Failed to create session: ${sessionResponse.status} - ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    const realSessionId = sessionData.data.sessionId;
    console.log('   ✅ Real session created:', realSessionId);
    console.log('   Session format valid for CUID:', /^c[a-z0-9]{24}$/.test(realSessionId));

    // Step 2: Send a user message to the session
    console.log('\n2. Sending user message to session...');

    const messageResponse = await fetch(`${BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        sessionId: realSessionId,
        content: 'Saya ada masalah kulit kering. Boleh cadangkan produk?',
        messageType: 'text'
      })
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Failed to send message: ${messageResponse.status} - ${errorText}`);
    }

    const messageData = await messageResponse.json();
    console.log('   ✅ User message sent:', messageData.data.content);

    // Step 3: Trigger N8N webhook with the real session data
    console.log('\n3. Triggering N8N webhook with real session...');

    const n8nPayload = {
      sessionId: realSessionId,
      message: {
        content: 'Saya ada masalah kulit kering. Boleh cadangkan produk?'
      },
      body: {
        sessionId: realSessionId,
        message: {
          content: 'Saya ada masalah kulit kering. Boleh cadangkan produk?'
        }
      }
    };

    console.log('   Payload to N8N:');
    console.log('   ', JSON.stringify(n8nPayload, null, 2));

    const n8nResponse = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(n8nPayload)
    });

    console.log('   N8N Response Status:', n8nResponse.status);

    if (n8nResponse.ok) {
      const n8nResponseText = await n8nResponse.text();
      console.log('   ✅ N8N webhook accepted the request');
      console.log('   Response preview:', n8nResponseText.substring(0, 100) + '...');

      // Step 4: Wait for N8N to process and send back to our webhook
      console.log('\n4. Waiting for N8N processing (15 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Step 5: Check if bot responded
      console.log('\n5. Checking for bot response...');

      const messagesResponse = await fetch(`${BASE_URL}/api/chat/messages/${realSessionId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        console.log('   Total messages:', messagesData.data.length);

        const botMessages = messagesData.data.filter(msg => msg.senderType === 'bot');

        if (botMessages.length > 0) {
          console.log('   ✅ Bot responded!');
          console.log('   Bot message:', botMessages[botMessages.length - 1].content);
          console.log('\n🎉 Complete N8N integration test SUCCESSFUL!');
        } else {
          console.log('   ⏳ No bot response yet. Messages:');
          messagesData.data.forEach((msg, i) => {
            console.log(`     ${i + 1}. ${msg.senderType}: ${msg.content.substring(0, 50)}...`);
          });
          console.log('\n   This might be normal if N8N is still processing...');
        }
      }

    } else {
      const errorText = await n8nResponse.text();
      console.log('   ❌ N8N webhook failed');
      console.log('   Status:', n8nResponse.status);
      console.log('   Error:', errorText);
    }

    // Step 6: Test webhook signature directly with the real session
    console.log('\n6. Testing webhook signature with real session...');

    const webhookPayload = {
      sessionId: realSessionId,
      response: {
        content: 'Untuk masalah kulit kering, Mya cadangkan EU Soap. Produk ini mengandungi susu kambing dan hyaluronic acid yang membantu melembapkan kulit. InsyaAllah bermanfaat untuk anda.',
        type: 'text'
      },
      metadata: {
        intent: 'product_recommendation',
        confidence: 0.95,
        processedAt: new Date().toISOString(),
        source: 'direct_test'
      }
    };

    const payloadString = JSON.stringify(webhookPayload);
    const signature = `sha256=${crypto.createHmac('sha256', WEBHOOK_SECRET).update(payloadString, 'utf8').digest('hex')}`;

    const webhookResponse = await fetch(`${BASE_URL}/api/chat/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-API-Key': API_KEY,
        'ngrok-skip-browser-warning': 'true'
      },
      body: payloadString
    });

    console.log('   Webhook test status:', webhookResponse.status);

    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log('   ✅ Direct webhook test SUCCESSFUL!');
      console.log('   Response:', webhookData);
    } else {
      const errorText = await webhookResponse.text();
      console.log('   ❌ Direct webhook test failed:', errorText);
    }

    console.log('\n=== Test Summary ===');
    console.log('Real session ID:', realSessionId);
    console.log('Session format valid:', /^c[a-z0-9]{24}$/.test(realSessionId));
    console.log('N8N webhook URL:', N8N_WEBHOOK);
    console.log('Chat webhook URL:', `${BASE_URL}/api/chat/webhook`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testN8NWithRealSession();