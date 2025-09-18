#!/usr/bin/env tsx

/**
 * Session Cleanup Script
 * Manually run session cleanup to expire old inactive sessions
 */

import { cleanupChatSessions } from '../src/lib/chat/session-cleanup';

async function main() {
  console.log('🧹 Starting session cleanup...');

  try {
    const result = await cleanupChatSessions();

    console.log('✅ Session cleanup completed:');
    console.log(`   - Expired sessions: ${result.expiredCount}`);
    console.log(`   - Inactive sessions: ${result.inactiveCount}`);

    if (result.error) {
      console.error('⚠️  Cleanup completed with errors:', result.error);
    }

  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
    process.exit(1);
  }
}

main();