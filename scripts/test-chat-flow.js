const fetch = require('node-fetch');

async function testChatFlow() {
  console.log('🚀 Testing Chat Flow...\n');
  
  try {
    // Step 1: Create a chat session
    console.log('1️⃣ Creating chat session...');
    const sessionResponse = await fetch('http://localhost:3000/api/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestEmail: 'test@example.com',
        metadata: { source: 'test' }
      })
    });
    
    const sessionData = await sessionResponse.json();
    if (!sessionData.success) {
      throw new Error('Failed to create session: ' + JSON.stringify(sessionData));
    }
    
    const sessionId = sessionData.data.sessionId;
    console.log('✅ Session created:', sessionId);
    
    // Step 2: Send a test message
    console.log('\n2️⃣ Sending test message...');
    const messageResponse = await fetch('http://localhost:3000/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        content: 'Hello, this is a test message!',
        messageType: 'text'
      })
    });
    
    const messageData = await messageResponse.json();
    console.log('📤 Message response:', JSON.stringify(messageData, null, 2));
    
    if (messageData.success) {
      console.log('✅ Message sent successfully!');
      console.log('💬 User message saved with ID:', messageData.data.userMessage.id);
    } else {
      console.log('❌ Message failed:', messageData.error);
    }
    
    // Step 3: Check messages in session
    console.log('\n3️⃣ Retrieving session messages...');
    const messagesResponse = await fetch(`http://localhost:3000/api/chat/messages/${sessionId}`);
    const messagesData = await messagesResponse.json();
    
    if (messagesData.success) {
      console.log('💭 Messages in session:');
      messagesData.data.messages.forEach(msg => {
        console.log(`  ${msg.senderType}: ${msg.content} (${msg.createdAt})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChatFlow();