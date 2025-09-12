#!/usr/bin/env node

/**
 * Mock n8n Webhook Server for Local Testing
 * Simulates n8n Cloud webhook behavior
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = 3001; // Different port from main app

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Webhook endpoint that simulates n8n Cloud
app.post('/webhook/chat-integration', (req, res) => {
  console.log('\n🎯 Mock n8n Webhook Received');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  
  // Simulate signature verification
  const signature = req.headers['x-webhook-signature'];
  if (signature) {
    console.log('✅ Webhook signature present:', signature);
  } else {
    console.log('⚠️  No webhook signature found');
  }
  
  // Simulate processing delay
  setTimeout(() => {
    console.log('🚀 Sending mock response back to chat system...');
    
    // Send response back to the chat system
    fetch('http://localhost:3000/api/chat/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature || 'mock-signature'
      },
      body: JSON.stringify({
        sessionId: req.body.sessionId,
        messageId: req.body.messageId,
        response: {
          content: `🤖 Mock n8n Response: I received your message "${req.body.message.content}" and processed it successfully!`,
          type: 'text',
          timestamp: new Date().toISOString()
        },
        metadata: {
          source: 'mock-n8n',
          processingTime: Math.random() * 1000,
          processed: true
        }
      })
    })
    .then(response => {
      console.log('✅ Response sent to chat system:', response.status);
    })
    .catch(error => {
      console.error('❌ Failed to send response:', error.message);
    });
    
  }, 500 + Math.random() * 1500); // Random delay 0.5-2s
  
  // Acknowledge receipt
  res.status(200).json({
    success: true,
    message: 'Webhook received by mock n8n',
    sessionId: req.body.sessionId,
    messageId: req.body.messageId,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mock-n8n-webhook',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Mock n8n Webhook Server running on port ${PORT}`);
  console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook/chat-integration`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('\n📝 Instructions:');
  console.log('1. Configure chat admin with: http://localhost:3001/webhook/chat-integration');
  console.log('2. Test chat at: http://localhost:3000/test-chat');
  console.log('3. Watch this console for webhook activity\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Mock n8n webhook server shutting down...');
  process.exit(0);
});