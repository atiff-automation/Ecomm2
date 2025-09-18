const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateChatConfig() {
  try {
    // Update the configuration to be healthy
    const updatedConfig = await prisma.chatConfig.updateMany({
      where: { isActive: true },
      data: {
        verified: true,
        healthStatus: 'HEALTHY',
        webhookUrl: 'http://localhost:3001/webhook/chat-integration',
        lastHealthCheck: new Date()
      }
    });

    console.log('✅ Chat configuration updated successfully!');
    console.log('Updated records:', updatedConfig.count);
    
    // Show current config
    const config = await prisma.chatConfig.findFirst({
      where: { isActive: true }
    });
    
    console.log('\n📊 Current Configuration:');
    console.log('- Active:', config?.isActive);
    console.log('- Verified:', config?.verified);
    console.log('- Health Status:', config?.healthStatus);
    console.log('- Webhook URL:', config?.webhookUrl);
    
  } catch (error) {
    console.error('❌ Error updating chat configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateChatConfig();