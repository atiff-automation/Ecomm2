/**
 * Telegram Configuration Migration Script - Malaysian E-commerce Platform
 * Migrate from .env configuration to centralized database configuration
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH | CENTRALIZED
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

/**
 * SINGLE SOURCE OF TRUTH: Migration script following @CLAUDE.md principles
 */
async function migrateTelegramConfiguration() {
  console.log('🔄 Starting Telegram configuration migration...');
  console.log('📋 Following @CLAUDE.md: NO HARDCODE | DRY | CENTRALIZED\n');

  try {
    // CENTRALIZED: Check if migration is needed
    const existingConfig = await prisma.adminTelegramConfig.findFirst({
      where: { isActive: true }
    });

    if (existingConfig) {
      console.log('✅ Active admin telegram configuration already exists:');
      console.log(`   - Config ID: ${existingConfig.id}`);
      console.log(`   - Orders enabled: ${existingConfig.ordersEnabled}`);
      console.log(`   - Inventory enabled: ${existingConfig.inventoryEnabled}`);
      console.log(`   - Created: ${existingConfig.createdAt.toISOString()}`);
      console.log('\n🎯 Migration not needed - configuration already centralized');
      return;
    }

    // NO HARDCODE: Get configuration from environment variables
    const envBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const envOrdersChatId = process.env.TELEGRAM_ORDERS_CHAT_ID;
    const envInventoryChatId = process.env.TELEGRAM_INVENTORY_CHAT_ID;

    if (!envBotToken || !envOrdersChatId) {
      console.log('⚠️  No .env telegram configuration found to migrate');
      console.log('   Required: TELEGRAM_BOT_TOKEN and TELEGRAM_ORDERS_CHAT_ID');
      console.log('   Found:');
      console.log(`   - TELEGRAM_BOT_TOKEN: ${envBotToken ? '✅ Set' : '❌ Missing'}`);
      console.log(`   - TELEGRAM_ORDERS_CHAT_ID: ${envOrdersChatId ? '✅ Set' : '❌ Missing'}`);
      console.log(`   - TELEGRAM_INVENTORY_CHAT_ID: ${envInventoryChatId ? '✅ Set' : '⚠️  Optional'}`);
      console.log('\n💡 You can configure telegram notifications via admin UI at /admin/notifications/configuration');
      return;
    }

    // CENTRALIZED: Find or create system admin user for migration
    let systemAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!systemAdmin) {
      console.log('❌ No admin user found for migration');
      console.log('   Please create an admin user first before running migration');
      return;
    }

    console.log('📊 Migration source data:');
    console.log(`   - Bot Token: ${envBotToken.substring(0, 10)}...`);
    console.log(`   - Orders Chat ID: ${envOrdersChatId}`);
    console.log(`   - Inventory Chat ID: ${envInventoryChatId || 'Not configured'}`);
    console.log(`   - System Admin: ${systemAdmin.firstName} ${systemAdmin.lastName} (${systemAdmin.email})\n`);

    // SINGLE SOURCE OF TRUTH: Create centralized configuration
    const newConfig = await prisma.adminTelegramConfig.create({
      data: {
        botToken: envBotToken,
        ordersChatId: envOrdersChatId,
        inventoryChatId: envInventoryChatId || null,
        ordersEnabled: true,
        inventoryEnabled: !!envInventoryChatId,
        dailySummaryEnabled: true,
        timezone: 'Asia/Kuala_Lumpur',
        isActive: true,
        createdBy: systemAdmin.id,
        updatedBy: systemAdmin.id
      }
    });

    console.log('✅ Migration completed successfully!');
    console.log(`   - New config ID: ${newConfig.id}`);
    console.log(`   - Orders notifications: ${newConfig.ordersEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   - Inventory notifications: ${newConfig.inventoryEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   - Daily summary: ${newConfig.dailySummaryEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   - Timezone: ${newConfig.timezone}`);
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Test your configuration at /admin/notifications/configuration');
    console.log('   2. Send test notifications to verify everything works');
    console.log('   3. Consider removing .env variables after confirming everything works');
    console.log('   4. The system will automatically use database config over .env\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('   Please check your database connection and try again');
    process.exit(1);
  }
}

/**
 * DRY: Test migrated configuration
 */
async function testMigratedConfiguration() {
  console.log('🧪 Testing migrated configuration...\n');

  try {
    const activeConfig = await prisma.adminTelegramConfig.findFirst({
      where: { isActive: true },
      include: {
        creator: { select: { firstName: true, lastName: true, email: true } },
        updater: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    if (!activeConfig) {
      console.log('❌ No active telegram configuration found');
      return false;
    }

    console.log('📋 Active Configuration:');
    console.log(`   - ID: ${activeConfig.id}`);
    console.log(`   - Bot Token: ${activeConfig.botToken.substring(0, 10)}...`);
    console.log(`   - Orders Chat: ${activeConfig.ordersChatId}`);
    console.log(`   - Inventory Chat: ${activeConfig.inventoryChatId || 'Not configured'}`);
    console.log(`   - Created by: ${activeConfig.creator?.firstName} ${activeConfig.creator?.lastName}`);
    console.log(`   - Updated: ${activeConfig.updatedAt.toISOString()}\n`);

    // NO HARDCODE: Test bot token validity
    console.log('🔐 Testing bot token...');
    try {
      const response = await fetch(`https://api.telegram.org/bot${activeConfig.botToken}/getMe`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const botInfo = await response.json();
        console.log(`   ✅ Bot token valid - Connected to: @${botInfo.result.username}`);
      } else {
        console.log('   ❌ Bot token invalid or bot not accessible');
        return false;
      }
    } catch (error) {
      console.log('   ❌ Failed to test bot token:', error.message);
      return false;
    }

    console.log('\n✅ Configuration test passed!');
    console.log('   Your telegram notifications should work correctly');
    return true;

  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    return false;
  }
}

/**
 * CENTRALIZED: Main migration function
 */
async function main() {
  console.log('🚀 JRM E-commerce Telegram Configuration Migration');
  console.log('   SYSTEMATIC migration following @CLAUDE.md principles\n');

  try {
    await migrateTelegramConfiguration();
    await testMigratedConfiguration();
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Migration process completed!');
  console.log('   Visit /admin/notifications/configuration to manage your settings');
}

// DRY: Run migration if called directly
if (require.main === module) {
  main().catch(console.error);
}