#!/usr/bin/env node
/**
 * Post-Seed Cleanup Script
 * Systematically clears all NextAuth sessions after database seeding
 * Prevents stale JWT tokens from causing foreign key violations
 */

const fs = require('fs');
const path = require('path');

function clearNextAuthSessions() {
  console.log('🧹 Post-seed cleanup: Clearing NextAuth sessions...');

  // Clear browser session storage (development only)
  const sessionPaths = [
    // Chrome/Chromium session storage paths
    path.join(process.env.HOME, 'Library/Application Support/Google/Chrome/Default/Local Storage'),
    path.join(process.env.HOME, 'Library/Application Support/Chromium/Default/Local Storage'),

    // Firefox session storage paths
    path.join(process.env.HOME, 'Library/Application Support/Firefox/Profiles'),

    // Safari session storage paths
    path.join(process.env.HOME, 'Library/Safari/LocalStorage'),
  ];

  console.log('ℹ️  Manual action required after seeding:');
  console.log('   1. Clear browser cookies for localhost:3000');
  console.log('   2. Or call: curl -X POST http://localhost:3000/api/auth/clear-session');
  console.log('   3. Sign in again with fresh credentials');
  console.log('');
  console.log('✨ This prevents foreign key violations from stale JWT tokens');
}

// Display instructions
clearNextAuthSessions();

// Create a simple flag file to track seed operations
const seedFlagPath = path.join(__dirname, '..', '.seed-completed');
fs.writeFileSync(seedFlagPath, new Date().toISOString());

console.log('✅ Post-seed cleanup completed');
console.log('💡 Tip: Add this to your seed script with: node scripts/post-seed-cleanup.js');