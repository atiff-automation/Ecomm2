#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();

async function debugMessageSend() {
  try {
    console.log('🔍 DEBUG MESSAGE SEND API\n');

    // Step 1: Create session and extract sessionId properly
    console.log('1. Creating session...');
    const sessionResponse = await fetch('http://localhost:3000/api/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestEmail: 'debug@example.com' })
    });

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.data.sessionId; // Extract from data object
    console.log(`✅ Session created: ${sessionId}`);

    // Step 2: Verify session exists in database
    console.log('\n2. Verifying session in database...');
    const dbSession = await prisma.chatSession.findUnique({
      where: { sessionId: sessionId }
    });
    console.log(`✅ DB Session found: ID=${dbSession.id}, SessionID=${dbSession.sessionId}`);

    // Step 3: Send message and capture detailed error
    console.log('\n3. Sending test message...');
    try {
      const messageResponse = await fetch('http://localhost:3000/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          content: 'Debug test message'
        })
      });

      console.log(`Response Status: ${messageResponse.status}`);
      const responseText = await messageResponse.text();
      
      if (messageResponse.ok) {
        console.log('✅ Message sent successfully!');
        console.log('Response:', responseText);
      } else {
        console.log('❌ Message send failed');
        console.log('Error Response:', responseText);
      }
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMessageSend();