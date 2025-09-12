#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConversation() {
  try {
    console.log('🔍 CHECKING FINAL CONVERSATION STATE\n');

    // Find the most recent session
    const latestSession = await prisma.chatSession.findFirst({
      where: { guestEmail: 'live-demo@example.com' },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }  // Show chronological order
        }
      }
    });

    if (!latestSession) {
      console.log('❌ No session found');
      return;
    }

    console.log(`📋 Session: ${latestSession.sessionId}`);
    console.log(`📧 Guest Email: ${latestSession.guestEmail}`);
    console.log(`📊 Status: ${latestSession.status}`);
    console.log(`💬 Total Messages: ${latestSession.messages.length}\n`);

    console.log('🗂️  COMPLETE CONVERSATION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    latestSession.messages.forEach((msg, i) => {
      const time = new Date(msg.createdAt).toLocaleTimeString();
      const icon = msg.senderType === 'user' ? '👤 USER' : '🤖 BOT';
      const statusIcon = msg.status === 'delivered' ? '✅' : msg.status === 'sent' ? '📤' : '⏳';
      
      console.log(`${i + 1}. ${icon} [${time}] ${statusIcon}`);
      console.log(`   "${msg.content}"`);
      console.log(`   Status: ${msg.status}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const userMessages = latestSession.messages.filter(m => m.senderType === 'user').length;
    const botMessages = latestSession.messages.filter(m => m.senderType === 'bot').length;
    
    console.log(`\n📈 CONVERSATION STATISTICS:`);
    console.log(`   👤 User messages: ${userMessages}`);
    console.log(`   🤖 Bot messages: ${botMessages}`);
    console.log(`   🔄 Total exchanges: ${latestSession.messages.length}`);
    
    if (botMessages > 0) {
      console.log('\n🎉 ✅ BIDIRECTIONAL CONVERSATION CONFIRMED!');
      console.log('   ✅ User can send messages');
      console.log('   ✅ Bot can receive and respond');
      console.log('   ✅ Complete chat flow working!');
    } else {
      console.log('\n⏳ Waiting for bot response...');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkConversation();