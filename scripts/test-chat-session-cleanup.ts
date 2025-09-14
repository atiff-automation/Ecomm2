#!/usr/bin/env npx tsx

/**
 * Test script for chat session cleanup functionality
 * Tests both expired and inactive session detection
 */

import { PrismaClient } from '@prisma/client';
import { 
  cleanupChatSessions,
  getSessionCleanupStatistics,
  getChatSessionsExpiringSoon,
  extendSessionExpiry
} from '../src/lib/chat/session-cleanup';

const prisma = new PrismaClient();

async function testChatSessionCleanup() {
  try {
    console.log('🧪 Testing Chat Session Cleanup Functionality');
    console.log('================================================');

    // Step 1: Get initial statistics
    console.log('\n📊 Step 1: Getting initial statistics...');
    const initialStats = await getSessionCleanupStatistics();
    console.log('Initial session statistics:', initialStats);

    // Step 2: Create test sessions with different scenarios
    console.log('\n🎭 Step 2: Creating test sessions...');
    
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 35 * 60 * 1000); // 35 minutes ago
    const twoHoursAgo = new Date(now.getTime() - 130 * 60 * 1000); // 2 hours 10 minutes ago
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    const expiredTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

    // Test session 1: Expired guest session (should be marked expired)
    const expiredGuestSession = await prisma.chatSession.create({
      data: {
        sessionId: `test-expired-guest-${Date.now()}`,
        status: 'active',
        guestEmail: 'test-expired@example.com',
        expiresAt: expiredTime,
        lastActivity: thirtyMinutesAgo,
      },
    });

    // Test session 2: Inactive guest session (no expiresAt but inactive for >30min)
    const inactiveGuestSession = await prisma.chatSession.create({
      data: {
        sessionId: `test-inactive-guest-${Date.now()}`,
        status: 'active',
        guestPhone: '+1234567890',
        lastActivity: thirtyMinutesAgo,
        expiresAt: null,
      },
    });

    // Test session 3: Active session expiring soon
    const expiringSession = await prisma.chatSession.create({
      data: {
        sessionId: `test-expiring-${Date.now()}`,
        status: 'active',
        guestEmail: 'test-expiring@example.com',
        expiresAt: fiveMinutesFromNow,
        lastActivity: new Date(),
      },
    });

    // Test session 4: Healthy active session
    const activeSession = await prisma.chatSession.create({
      data: {
        sessionId: `test-active-${Date.now()}`,
        status: 'active',
        guestEmail: 'test-active@example.com',
        expiresAt: new Date(now.getTime() + 20 * 60 * 1000), // 20 minutes from now
        lastActivity: new Date(),
      },
    });

    console.log('✅ Created test sessions:');
    console.log(`- Expired guest session: ${expiredGuestSession.sessionId}`);
    console.log(`- Inactive guest session: ${inactiveGuestSession.sessionId}`);
    console.log(`- Expiring session: ${expiringSession.sessionId}`);
    console.log(`- Active session: ${activeSession.sessionId}`);

    // Step 3: Test sessions expiring soon
    console.log('\n⏰ Step 3: Testing sessions expiring soon...');
    const expiringSoons = await getChatSessionsExpiringSoon(10); // Within 10 minutes
    console.log(`Found ${expiringSoons.length} sessions expiring within 10 minutes:`);
    expiringSoons.forEach(session => {
      console.log(`- ${session.sessionId}: expires in ${session.minutesUntilExpiry} minutes`);
    });

    // Step 4: Test session cleanup
    console.log('\n🧹 Step 4: Running session cleanup...');
    const cleanupResult = await cleanupChatSessions();
    console.log('Cleanup result:', cleanupResult);

    // Step 5: Verify cleanup results
    console.log('\n✅ Step 5: Verifying cleanup results...');
    
    // Check expired session
    const expiredCheck = await prisma.chatSession.findUnique({
      where: { id: expiredGuestSession.id },
      select: { status: true, endedAt: true },
    });
    console.log(`Expired guest session status: ${expiredCheck?.status} (should be 'expired')`);

    // Check inactive session
    const inactiveCheck = await prisma.chatSession.findUnique({
      where: { id: inactiveGuestSession.id },
      select: { status: true, endedAt: true },
    });
    console.log(`Inactive guest session status: ${inactiveCheck?.status} (should be 'inactive')`);

    // Check active sessions (should remain active)
    const activeCheck1 = await prisma.chatSession.findUnique({
      where: { id: expiringSession.id },
      select: { status: true },
    });
    const activeCheck2 = await prisma.chatSession.findUnique({
      where: { id: activeSession.id },
      select: { status: true },
    });
    console.log(`Expiring session status: ${activeCheck1?.status} (should be 'active')`);
    console.log(`Active session status: ${activeCheck2?.status} (should be 'active')`);

    // Step 6: Test session extension
    console.log('\n⏰ Step 6: Testing session extension...');
    const extensionResult = await extendSessionExpiry(expiringSession.sessionId, 30);
    console.log('Extension result:', extensionResult);

    // Step 7: Get final statistics
    console.log('\n📊 Step 7: Getting final statistics...');
    const finalStats = await getSessionCleanupStatistics();
    console.log('Final session statistics:', finalStats);

    // Calculate changes
    if (initialStats && finalStats) {
      const changes = {
        expiredChange: finalStats.sessions.expired - initialStats.sessions.expired,
        inactiveChange: finalStats.sessions.inactive - initialStats.sessions.inactive,
        activeChange: finalStats.sessions.active - initialStats.sessions.active,
      };
      console.log('\n📈 Changes from cleanup:', changes);
    }

    // Cleanup test data
    console.log('\n🧽 Cleaning up test data...');
    await prisma.chatSession.deleteMany({
      where: {
        sessionId: {
          contains: 'test-'
        },
      },
    });

    console.log('\n✅ Chat Session Cleanup Test Completed Successfully!');
    console.log('================================================');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Cleanup on error
    try {
      await prisma.chatSession.deleteMany({
        where: {
          sessionId: {
            contains: 'test-'
          },
        },
      });
      console.log('🧽 Cleaned up test data after error');
    } catch (cleanupError) {
      console.error('Failed to cleanup test data:', cleanupError);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testChatSessionCleanup();
}