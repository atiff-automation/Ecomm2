#!/usr/bin/env node

/**
 * Clear old chat sessions to test new timeout configuration
 * This helps when testing the new 30-minute timeout for guests and 2-hour timeout for authenticated users
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearOldSessions() {
  console.log('🧹 Clearing old chat sessions...\n');
  
  try {
    // First, let's see what sessions exist
    const existingSessions = await prisma.chatSession.findMany({
      where: {
        status: 'active'
      },
      select: {
        id: true,
        sessionId: true,
        userId: true,
        guestEmail: true,
        createdAt: true,
        expiresAt: true,
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${existingSessions.length} active sessions:`);
    existingSessions.forEach((session, index) => {
      const type = session.userId ? 'Authenticated' : 'Guest';
      const identifier = session.userId || session.guestEmail;
      const timeRemaining = session.expiresAt ? 
        Math.max(0, Math.floor((new Date(session.expiresAt) - new Date()) / (1000 * 60))) : 
        'Unknown';
      
      console.log(`  ${index + 1}. ${type}: ${identifier}`);
      console.log(`     Session ID: ${session.sessionId}`);
      console.log(`     Created: ${session.createdAt.toLocaleString()}`);
      console.log(`     Expires: ${session.expiresAt ? session.expiresAt.toLocaleString() : 'Never'}`);
      console.log(`     Time Remaining: ${timeRemaining} minutes`);
      console.log('');
    });

    if (existingSessions.length === 0) {
      console.log('✅ No active sessions found. You can test the new timeout configuration!');
      return;
    }

    // Ask for confirmation (in a real script, you might want user input)
    console.log('🗑️  Clearing all active sessions to test new timeout configuration...\n');

    // Update all active sessions to 'ended' status
    const result = await prisma.chatSession.updateMany({
      where: {
        status: 'active'
      },
      data: {
        status: 'ended',
        endedAt: new Date()
      }
    });

    console.log(`✅ Successfully cleared ${result.count} sessions.\n`);
    
    // Verify the cleanup
    const remainingSessions = await prisma.chatSession.count({
      where: {
        status: 'active'
      }
    });

    if (remainingSessions === 0) {
      console.log('🎉 All sessions cleared! Now you can test:');
      console.log('   👤 Guest sessions: 30 minutes timeout');
      console.log('   🔐 Authenticated sessions: 2 hours timeout');
      console.log('');
      console.log('💡 Test steps:');
      console.log('   1. Open incognito browser → test-chat page');
      console.log('   2. Use any email → should show 30 minutes');
      console.log('   3. Login as admin → test-chat page'); 
      console.log('   4. Should show 2 hours for authenticated users');
    } else {
      console.log(`⚠️  Warning: ${remainingSessions} sessions still remain active.`);
    }

  } catch (error) {
    console.error('❌ Error clearing sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearOldSessions().catch(console.error);