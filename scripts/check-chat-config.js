#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking current chat configuration...\n');
    
    const configs = await prisma.chatConfig.findMany({
      select: {
        id: true,
        webhookUrl: true,
        webhookSecret: true,
        isActive: true,
        verified: true,
        healthStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${configs.length} chat configurations:`);
    
    configs.forEach((config, index) => {
      console.log(`\n--- Config ${index + 1} ---`);
      console.log(`ID: ${config.id}`);
      console.log(`Webhook URL: ${config.webhookUrl ? 'SET' : 'NULL'}`);
      console.log(`Webhook Secret: ${config.webhookSecret ? 'SET' : 'NULL'}`);
      console.log(`Is Active: ${config.isActive}`);
      console.log(`Verified: ${config.verified}`);
      console.log(`Health Status: ${config.healthStatus}`);
      console.log(`Created: ${config.createdAt}`);
    });

    // Check health
    console.log('\n🏥 Health Check Analysis:');
    const activeConfig = configs.find(c => c.isActive);
    
    if (!activeConfig) {
      console.log('❌ No active configuration found');
    } else {
      console.log('✅ Active configuration found');
      const isHealthy = activeConfig.isActive && 
                       activeConfig.verified && 
                       activeConfig.webhookUrl !== null && 
                       activeConfig.healthStatus === 'HEALTHY';
      
      console.log(`Overall Health Status: ${isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
      
      if (!isHealthy) {
        console.log('\n🔧 Issues to fix:');
        if (!activeConfig.isActive) console.log('- isActive is false');
        if (!activeConfig.verified) console.log('- verified is false');
        if (!activeConfig.webhookUrl) console.log('- webhookUrl is null');
        if (activeConfig.healthStatus !== 'HEALTHY') console.log(`- healthStatus is '${activeConfig.healthStatus}' (should be 'HEALTHY')`);
      }
    }

  } catch (error) {
    console.error('Error checking chat configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();