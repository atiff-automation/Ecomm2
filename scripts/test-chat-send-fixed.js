#!/usr/bin/env node

const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧪 Testing fixed chat send endpoint...\n');

    // First, get or create an active session
    console.log('1. Getting active chat sessions...');
    const activeSessions = await prisma.chatSession.findMany({
      where: { 
        status: 'active',
        expiresAt: {
          gte: new Date()
        }
      },
      orderBy: { lastActivity: 'desc' },
      take: 1
    });

    let sessionId;
    if (activeSessions.length > 0) {
      sessionId = activeSessions[0].sessionId;
      console.log(`✅ Found active session: ${sessionId}`);
    } else {
      console.log('No active sessions found, creating a new one...');
      
      // Create a new session
      const response = await fetch('http://localhost:3000/api/chat/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestEmail: 'test@example.com'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status} ${response.statusText}`);
      }

      const sessionData = await response.json();
      sessionId = sessionData.sessionId;
      console.log(`✅ Created new session: ${sessionId}`);
    }

    // Test sending a message
    console.log('\n2. Sending test message...');
    const messageResponse = await fetch('http://localhost:3000/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: sessionId,
        content: 'Hello! Testing the fixed chat endpoint.'
      })
    });

    console.log(`Response status: ${messageResponse.status}`);

    if (messageResponse.ok) {
      const responseData = await messageResponse.json();
      console.log('✅ Message sent successfully!');
      console.log(`Message ID: ${responseData.messageId}`);
      console.log(`Status: ${responseData.status}`);
      console.log(`Timestamp: ${responseData.timestamp}`);
    } else {
      const errorData = await messageResponse.text();
      console.log('❌ Message send failed:');
      console.log(`Status: ${messageResponse.status}`);
      console.log(`Error: ${errorData}`);
    }

    console.log('\n3. Waiting 3 seconds for webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check recent messages for this session
    console.log('\n4. Checking messages for this session...');
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: sessionId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        senderType: true,
        content: true,
        status: true,
        createdAt: true
      }
    });

    console.log(`Found ${messages.length} messages:`);
    messages.forEach(msg => {
      console.log(`- [${msg.senderType.toUpperCase()}] ${msg.content} (${msg.status})`);
    });

  } catch (error) {
    console.error('Error testing chat send:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();