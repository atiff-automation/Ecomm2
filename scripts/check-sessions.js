#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking chat sessions...\n');

    // Get all sessions to see the structure
    const allSessions = await prisma.chatSession.findMany({
      select: {
        id: true,
        sessionId: true,
        status: true,
        expiresAt: true,
        lastActivity: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`Found ${allSessions.length} total sessions:`);
    allSessions.forEach(session => {
      const isExpired = session.expiresAt && session.expiresAt < new Date();
      console.log(`- ID: ${session.id}`);
      console.log(`  SessionID: ${session.sessionId}`);
      console.log(`  Status: ${session.status}`);
      console.log(`  Expired: ${isExpired ? 'YES' : 'NO'}`);
      console.log(`  Last Activity: ${session.lastActivity}`);
      console.log('');
    });

    // Check active sessions specifically
    console.log('Active sessions:');
    const activeSessions = await prisma.chatSession.findMany({
      where: { 
        status: 'active',
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      select: {
        id: true,
        sessionId: true,
        status: true,
        expiresAt: true,
      }
    });

    console.log(`Found ${activeSessions.length} active sessions:`);
    activeSessions.forEach(session => {
      console.log(`- ID: ${session.id} | SessionID: ${session.sessionId}`);
    });

    // Try the sessionId we're using in the test
    const testSessionId = 'cmfg6e3sf0005gph94o7jrdpc';
    console.log(`\nLooking for session with sessionId: ${testSessionId}`);
    
    const foundSession = await prisma.chatSession.findUnique({
      where: { sessionId: testSessionId }
    });

    if (foundSession) {
      console.log('✅ Found session:', {
        id: foundSession.id,
        sessionId: foundSession.sessionId,
        status: foundSession.status,
        expiresAt: foundSession.expiresAt
      });
    } else {
      console.log('❌ Session not found');
    }

  } catch (error) {
    console.error('Error checking sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();