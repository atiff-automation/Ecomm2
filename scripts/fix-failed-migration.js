#!/usr/bin/env node

/**
 * Manual Migration Resolution Script
 *
 * IMPORTANT: Only run this after investigating the failed migration!
 * This script helps resolve failed migrations that were already applied to the database.
 *
 * Usage:
 *   Local:   node scripts/fix-failed-migration.js
 *   Railway: railway run node scripts/fix-failed-migration.js
 *
 * Safety Checks:
 * 1. Shows migration status first
 * 2. Lists all failed migrations
 * 3. Requires manual confirmation before resolving
 */

const { execSync } = require('child_process');
const readline = require('readline');

console.log('🔧 Manual Migration Resolution Script');
console.log('======================================\n');

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  console.error('💡 For Railway: railway run node scripts/fix-failed-migration.js');
  process.exit(1);
}

console.log('✅ DATABASE_URL is available\n');

async function resolveMigration() {
  try {
    // Step 1: Show current migration status
    console.log('📋 Step 1: Checking migration status...\n');
    const statusOutput = execSync('npx prisma migrate status', {
      encoding: 'utf-8',
      env: { ...process.env }
    });

    console.log(statusOutput);
    console.log('');

    // Step 2: Extract failed migrations
    const failedMigrations = [];
    const failedMatches = statusOutput.matchAll(/`([^`]+)`\s+migration.*failed/gi);

    for (const match of failedMatches) {
      failedMigrations.push(match[1]);
    }

    if (failedMigrations.length === 0) {
      console.log('✅ No failed migrations found!');
      console.log('ℹ️  Your database migration state is clean.');
      process.exit(0);
    }

    console.log(`⚠️  Found ${failedMigrations.length} failed migration(s):\n`);
    failedMigrations.forEach((name, i) => {
      console.log(`   ${i + 1}. ${name}`);
    });
    console.log('');

    // Step 3: Safety warning and confirmation
    console.log('⚠️  SAFETY WARNING:');
    console.log('   Before resolving, verify that the migration was actually applied!');
    console.log('');
    console.log('   To check, run: railway run npx prisma db pull');
    console.log('   Then compare the schema with your prisma/schema.prisma');
    console.log('');

    // If running in non-interactive mode (Railway), require explicit env var
    if (!process.stdin.isTTY) {
      if (process.env.CONFIRM_MIGRATION_RESOLVE !== 'yes') {
        console.error('❌ Running in non-interactive mode without confirmation');
        console.error('💡 Set CONFIRM_MIGRATION_RESOLVE=yes to proceed');
        console.error('   Example: CONFIRM_MIGRATION_RESOLVE=yes railway run node scripts/fix-failed-migration.js');
        process.exit(1);
      }
      console.log('✅ Confirmation received via CONFIRM_MIGRATION_RESOLVE=yes\n');
      await resolveAllMigrations(failedMigrations);
      return;
    }

    // Interactive confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Have you verified the migration was applied? (yes/no): ', (answer) => {
      if (answer.toLowerCase() === 'yes') {
        console.log('');
        resolveAllMigrations(failedMigrations).then(() => {
          rl.close();
        });
      } else {
        console.log('\n❌ Resolution cancelled. Investigate the migration first.');
        rl.close();
        process.exit(0);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function resolveAllMigrations(migrations) {
  console.log('🔧 Resolving failed migrations...\n');

  for (const migration of migrations) {
    try {
      console.log(`   ⏳ Resolving: ${migration}`);
      execSync(`npx prisma migrate resolve --applied ${migration}`, {
        stdio: 'inherit',
        env: { ...process.env }
      });
      console.log(`   ✅ Resolved: ${migration}\n`);
    } catch (error) {
      console.error(`   ❌ Failed to resolve: ${migration}`);
      console.error(`   Error: ${error.message}\n`);
    }
  }

  console.log('✅ Migration resolution complete!');
  console.log('ℹ️  Redeploy your application to continue.\n');
}

resolveMigration();
