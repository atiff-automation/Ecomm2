const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupChatConfig() {
  try {
    // Check if config already exists
    const existingConfig = await prisma.chatConfig.findFirst({
      where: { isActive: true }
    });

    if (existingConfig) {
      console.log('✅ Chat configuration already exists');
      console.log('Webhook URL:', existingConfig.webhookUrl);
      return;
    }

    // Create default configuration
    const config = await prisma.chatConfig.create({
      data: {
        webhookUrl: 'http://localhost:3001/webhook/chat-integration',
        webhookSecret: 'temp-secret-' + Math.random().toString(36).substr(2, 9),
        sessionTimeoutMinutes: 30,
        guestSessionTimeoutMinutes: 13,
        authenticatedSessionTimeoutMinutes: 19,
        maxMessageLength: 4000,
        rateLimitMessages: 20,
        rateLimitWindowMs: 60000,
        queueEnabled: true,
        queueMaxRetries: 3,
        queueRetryDelayMs: 5000,
        queueBatchSize: 10,
        welcomeMessage: 'Hi! How can we help you today?',
        agentName: 'Customer Support',
        isActive: true,
        verified: false,
        healthStatus: 'NOT_CONFIGURED'
      }
    });

    console.log('✅ Chat configuration created successfully!');
    console.log('Configuration ID:', config.id);
    console.log('Webhook Secret:', config.webhookSecret);
    console.log('🔧 Please update the webhook URL in the admin panel at /admin/chat/config');
  } catch (error) {
    console.error('❌ Error creating chat configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupChatConfig();