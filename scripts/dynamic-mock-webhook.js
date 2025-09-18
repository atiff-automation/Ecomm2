#!/usr/bin/env node

/**
 * Dynamic Mock n8n Webhook Server for Local Testing
 * Reads configuration from the database instead of hardcoded values
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const PORT = 3001;
const prisma = new PrismaClient();

let chatConfig = null;
let configCacheExpiry = 0;
const CONFIG_CACHE_DURATION = 30000; // 30 seconds

// Function to get chat configuration from database
async function getChatConfig() {
  // Return cached config if still valid
  if (chatConfig && Date.now() < configCacheExpiry) {
    return chatConfig;
  }

  try {
    const config = await prisma.chatConfig.findFirst({
      where: { isActive: true },
      select: {
        webhookSecret: true,
        apiKey: true,
        webhookUrl: true,
        verified: true,
        healthStatus: true
      }
    });

    if (config) {
      chatConfig = config;
      configCacheExpiry = Date.now() + CONFIG_CACHE_DURATION;
      return config;
    }

    // Fallback to default values
    console.warn('⚠️  No active chat configuration found in database, using fallback');
    return {
      webhookSecret: 'chat-webhook-secret-2024-secure-key-for-n8n-integration',
      apiKey: 'fallback-api-key',
      webhookUrl: `http://localhost:${PORT}/webhook/chat-integration`,
      verified: false,
      healthStatus: 'NOT_CONFIGURED'
    };
  } catch (error) {
    console.error('❌ Database error:', error.message);
    return {
      webhookSecret: 'chat-webhook-secret-2024-secure-key-for-n8n-integration',
      apiKey: 'fallback-api-key',
      webhookUrl: `http://localhost:${PORT}/webhook/chat-integration`,
      verified: false,
      healthStatus: 'ERROR'
    };
  }
}

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Signature, X-API-Key');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Health check endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    const config = await getChatConfig();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'dynamic-mock-n8n-webhook',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      databaseConfig: {
        configured: config.webhookSecret !== 'chat-webhook-secret-2024-secure-key-for-n8n-integration',
        verified: config.verified,
        healthStatus: config.healthStatus
      }
    }));
    return;
  }

  // Configuration endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/config') {
    const config = await getChatConfig();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      webhookUrl: config.webhookUrl,
      hasSecret: !!config.webhookSecret,
      hasApiKey: !!config.apiKey,
      verified: config.verified,
      healthStatus: config.healthStatus,
      timestamp: new Date().toISOString()
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
        const config = await getChatConfig();
        const payload = JSON.parse(body);

        console.log('\n🎯 Dynamic Mock n8n Webhook Received');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Payload:', JSON.stringify(payload, null, 2));

        // Validate webhook signature if provided
        const signature = req.headers['x-webhook-signature'];
        if (signature && config.webhookSecret) {
          const expectedSignature = 'sha256=' + generateWebhookSignature(body, config.webhookSecret);
          if (signature === expectedSignature) {
            console.log('✅ Webhook signature validated successfully');
          } else {
            console.log('⚠️  Webhook signature mismatch');
            console.log('Expected:', expectedSignature);
            console.log('Received:', signature);
          }
        } else if (config.webhookSecret) {
          console.log('⚠️  No webhook signature found (should be present)');
        } else {
          console.log('ℹ️  No webhook secret configured');
        }

        // Validate API key if provided
        const apiKey = req.headers['x-api-key'];
        if (apiKey && config.apiKey) {
          if (apiKey === config.apiKey) {
            console.log('✅ API key validated successfully');
          } else {
            console.log('⚠️  API key mismatch');
          }
        } else if (config.apiKey) {
          console.log('⚠️  No API key found (should be present)');
        } else {
          console.log('ℹ️  No API key configured');
        }

        // Acknowledge receipt immediately
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Webhook received by dynamic mock n8n',
          sessionId: payload.sessionId,
          messageId: payload.messageId,
          timestamp: new Date().toISOString(),
          config: {
            verified: config.verified,
            healthStatus: config.healthStatus
          }
        }));

        // Only send chat responses for actual chat messages (not health checks)
        if (payload.messageId && payload.message && payload.message.content) {
          // Simulate processing delay and send response back
          setTimeout(async () => {
            console.log('🚀 Sending dynamic mock response back to chat system...');

            const responsePayload = JSON.stringify({
              sessionId: payload.sessionId, // Use the same sessionId (CUID format)
              response: {
                content: `🤖 Dynamic Mock n8n Response: I received your message "${payload.message.content}" and processed it using database configuration!`,
                type: 'text'
              },
              metadata: {
                source: 'dynamic-mock-n8n',
                processingTime: Math.random() * 1000,
                processed: true,
                configSource: 'database'
              }
            });

          // Send response back to chat system
          const postData = Buffer.from(responsePayload, 'utf8');

          // Generate proper HMAC signature for the response using database config
          const responseSignature = 'sha256=' + generateWebhookSignature(responsePayload, config.webhookSecret);
          console.log('📝 Generated response signature using database config:', responseSignature);

          const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/chat/webhook',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': postData.length,
              'X-Webhook-Signature': responseSignature,
              'X-API-Key': config.apiKey
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
server.listen(PORT, async () => {
  console.log(`\n🚀 Dynamic Mock n8n Webhook Server running on port ${PORT}`);
  console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook/chat-integration`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`⚙️  Config check: http://localhost:${PORT}/config`);

  // Check database configuration
  try {
    const config = await getChatConfig();
    console.log('\n📊 Database Configuration Status:');
    console.log('- Webhook Secret:', config.webhookSecret ? '✅ SET' : '❌ NULL');
    console.log('- API Key:', config.apiKey ? '✅ SET' : '❌ NULL');
    console.log('- Verified:', config.verified ? '✅ YES' : '❌ NO');
    console.log('- Health Status:', config.healthStatus);
  } catch (error) {
    console.log('\n❌ Failed to load database configuration:', error.message);
  }

  console.log('\n📝 Instructions:');
  console.log('1. Configure chat admin with: http://localhost:3001/webhook/chat-integration');
  console.log('2. Test chat at: http://localhost:3000/test-chat');
  console.log('3. Watch this console for webhook activity');
  console.log('4. Configuration is loaded from database dynamically\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Dynamic mock n8n webhook server shutting down...');
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});