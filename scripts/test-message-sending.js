#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();

async function testMessageSending() {
  try {
    console.log('🧪 TESTING MESSAGE SENDING API\n');

    // Step 1: Create session using init endpoint (should work)
    console.log('1️⃣ Creating session via init endpoint...');
    const initResponse = await fetch('http://localhost:3000/api/chat/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestEmail: 'test-message@example.com',
        isUIInit: true
      })
    });

    console.log(`   Status: ${initResponse.status}`);
    
    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.log(`❌ Init failed: ${errorText}`);
      return;
    }

    const initData = await initResponse.json();
    const sessionId = initData.data.sessionId;
    console.log(`✅ Session created: ${sessionId}\n`);

    // Step 2: Try to send a message (may hit rate limits)
    console.log('2️⃣ Attempting to send message...');
    const messageResponse = await fetch('http://localhost:3000/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        content: 'Test message to check rate limiting'
      })
    });

    console.log(`   Status: ${messageResponse.status}`);
    
    if (messageResponse.status === 429) {
      console.log('❌ CONFIRMED: Message sending endpoint is rate limited!');
      const rateLimitHeaders = {
        'X-RateLimit-Limit': messageResponse.headers.get('X-RateLimit-Limit'),
        'X-RateLimit-Remaining': messageResponse.headers.get('X-RateLimit-Remaining'),
        'X-RateLimit-Reset': messageResponse.headers.get('X-RateLimit-Reset'),
        'Retry-After': messageResponse.headers.get('Retry-After')
      };
      console.log('   Rate limit headers:', rateLimitHeaders);
      
      const errorText = await messageResponse.text();
      console.log(`   Error details: ${errorText}`);
    } else if (messageResponse.ok) {
      const messageData = await messageResponse.json();
      console.log('✅ Message sent successfully!');
      console.log(`   Message ID: ${messageData.data.messageId}`);
    } else {
      const errorText = await messageResponse.text();
      console.log(`❌ Message sending failed: ${errorText}`);
    }

    // Step 3: Check health endpoint
    console.log('\n3️⃣ Checking health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/api/chat/webhook', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`   Health Status: ${healthResponse.status}`);
    
    if (healthResponse.status === 429) {
      console.log('❌ Health endpoint also rate limited!');
    } else if (healthResponse.ok) {
      console.log('✅ Health endpoint working');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMessageSending();