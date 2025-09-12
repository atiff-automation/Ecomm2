#!/usr/bin/env node

const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 MCP COMPREHENSIVE CHAT SYSTEM TEST\n');

    // Step 1: Check database connectivity
    console.log('1. 🗄️  Testing database connectivity...');
    try {
      await prisma.$connect();
      console.log('   ✅ Database connected successfully');
    } catch (dbError) {
      console.log('   ❌ Database connection failed:', dbError.message);
      return;
    }

    // Step 2: Check chat configuration
    console.log('\n2. ⚙️  Checking chat configuration...');
    const config = await prisma.chatConfig.findFirst({
      where: { isActive: true }
    });
    
    if (!config) {
      console.log('   ❌ No active chat configuration found');
      return;
    }
    
    const isHealthy = config.isActive && config.verified && config.webhookUrl && config.healthStatus === 'HEALTHY';
    console.log(`   Configuration: ${isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`   - Active: ${config.isActive}`);
    console.log(`   - Verified: ${config.verified}`);
    console.log(`   - Webhook URL: ${config.webhookUrl ? 'SET' : 'NULL'}`);
    console.log(`   - Health Status: ${config.healthStatus}`);

    // Step 3: Check existing sessions
    console.log('\n3. 👤 Checking existing sessions...');
    const activeSessions = await prisma.chatSession.findMany({
      where: { 
        status: 'active',
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      orderBy: { lastActivity: 'desc' },
      take: 3
    });
    
    console.log(`   Found ${activeSessions.length} active sessions`);
    activeSessions.forEach((session, i) => {
      console.log(`   ${i+1}. ID: ${session.id} | SessionID: ${session.sessionId} | Status: ${session.status}`);
    });

    // Step 4: Create a new session for testing
    console.log('\n4. 🆕 Creating new test session...');
    const sessionResponse = await fetch('http://localhost:3000/api/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestEmail: 'mcp-test@example.com' })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.log(`   ❌ Failed to create session: ${sessionResponse.status} ${errorText}`);
      return;
    }

    const sessionData = await sessionResponse.json();
    const testSessionId = sessionData.sessionId;
    console.log(`   ✅ Created session: ${testSessionId}`);

    // Step 5: Test message sending
    console.log('\n5. 💬 Testing message sending...');
    const messageResponse = await fetch('http://localhost:3000/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        content: 'MCP Test Message - Comprehensive Testing'
      })
    });

    console.log(`   Response Status: ${messageResponse.status}`);
    if (messageResponse.ok) {
      const messageData = await messageResponse.json();
      console.log(`   ✅ Message sent successfully!`);
      console.log(`   - Message ID: ${messageData.messageId}`);
      console.log(`   - Status: ${messageData.status}`);
      console.log(`   - Timestamp: ${messageData.timestamp}`);
    } else {
      const errorText = await messageResponse.text();
      console.log(`   ❌ Message send failed: ${errorText}`);
    }

    // Step 6: Check message in database
    console.log('\n6. 🔍 Verifying message in database...');
    const messages = await prisma.chatMessage.findMany({
      where: { 
        session: {
          sessionId: testSessionId
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (messages.length > 0) {
      const msg = messages[0];
      console.log(`   ✅ Message found in database:`);
      console.log(`   - Content: "${msg.content}"`);
      console.log(`   - Status: ${msg.status}`);
      console.log(`   - Sender: ${msg.senderType}`);
    } else {
      console.log(`   ❌ No messages found in database`);
    }

    // Step 7: Check webhook queue
    console.log('\n7. 🔄 Checking webhook queue...');
    const webhookItems = await prisma.chatWebhookQueue.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`   Found ${webhookItems.length} recent webhook items:`);
    webhookItems.forEach((item, i) => {
      console.log(`   ${i+1}. Message: ${item.messageId} | Status: ${item.status} | Attempts: ${item.attempts}/${item.maxAttempts}`);
    });

    // Step 8: Test webhook endpoint health
    console.log('\n8. 🏥 Testing webhook endpoint health...');
    const webhookHealthResponse = await fetch('http://localhost:3000/api/chat/webhook');
    console.log(`   Webhook health status: ${webhookHealthResponse.status}`);
    if (webhookHealthResponse.ok) {
      const healthData = await webhookHealthResponse.json();
      console.log(`   ✅ Webhook endpoint healthy: ${healthData.data?.status}`);
    } else {
      console.log(`   ❌ Webhook endpoint unhealthy`);
    }

    console.log('\n🎯 COMPREHENSIVE TEST SUMMARY:');
    console.log(`   Database: ${isHealthy ? '✅' : '❌'}`);
    console.log(`   Configuration: ${isHealthy ? '✅' : '❌'}`);
    console.log(`   Session Creation: ${sessionResponse.ok ? '✅' : '❌'}`);
    console.log(`   Message Sending: ${messageResponse.ok ? '✅' : '❌'}`);
    console.log(`   Database Storage: ${messages.length > 0 ? '✅' : '❌'}`);
    console.log(`   Webhook Queue: ${webhookItems.length > 0 ? '✅' : '❌'}`);
    console.log(`   Webhook Health: ${webhookHealthResponse.ok ? '✅' : '❌'}`);

  } catch (error) {
    console.error('\n💥 Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();