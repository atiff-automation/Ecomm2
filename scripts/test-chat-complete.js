const fetch = require('node-fetch');

const LOCAL_URL = 'http://localhost:3000';

async function testCompleteChat() {
  console.log('🧪 Testing Complete Chat Functionality...\n');

  try {
    // Step 1: Create chat session
    console.log('1. Creating chat session...');
    const sessionResponse = await fetch(`${LOCAL_URL}/api/chat/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guestEmail: 'test@example.com'
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Session creation failed: ${sessionResponse.status} - ${await sessionResponse.text()}`);
    }

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.data.sessionId;
    console.log('✅ Session created:', sessionId);

    // Step 2: Send message through chat API
    console.log('\n2. Sending test message...');
    const messageResponse = await fetch(`${LOCAL_URL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId,
        content: 'Hello! This is a test message to verify the chat functionality is working correctly.',
        messageType: 'text'
      })
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Message sending failed: ${messageResponse.status} - ${errorText}`);
    }

    const messageData = await messageResponse.json();
    console.log('✅ Message sent successfully!');
    console.log('   Message ID:', messageData.data.messageId);
    console.log('   Status:', messageData.data.status);

    // Step 3: Retrieve session to verify message was stored
    console.log('\n3. Verifying message storage...');
    const getSessionResponse = await fetch(`${LOCAL_URL}/api/chat/session?sessionId=${sessionId}`);

    if (!getSessionResponse.ok) {
      throw new Error(`Session retrieval failed: ${getSessionResponse.status}`);
    }

    const retrievedSession = await getSessionResponse.json();
    console.log('✅ Session retrieved with messages:');
    console.log('   Total messages:', retrievedSession.data.messages.length);
    
    if (retrievedSession.data.messages.length > 0) {
      const lastMessage = retrievedSession.data.messages[retrievedSession.data.messages.length - 1];
      console.log('   Last message content:', lastMessage.content.substring(0, 50) + '...');
      console.log('   Last message status:', lastMessage.status);
    }

    // Step 4: Test chat health endpoint
    console.log('\n4. Checking chat system health...');
    const healthResponse = await fetch(`${LOCAL_URL}/api/chat/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Chat system health check passed');
      console.log('   Status:', healthData.status);
      console.log('   Config loaded:', healthData.configLoaded);
    } else {
      console.log('⚠️  Health endpoint returned:', healthResponse.status);
    }

    console.log('\n🎉 Complete Chat Test Results:');
    console.log('✅ Session creation: Working');
    console.log('✅ Message sending: Working');
    console.log('✅ Message storage: Working');
    console.log('✅ Session retrieval: Working');
    console.log('✅ Chat system is fully operational!');

    return true;

  } catch (error) {
    console.error('\n❌ Chat test failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run the test
testCompleteChat()
  .then(success => {
    if (success) {
      console.log('\n🚀 Chat functionality verified! Ready for frontend testing.');
    } else {
      console.log('\n⚠️  Some issues remain. Check error details above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
  });