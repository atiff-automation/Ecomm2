# n8n Chat Integration Guide

**Complete integration specification for n8n engineers**

## Overview

This guide provides everything needed to integrate your n8n workflows with our e-commerce chat system. The integration enables automated chat responses, lead capture, and customer support workflows through secure webhook communication.

## Architecture

```
┌─ E-commerce System ─┐    ┌─ n8n Cloud ─┐    ┌─ AI/External Services ─┐
│ Chat Widget         │    │ Webhook     │    │ OpenAI                 │
│ Message Queue       │◄──►│ Trigger     │◄──►│ CRM Systems            │
│ Webhook Processor   │    │ HTTP Request│    │ Email Services         │
│ Database            │    │ Logic Nodes │    │ Analytics              │
└─────────────────────┘    └─────────────┘    └────────────────────────┘
```

## Integration Flow

1. **User Message**: Customer sends message via chat widget
2. **Webhook to n8n**: System sends POST request to your n8n webhook
3. **n8n Processing**: Your workflow processes message and generates response
4. **Response**: n8n sends response back to our webhook endpoint
5. **Real-time Update**: Customer receives response via WebSocket

## Getting Started

### Step 1: Configure in Admin Panel

1. Navigate to `/admin/chat/integration` in your admin dashboard
2. Enter your n8n webhook URL (from Webhook trigger node)
3. Generate secure webhook secret and API key (use the Generate buttons)
4. Save configuration
5. Test connection using the Test tab

### Step 2: Basic n8n Workflow Setup

1. **Create new workflow** in n8n
2. **Add Webhook trigger node**:
   - Method: `POST`
   - Path: `/webhook/chat` (or your preferred path)
   - Response Mode: `Response to Webhook`
3. **Configure webhook URL** in admin panel using the full URL from n8n
4. **Add security verification** (see Security section below)

## Webhook Payload Format

### Incoming Request (E-commerce → n8n)

```typescript
interface WebhookPayload {
  sessionId: string;                 // Unique session identifier
  messageId: string;                 // Unique message identifier  
  userId?: string;                   // Authenticated user ID (optional)
  guestEmail?: string;               // Guest user email (optional)
  timestamp: string;                 // ISO 8601 timestamp
  
  message: {
    content: string;                 // User message content
    type: 'text' | 'quick_reply';   // Message type
  };
  
  userContext: {
    isAuthenticated: boolean;        // User authentication status
    membershipLevel: 'guest' | 'member'; // User tier
    membershipTotal?: number;        // Total membership value (if member)
    userInfo?: {                     // Full user data (if authenticated)
      id: string;
      name: string;
      email: string;
    };
  };
  
  sessionMetadata?: Record<string, any>; // Custom session data
}
```

### Example Incoming Payload

```json
{
  "sessionId": "sess_1701234567890",
  "messageId": "msg_1701234567891",
  "guestEmail": "customer@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": {
    "content": "Hello, I need help with my order",
    "type": "text"
  },
  "userContext": {
    "isAuthenticated": false,
    "membershipLevel": "guest",
    "membershipTotal": null,
    "userInfo": null
  },
  "sessionMetadata": {
    "source": "product_page",
    "referrer": "google"
  }
}
```

### Response Format (n8n → E-commerce)

```typescript
interface WebhookResponse {
  sessionId: string;                 // Must match request sessionId
  response: {
    content: string;                 // Bot response content
    type: 'text' | 'quick_reply' | 'rich_content'; 
    quickReplies?: string[];         // Optional quick reply buttons
    attachments?: Array<{            // Optional media attachments
      type: 'image' | 'file' | 'link';
      url: string;
      title?: string;
    }>;
  };
  
  metadata?: {                       // Optional metadata
    intent?: string;                 // Detected intent  
    confidence?: number;             // Confidence score (0-1)
    context?: Record<string, any>;   // Additional context data
  };
}
```

### Example Response

```json
{
  "sessionId": "sess_1701234567890",
  "response": {
    "content": "Hello! I'd be happy to help with your order. Could you please provide your order number?",
    "type": "text",
    "quickReplies": [
      "Check Order Status",
      "Track Package", 
      "Contact Support"
    ]
  },
  "metadata": {
    "intent": "order_inquiry",
    "confidence": 0.95,
    "context": {
      "department": "customer_service",
      "priority": "normal"
    }
  }
}
```

## Security Implementation

### Webhook Signature Verification

All incoming webhooks include an HMAC-SHA256 signature for verification:

```javascript
// Example n8n JavaScript code for signature verification
function verifyWebhookSignature(payload, signature, secret) {
  const crypto = require('crypto');
  
  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');
  
  // Compare signatures (use timing-safe comparison in production)
  const receivedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}

// Usage in n8n workflow
const isValid = verifyWebhookSignature(
  $json,  // The incoming payload
  $node["Webhook"].json["headers"]["x-webhook-signature"],
  "your_webhook_secret_here"
);

if (!isValid) {
  throw new Error('Invalid webhook signature');
}
```

### Required Headers

Your n8n workflow should verify these headers:

```javascript
const headers = {
  'Content-Type': 'application/json',
  'X-Webhook-Signature': 'sha256=<calculated_signature>',
  'X-API-Key': '<your_configured_api_key>',
  'User-Agent': 'E-commerce-Chat/1.0'
};
```

### Response Headers

When responding back to our system, include:

```javascript
const responseHeaders = {
  'Content-Type': 'application/json',
  'X-API-Key': '<your_configured_api_key>'
};
```

## Workflow Examples

### Basic Echo Bot

```json
{
  "name": "Basic Chat Echo",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chat-webhook",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-trigger",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ {\n  sessionId: $json.sessionId,\n  response: {\n    content: \"Echo: \" + $json.message.content,\n    type: \"text\"\n  }\n} }}"
      },
      "id": "respond-to-webhook",
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [460, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### AI-Powered Customer Support

```json
{
  "name": "AI Customer Support",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-support",
        "responseMode": "responseNode"
      },
      "id": "webhook-trigger",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.userContext.membershipLevel}}",
              "operation": "equal",
              "value2": "member"
            }
          ]
        }
      },
      "id": "check-membership",
      "name": "Check Membership",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "resource": "chat",
        "operation": "message",
        "chatId": "gpt-4",
        "text": "={{$json.message.content}}\n\nContext: Customer is a premium member with total purchases of ${{$json.userContext.membershipTotal}}. Provide personalized support."
      },
      "id": "ai-member-response",
      "name": "AI Member Response",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [680, 200]
    },
    {
      "parameters": {
        "resource": "chat",
        "operation": "message", 
        "chatId": "gpt-3.5-turbo",
        "text": "={{$json.message.content}}\n\nContext: Guest customer inquiry. Provide helpful but general support and encourage account creation."
      },
      "id": "ai-guest-response",
      "name": "AI Guest Response", 
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [680, 400]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ {\n  sessionId: $json.sessionId,\n  response: {\n    content: $json.choices[0].message.content,\n    type: \"text\",\n    quickReplies: $json.userContext.isAuthenticated ? [\"View Orders\", \"Account Settings\"] : [\"Create Account\", \"Browse Products\"]\n  },\n  metadata: {\n    intent: \"support_inquiry\",\n    confidence: 0.9\n  }\n} }}"
      },
      "id": "respond-to-webhook",
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook", 
      "typeVersion": 1,
      "position": [900, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Check Membership",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Membership": {
      "main": [
        [
          {
            "node": "AI Member Response",
            "type": "main", 
            "index": 0
          }
        ],
        [
          {
            "node": "AI Guest Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "AI Member Response": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "AI Guest Response": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Testing Your Integration

### 1. Use Admin Panel Test Feature

1. Go to `/admin/chat/integration` → Testing tab
2. Click "Test n8n Connection" 
3. Review the test results and response time
4. Check logs for any error details

### 2. Manual cURL Testing

```bash
# Test your n8n webhook directly
curl -X POST "https://your-n8n-instance.app.n8n.cloud/webhook/chat" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=<calculated_signature>" \
  -H "X-API-Key: <your_api_key>" \
  -H "User-Agent: E-commerce-Chat/1.0" \
  -d '{
    "sessionId": "test-session-123",
    "messageId": "test-msg-123", 
    "guestEmail": "test@example.com",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "message": {
      "content": "Test message from integration guide",
      "type": "text"
    },
    "userContext": {
      "isAuthenticated": false,
      "membershipLevel": "guest",
      "membershipTotal": null,
      "userInfo": null
    }
  }'
```

### 3. Response Back to E-commerce System

Your n8n workflow should send responses to:

```
POST https://your-domain.com/api/chat/webhook
Content-Type: application/json
X-API-Key: <your_configured_api_key>

{
  "sessionId": "test-session-123",
  "response": {
    "content": "Hello from n8n! I received your message: Test message from integration guide",
    "type": "text"
  }
}
```

## Common Use Cases

### 1. Order Status Inquiries

```javascript
// n8n Function node example
if ($json.message.content.toLowerCase().includes('order')) {
  // Extract order number pattern
  const orderMatch = $json.message.content.match(/\b\d{6,}\b/);
  
  if (orderMatch) {
    const orderNumber = orderMatch[0];
    
    // Query order status (you'd integrate with your order system)
    return {
      sessionId: $json.sessionId,
      response: {
        content: `I found order #${orderNumber}. Let me check the status for you...`,
        type: "text",
        quickReplies: ["Track Package", "Contact Support"]
      },
      metadata: {
        intent: "order_status",
        orderNumber: orderNumber
      }
    };
  }
}

return {
  sessionId: $json.sessionId,
  response: {
    content: "I'd be happy to help with your order. Could you please provide your order number?",
    type: "text"
  }
};
```

### 2. Product Recommendations

```javascript
// Product recommendation based on user context
if ($json.userContext.isAuthenticated && $json.userContext.membershipTotal > 500) {
  return {
    sessionId: $json.sessionId,
    response: {
      content: "As a valued premium member, here are some exclusive products you might like:",
      type: "rich_content",
      attachments: [
        {
          type: "link",
          url: "https://yourstore.com/premium-products",
          title: "Premium Collection"
        }
      ]
    },
    metadata: {
      intent: "product_recommendation",
      userTier: "premium"
    }
  };
}
```

### 3. Lead Capture

```javascript
// Capture leads from guest users
if (!$json.userContext.isAuthenticated && $json.guestEmail) {
  // Send to CRM or email service
  return {
    sessionId: $json.sessionId,
    response: {
      content: "Thanks for your interest! I've noted your email. Would you like me to send you our latest offers?",
      type: "text",
      quickReplies: ["Yes, send offers", "No thanks", "Create Account"]
    },
    metadata: {
      intent: "lead_capture",
      email: $json.guestEmail
    }
  };
}
```

## Error Handling

### Timeout Configuration

Set appropriate timeouts in your n8n workflows:

```javascript
// In HTTP Request nodes, set timeout to 25 seconds
// (Our system has a 30-second webhook timeout)
{
  "timeout": 25000,
  "retry": {
    "enable": true,
    "times": 2
  }
}
```

### Error Response Format

When errors occur, return this format:

```json
{
  "sessionId": "original-session-id",
  "response": {
    "content": "I'm sorry, I'm experiencing technical difficulties. Please try again or contact support.",
    "type": "text",
    "quickReplies": ["Try Again", "Contact Support"]
  },
  "metadata": {
    "error": true,
    "errorType": "processing_error"
  }
}
```

## Best Practices

### 1. Response Time

- Keep responses under 25 seconds
- For longer processing, send immediate acknowledgment:

```json
{
  "sessionId": "sess_123",
  "response": {
    "content": "I'm processing your request. This may take a moment...",
    "type": "text"
  }
}
```

### 2. Session Management

- Always include the exact `sessionId` from the request
- Store session context for multi-turn conversations
- Set appropriate session timeouts (default: 30 minutes)

### 3. User Experience

- Provide clear, helpful responses
- Use quick replies for common actions
- Include fallback options for unrecognized inputs

### 4. Security

- Always verify webhook signatures
- Validate API keys
- Don't log sensitive user information
- Use HTTPS for all communications

## Monitoring & Troubleshooting

### Health Checks

Your webhook should respond to health check requests:

```json
{
  "type": "health_check", 
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionId": "health-check-123"
}
```

Response:

```json
{
  "sessionId": "health-check-123",
  "response": {
    "content": "n8n webhook is operational",
    "type": "text"
  },
  "metadata": {
    "health": "ok",
    "version": "1.0"
  }
}
```

### Common Issues

1. **Signature Verification Failed**
   - Check webhook secret configuration
   - Ensure payload is stringified correctly for signature

2. **Timeout Errors**
   - Reduce processing time in workflow
   - Add timeout handling

3. **Invalid Response Format** 
   - Verify response includes required `sessionId`
   - Check response structure matches specification

4. **Missing API Key**
   - Include X-API-Key header in responses
   - Verify API key matches configuration

## Support

For integration support:

1. Check the admin panel test results
2. Review webhook delivery logs in monitoring dashboard
3. Verify your n8n workflow follows this specification
4. Contact your system administrator with specific error details

---

*This guide covers the complete n8n integration specification. For additional examples and advanced use cases, see the example workflow files in the `n8n-workflows/` directory.*