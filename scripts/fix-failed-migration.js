#!/usr/bin/env node

/**
 * Fix Failed Migration Script
 *
 * This script marks the failed migration as resolved in the production database.
 * It's designed to run once to fix the P3009 error on Railway.
 */

const { execSync } = require('child_process');

console.log('🔧 Migration Recovery Script');
console.log('================================\n');

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

console.log('✅ DATABASE_URL is available\n');

try {
  // Mark the failed migration as resolved
  console.log('📋 Marking failed migration as resolved...');
  execSync('npx prisma migrate resolve --applied 20251111000001_add_meta_keywords_to_product', {
    stdio: 'inherit',
    env: { ...process.env }
  });

  console.log('\n✅ Migration marked as resolved');
  console.log('✅ Database is now ready for normal migrations\n');

} catch (error) {
  console.error('❌ Failed to resolve migration:', error.message);
  process.exit(1);
}
