/**
 * Seed Chat Configuration to Production Database
 * Run with: npx tsx scripts/seed-chat-config-production.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedChatConfig() {
  console.log('🚀 Seeding chat configuration to production database...');

  const webhookUrl = 'https://general-n8n.l30n8p.easypanel.host/webhook/31852ca2-1581-4862-85df-a5f8a7499b88/chat';

  const configs = [
    { key: 'n8n_chat_webhook_url', value: webhookUrl, type: 'string' },
    { key: 'n8n_chat_enabled', value: 'true', type: 'boolean' },
    { key: 'n8n_chat_position', value: 'bottom-right', type: 'string' },
    { key: 'n8n_chat_primary_color', value: '#2563eb', type: 'string' },
    { key: 'n8n_chat_title', value: 'Chat Support', type: 'string' },
    { key: 'n8n_chat_subtitle', value: "We're here to help", type: 'string' },
    { key: 'n8n_chat_welcome_message', value: 'Hello! 👋\\nHow can I help you today?', type: 'string' },
    { key: 'n8n_chat_input_placeholder', value: 'Type your message...', type: 'string' },
  ];

  console.log('📝 Upserting configuration keys:');

  for (const config of configs) {
    console.log(`   - ${config.key}: ${config.value}`);
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      create: config,
      update: { value: config.value },
    });
  }

  console.log('✅ Chat configuration seeded successfully!');

  // Verify
  const savedConfigs = await prisma.systemConfig.findMany({
    where: {
      key: {
        startsWith: 'n8n_chat',
      },
    },
  });

  console.log('\n🔍 Verification - Configs in database:');
  savedConfigs.forEach(c => {
    console.log(`   ${c.key}: ${c.value}`);
  });

  console.log('\n✨ Done! The chat widget should now appear on your website.');
}

seedChatConfig()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
