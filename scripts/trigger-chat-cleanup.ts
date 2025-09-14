#!/usr/bin/env tsx
/**
 * Manual Chat Session Cleanup Trigger
 * Used to manually trigger chat session cleanup for testing and maintenance
 */

import { cleanupChatSessions, getSessionCleanupStatistics } from '../src/lib/chat/session-cleanup';

async function main() {
  try {
    console.log('🚀 Starting manual chat session cleanup...\n');

    // Get statistics before cleanup
    console.log('📊 Getting statistics before cleanup...');
    const statsBefore = await getSessionCleanupStatistics();
    if (statsBefore) {
      console.log('📈 Before cleanup:', {
        sessions: statsBefore.sessions,
        cleanup: statsBefore.cleanup,
        timeouts: statsBefore.timeouts
      });
    }

    console.log('\n💬 Running chat session cleanup...');

    // Trigger cleanup
    const result = await cleanupChatSessions();

    // Get statistics after cleanup
    console.log('\n📊 Getting statistics after cleanup...');
    const statsAfter = await getSessionCleanupStatistics();
    if (statsAfter) {
      console.log('📈 After cleanup:', {
        sessions: statsAfter.sessions,
        cleanup: statsAfter.cleanup,
        timeouts: statsAfter.timeouts
      });
    }

    console.log('\n✅ Chat session cleanup completed successfully!');
    console.log(`📋 Summary: ${result.expiredCount} expired, ${result.inactiveCount} inactive sessions processed`);

  } catch (error) {
    console.error('❌ Chat session cleanup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}