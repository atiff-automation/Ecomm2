#!/usr/bin/env node

/**
 * Simple n8n Integration Test Script
 * Tests the complete chat flow: send message -> n8n processing -> response
 */

const BASE_URL = 'http://localhost:3000'; // Change to your domain

async function testChatFlow() {
  console.log('🚀 Testing n8n Chat Integration...\n');

  try {
    // Step 1: Initialize chat session
    console.log('1. Creating chat session...');
    const initResponse = await fetch(`${BASE_URL}/api/chat/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userType: 'guest',
        guestEmail: 'test@example.com'
      })
    });

    if (!initResponse.ok) {
      throw new Error(`Failed to create session: ${initResponse.status}`);
    }

    const { sessionId } = await initResponse.json();
    console.log(`✅ Session created: ${sessionId}\n`);

    // Step 2: Send test message
    console.log('2. Sending test message...');
    const sendResponse = await fetch(`${BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        content: 'Hello! I need help with my order.',
        messageType: 'text'
      })
    });

    if (!sendResponse.ok) {
      throw new Error(`Failed to send message: ${sendResponse.status}`);
    }

    const sendResult = await sendResponse.json();
    console.log(`✅ Message sent: ${sendResult.messageId}\n`);

    // Step 3: Wait for n8n response and poll for bot reply
    console.log('3. Waiting for n8n response...');
    let attempts = 0;
    let botResponse = null;

    while (attempts < 10 && !botResponse) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const messagesResponse = await fetch(`${BASE_URL}/api/chat/messages/${sessionId}`);
      if (messagesResponse.ok) {
        const messages = await messagesResponse.json();
        botResponse = messages.find(msg =>
          msg.senderType === 'bot' &&
          msg.createdAt > sendResult.timestamp
        );
      }

      if (!botResponse) {
        console.log(`   Attempt ${attempts}/10 - No bot response yet...`);
      }
    }

    if (botResponse) {
      console.log('✅ Bot Response Received:');
      console.log(`   Content: "${botResponse.content}"`);
      console.log(`   Type: ${botResponse.messageType}`);
      if (botResponse.metadata?.quickReplies) {
        console.log(`   Quick Replies: ${botResponse.metadata.quickReplies.join(', ')}`);
      }
      console.log(`   Timestamp: ${botResponse.createdAt}\n`);
    } else {
      console.log('❌ No bot response received after 20 seconds\n');
    }

    // Step 4: Test different message types
    console.log('4. Testing context-aware responses...');

    const testMessages = [
      'Hi there!',
      'I want to check my order status',
      'Show me some products'
    ];

    for (const message of testMessages) {
      console.log(`   Testing: "${message}"`);

      const response = await fetch(`${BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          content: message,
          messageType: 'text'
        })
      });

      if (response.ok) {
        console.log(`   ✅ Sent successfully`);
      } else {
        console.log(`   ❌ Failed to send`);
      }
    }

    console.log('\n🎉 Integration test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check your n8n workflow execution logs');
    console.log('2. View chat session in admin panel: /admin/chat/sessions');
    console.log('3. Test with different user contexts (authenticated vs guest)');
    console.log('4. Monitor webhook delivery in admin panel');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your server is running on the correct port');
    console.log('2. Check n8n webhook URL configuration in admin panel');
    console.log('3. Verify webhook secret and API key are set');
    console.log('4. Check n8n workflow is active and accessible');
  }
}

// Run the test
testChatFlow();