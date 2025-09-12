#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('📨 Checking recent chat messages...\n');

    // Get recent messages from the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        createdAt: {
          gte: fiveMinutesAgo
        }
      },
      include: {
        session: {
          select: {
            sessionId: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`Found ${recentMessages.length} recent messages (last 5 minutes):`);
    
    recentMessages.forEach((message, index) => {
      console.log(`\n--- Message ${index + 1} ---`);
      console.log(`Message ID: ${message.id}`);
      console.log(`Session ID: ${message.session.sessionId}`);
      console.log(`Sender: ${message.senderType.toUpperCase()}`);
      console.log(`Content: "${message.content}"`);
      console.log(`Status: ${message.status}`);
      console.log(`Created: ${message.createdAt}`);
      console.log(`Webhook Attempts: ${message.webhookAttempts}`);
    });

    // Check webhook queue status for recent messages
    console.log('\n🔄 Checking webhook queue status...');
    const recentWebhooks = await prisma.chatWebhookQueue.findMany({
      where: {
        createdAt: {
          gte: fiveMinutesAgo
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`Found ${recentWebhooks.length} recent webhook queue items:`);
    recentWebhooks.forEach((webhook, index) => {
      console.log(`${index + 1}. Message ${webhook.messageId}: ${webhook.status} (${webhook.attempts}/${webhook.maxAttempts})`);
    });

  } catch (error) {
    console.error('Error checking recent messages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();