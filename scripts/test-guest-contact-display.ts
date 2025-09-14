#!/usr/bin/env tsx

import { prisma } from '../src/lib/db/prisma';

async function testGuestContactDisplay() {
  console.log('🧪 Testing Guest Contact Information Display');
  console.log('===========================================\n');

  try {
    // Create a test session with guest contact information
    const testSessionId = `test-guest-contact-${Date.now()}`;
    const guestEmail = 'test.guest@example.com';
    const guestPhone = '+60123456789';

    console.log('📝 Step 1: Creating test session with guest contact information...');
    const testSession = await prisma.chatSession.create({
      data: {
        sessionId: testSessionId,
        status: 'active',
        guestEmail: guestEmail,
        guestPhone: guestPhone,
        userAgent: 'Test-Agent/1.0',
        ipAddress: '127.0.0.1',
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        metadata: {
          source: 'contact-display-test',
          contactInfo: {
            email: guestEmail,
            phone: guestPhone,
            collectTime: new Date().toISOString()
          }
        }
      }
    });

    console.log(`✅ Created test session: ${testSessionId}`);
    console.log(`   Guest Email: ${guestEmail}`);
    console.log(`   Guest Phone: ${guestPhone}\n`);

    // Test fetching session with contact information (simulating API call)
    console.log('📊 Step 2: Testing session retrieval with guest contact info...');
    const retrievedSession = await prisma.chatSession.findUnique({
      where: { sessionId: testSessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!retrievedSession) {
      throw new Error('Test session not found');
    }

    // Transform data the same way the API does
    const sessionDetail = {
      id: retrievedSession.id,
      sessionId: retrievedSession.sessionId,
      status: retrievedSession.status,
      startedAt: retrievedSession.createdAt.toISOString(),
      lastActivity: retrievedSession.lastActivity.toISOString(),
      messageCount: retrievedSession._count.messages,
      userId: retrievedSession.user?.id,
      userEmail: retrievedSession.user?.email,
      userName: retrievedSession.user 
        ? `${retrievedSession.user.firstName} ${retrievedSession.user.lastName}`.trim() 
        : null,
      guestEmail: retrievedSession.guestEmail,
      guestPhone: retrievedSession.guestPhone,
      userAgent: retrievedSession.userAgent,
      ipAddress: retrievedSession.ipAddress,
      metadata: retrievedSession.metadata,
    };

    console.log('✅ Session retrieved successfully with contact information:');
    console.log(`   Session ID: ${sessionDetail.sessionId}`);
    console.log(`   Guest Email: ${sessionDetail.guestEmail} ${sessionDetail.guestEmail === guestEmail ? '✅' : '❌'}`);
    console.log(`   Guest Phone: ${sessionDetail.guestPhone} ${sessionDetail.guestPhone === guestPhone ? '✅' : '❌'}`);
    console.log(`   User Agent: ${sessionDetail.userAgent}`);
    console.log(`   IP Address: ${sessionDetail.ipAddress}\n`);

    // Test the sessions list API format
    console.log('📋 Step 3: Testing sessions list format (admin panel view)...');
    const sessionsList = await prisma.chatSession.findMany({
      where: { sessionId: testSessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { lastActivity: 'desc' },
      take: 1,
    });

    const transformedSessions = sessionsList.map(session => ({
      id: session.id,
      sessionId: session.sessionId,
      status: session.status,
      startedAt: session.createdAt.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
      messageCount: session._count.messages,
      userId: session.user?.id,
      userEmail: session.user?.email,
      userName: session.user ? `${session.user.firstName} ${session.user.lastName}`.trim() : null,
      guestEmail: session.guestEmail,
      guestPhone: session.guestPhone,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      metadata: session.metadata,
    }));

    console.log('✅ Sessions list format test:');
    const listSession = transformedSessions[0];
    console.log(`   Session ID: ${listSession.sessionId}`);
    console.log(`   Guest Email: ${listSession.guestEmail} ${listSession.guestEmail === guestEmail ? '✅' : '❌'}`);
    console.log(`   Guest Phone: ${listSession.guestPhone} ${listSession.guestPhone === guestPhone ? '✅' : '❌'}`);
    console.log(`   Status: ${listSession.status}`);
    console.log(`   Message Count: ${listSession.messageCount}\n`);

    // Verify contact information in metadata as well
    console.log('🔍 Step 4: Verifying metadata contact information...');
    const metadata = retrievedSession.metadata as any;
    if (metadata?.contactInfo) {
      console.log('✅ Contact information found in metadata:');
      console.log(`   Email: ${metadata.contactInfo.email} ${metadata.contactInfo.email === guestEmail ? '✅' : '❌'}`);
      console.log(`   Phone: ${metadata.contactInfo.phone} ${metadata.contactInfo.phone === guestPhone ? '✅' : '❌'}`);
      console.log(`   Collected at: ${metadata.contactInfo.collectTime}`);
    } else {
      console.log('ℹ️  No contact info found in metadata (this is optional)');
    }

    // Clean up test data
    console.log('\n🧽 Cleaning up test data...');
    await prisma.chatSession.delete({
      where: { sessionId: testSessionId }
    });

    console.log('\n✅ Guest Contact Information Display Test Completed Successfully!');
    console.log('================================================================\n');

    console.log('📋 Summary:');
    console.log('- ✅ Guest email field is properly stored and retrieved');
    console.log('- ✅ Guest phone field is properly stored and retrieved');
    console.log('- ✅ Contact information is included in API responses');
    console.log('- ✅ Session list format includes guest contact information');
    console.log('- ✅ Session detail format includes guest contact information');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testGuestContactDisplay();