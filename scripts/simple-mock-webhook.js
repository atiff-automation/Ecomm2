#!/usr/bin/env node

/**
 * Simple Mock n8n Webhook Server for Local Testing
 * Uses Node.js built-in HTTP module only
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');

const PORT = 3001;

// This should match CHAT_WEBHOOK_SECRET in .env
const WEBHOOK_SECRET = 'chat-webhook-secret-2024-secure-key-for-n8n-integration';

// Function to generate proper HMAC signature for webhook responses
function generateWebhookSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

const server = http.createServer(async (req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Signature');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Health check endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'mock-n8n-webhook',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }
  
  // Webhook endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/webhook/chat-integration') {
    let body = '';
    
    // Collect request body
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        
        console.log('\n🎯 Mock n8n Webhook Received');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        const signature = req.headers['x-webhook-signature'];
        if (signature) {
          console.log('✅ Webhook signature present:', signature);
        } else {
          console.log('⚠️  No webhook signature found');
        }
        
        // Acknowledge receipt immediately
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Webhook received by mock n8n',
          sessionId: payload.sessionId,
          messageId: payload.messageId,
          timestamp: new Date().toISOString()
        }));
        
        // Only send chat responses for actual chat messages (not health checks)
        if (payload.messageId && payload.message && payload.message.content) {
          // Simulate processing delay and send response back
          setTimeout(async () => {
            console.log('🚀 Sending mock response back to chat system...');
            
            const responsePayload = JSON.stringify({
              sessionId: payload.sessionId, // Use the same sessionId (CUID format)
              response: {
                content: `🤖 Mock n8n Response: I received your message "${payload.message.content}" and processed it successfully!`,
                type: 'text'
              },
              metadata: {
                source: 'mock-n8n',
                processingTime: Math.random() * 1000,
                processed: true
              }
            });
          
          // Send response back to chat system
          const postData = Buffer.from(responsePayload, 'utf8');
          
          // Generate proper HMAC signature for the response
          const responseSignature = 'sha256=' + generateWebhookSignature(responsePayload, WEBHOOK_SECRET);
          console.log('📝 Generated response signature:', responseSignature);
          
          const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/chat/webhook',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': postData.length,
              'X-Webhook-Signature': responseSignature
            }
          };
          
          const postReq = http.request(options, (postRes) => {
            console.log('✅ Response sent to chat system:', postRes.statusCode);
          });
          
          postReq.on('error', (error) => {
            console.error('❌ Failed to send response:', error.message);
          });
          
          postReq.write(postData);
          postReq.end();
          
        }, 500 + Math.random() * 1500); // Random delay 0.5-2s
        } else {
          console.log('ℹ️ Skipping response for health check or invalid message');
        }
        
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    
    return;
  }
  
  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Start server
server.listen(PORT, () => {
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
  server.close();
  process.exit(0);
});