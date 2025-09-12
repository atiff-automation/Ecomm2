#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Fixing chat system health status...\n');
    
    const result = await prisma.chatConfig.updateMany({
      where: {
        isActive: true
      },
      data: {
        healthStatus: 'HEALTHY'
      }
    });

    console.log(`✅ Updated ${result.count} chat configuration(s) to HEALTHY status`);
    
    // Verify the change
    const configs = await prisma.chatConfig.findMany({
      where: { isActive: true },
      select: {
        id: true,
        healthStatus: true,
        isActive: true,
        verified: true,
        webhookUrl: true
      }
    });

    console.log('\n📊 Current active configuration status:');
    configs.forEach(config => {
      const isHealthy = config.isActive && 
                       config.verified && 
                       config.webhookUrl !== null && 
                       config.healthStatus === 'HEALTHY';
      
      console.log(`- Config ${config.id}: ${isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'} (${config.healthStatus})`);
    });

  } catch (error) {
    console.error('Error fixing chat health status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();