# Webhook Payload Specification

**Technical specification for webhook communication between e-commerce chat system and n8n Cloud**

## Overview

This document provides the complete technical specification for webhook payloads exchanged between our e-commerce chat system and n8n workflows. It includes data types, validation rules, examples, and implementation guidelines.

## Request Flow

```
┌─ E-commerce System ─┐         ┌─ n8n Cloud ─┐
│                     │  POST   │             │
│ Chat Message        │────────►│ Webhook     │
│ Queue Processor     │         │ Trigger     │
│                     │◄────────│ Response    │
└─────────────────────┘  200 OK └─────────────┘
```

## Outgoing Webhook (E-commerce → n8n)

### HTTP Request Specification

```http
POST https://your-n8n-instance.app.n8n.cloud/webhook/your-path
Content-Type: application/json
X-Webhook-Signature: sha256=<calculated_hmac_signature>
X-API-Key: <configured_api_key>
User-Agent: E-commerce-Chat/1.0
```

### Payload Structure

```typescript
interface OutgoingWebhookPayload {
  // Core identifiers (Required)
  sessionId: string;                 // Unique session identifier
  messageId: string;                 // Unique message identifier
  timestamp: string;                 // ISO 8601 timestamp
  
  // User identification (One required)
  userId?: string;                   // Authenticated user ID
  guestEmail?: string;               // Guest user email
  
  // Message data (Required)
  message: {
    content: string;                 // User message content (1-4000 chars)
    type: 'text' | 'quick_reply';   // Message type
  };
  
  // User context (Required)
  userContext: {
    isAuthenticated: boolean;        // Authentication status
    membershipLevel: 'guest' | 'member'; // User tier
    membershipTotal?: number;        // Total membership value (nullable)
    userInfo?: UserInfo | null;      // Full user data (if authenticated)
  };
  
  // Optional metadata
  sessionMetadata?: Record<string, any>; // Custom session data
}

interface UserInfo {
  id: string;                        // User ID
  name: string;                      // Full name
  email: string;                     // Email address
}
```

### Field Specifications

#### Core Identifiers

| Field | Type | Required | Format | Description |
|-------|------|----------|--------|-------------|
| `sessionId` | string | Yes | `sess_[timestamp]` | Unique identifier for chat session |
| `messageId` | string | Yes | `msg_[timestamp]` | Unique identifier for this message |
| `timestamp` | string | Yes | ISO 8601 | Message creation timestamp |

#### User Identification

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `userId` | string | No* | UUID format | Database user ID (authenticated users) |
| `guestEmail` | string | No* | Valid email | Email address (guest users) |

*Note: Either `userId` OR `guestEmail` must be provided*

#### Message Data

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `message.content` | string | Yes | 1-4000 characters | User's message text |
| `message.type` | enum | Yes | 'text' \| 'quick_reply' | Type of message |

#### User Context

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userContext.isAuthenticated` | boolean | Yes | Whether user is logged in |
| `userContext.membershipLevel` | enum | Yes | 'guest' or 'member' |
| `userContext.membershipTotal` | number | No | Total purchase amount (members only) |
| `userContext.userInfo` | object | No | Full user details (authenticated only) |

### Example Payloads

#### Authenticated Member

```json
{
  "sessionId": "sess_1701234567890",
  "messageId": "msg_1701234567891", 
  "userId": "usr_abc123def456",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": {
    "content": "I need help with my recent order #12345",
    "type": "text"
  },
  "userContext": {
    "isAuthenticated": true,
    "membershipLevel": "member",
    "membershipTotal": 1250.75,
    "userInfo": {
      "id": "usr_abc123def456",
      "name": "John Smith",
      "email": "john.smith@example.com"
    }
  },
  "sessionMetadata": {
    "source": "order_history_page",
    "referrer": "email_campaign",
    "deviceType": "desktop"
  }
}
```

#### Guest User

```json
{
  "sessionId": "sess_1701234567892",
  "messageId": "msg_1701234567893",
  "guestEmail": "guest@example.com", 
  "timestamp": "2024-01-15T10:35:00.000Z",
  "message": {
    "content": "What are your shipping options?",
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
    "productId": "prod_xyz789",
    "utm_source": "google_ads"
  }
}
```

#### Quick Reply Message

```json
{
  "sessionId": "sess_1701234567890",
  "messageId": "msg_1701234567894",
  "userId": "usr_abc123def456",
  "timestamp": "2024-01-15T10:40:00.000Z",
  "message": {
    "content": "Track Package",
    "type": "quick_reply"
  },
  "userContext": {
    "isAuthenticated": true,
    "membershipLevel": "member",
    "membershipTotal": 1250.75,
    "userInfo": {
      "id": "usr_abc123def456", 
      "name": "John Smith",
      "email": "john.smith@example.com"
    }
  }
}
```

## Incoming Webhook (n8n → E-commerce)

### HTTP Request Specification

```http
POST https://your-domain.com/api/chat/webhook
Content-Type: application/json
X-API-Key: <configured_api_key>
User-Agent: n8n-webhook/1.0
```

### Response Payload Structure

```typescript
interface IncomingWebhookPayload {
  // Core identifier (Required)
  sessionId: string;                 // Must match original request
  
  // Response content (Required)
  response: {
    content: string;                 // Bot response content (1-4000 chars)
    type: 'text' | 'quick_reply' | 'rich_content';
    quickReplies?: string[];         // Quick reply buttons (max 5)
    attachments?: Attachment[];      // Media attachments (max 3)
  };
  
  // Optional metadata
  metadata?: {
    intent?: string;                 // Detected intent name
    confidence?: number;             // Confidence score (0-1)
    context?: Record<string, any>;   // Additional context data
  };
}

interface Attachment {
  type: 'image' | 'file' | 'link';  // Attachment type
  url: string;                      // Valid HTTPS URL
  title?: string;                   // Display title
}
```

### Field Specifications

#### Core Response

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `sessionId` | string | Yes | Must match request | Session identifier |
| `response.content` | string | Yes | 1-4000 characters | Bot response text |
| `response.type` | enum | Yes | See types below | Response format type |

#### Response Types

| Type | Description | Additional Fields |
|------|-------------|-------------------|
| `text` | Plain text response | None |
| `quick_reply` | Text with quick reply buttons | `quickReplies` array |
| `rich_content` | Text with attachments | `attachments` array |

#### Quick Replies

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `quickReplies` | string[] | Max 5 items, 1-20 chars each | Quick action buttons |

#### Attachments

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `type` | enum | Yes | 'image' \| 'file' \| 'link' | Attachment type |
| `url` | string | Yes | Valid HTTPS URL | Resource location |
| `title` | string | No | 1-100 characters | Display title |

### Example Responses

#### Simple Text Response

```json
{
  "sessionId": "sess_1701234567890",
  "response": {
    "content": "I found your order #12345. It was shipped yesterday and should arrive by Friday.",
    "type": "text"
  },
  "metadata": {
    "intent": "order_status",
    "confidence": 0.95,
    "context": {
      "orderNumber": "12345",
      "status": "shipped"
    }
  }
}
```

#### Quick Reply Response

```json
{
  "sessionId": "sess_1701234567890", 
  "response": {
    "content": "How else can I help you today?",
    "type": "quick_reply",
    "quickReplies": [
      "Track Package",
      "Return Item", 
      "Contact Support",
      "Browse Products"
    ]
  },
  "metadata": {
    "intent": "help_menu",
    "confidence": 0.9
  }
}
```

#### Rich Content Response

```json
{
  "sessionId": "sess_1701234567892",
  "response": {
    "content": "Here are our shipping options:",
    "type": "rich_content",
    "attachments": [
      {
        "type": "link",
        "url": "https://yourstore.com/shipping-info",
        "title": "Shipping Rates & Times"
      },
      {
        "type": "image", 
        "url": "https://yourstore.com/images/shipping-map.png",
        "title": "Delivery Coverage Map"
      }
    ],
    "quickReplies": [
      "Calculate Shipping",
      "Express Options"
    ]
  }
}
```

## Security Specification

### HMAC Signature Calculation

#### Outgoing Webhooks (E-commerce → n8n)

```javascript
// JavaScript example for n8n verification
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');
  
  // Extract received signature (remove 'sha256=' prefix)
  const receivedSignature = signature.replace('sha256=', '');
  
  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}

// Usage in n8n Function node
const isValid = verifyWebhookSignature(
  $json,  // The webhook payload
  $node["Webhook"].json["headers"]["x-webhook-signature"],
  "your_webhook_secret"
);

if (!isValid) {
  throw new Error('Invalid webhook signature');
}
```

#### Required Security Headers

**Outgoing (E-commerce → n8n):**
```http
X-Webhook-Signature: sha256=<hmac_hex_digest>
X-API-Key: <configured_api_key>
```

**Incoming (n8n → E-commerce):**
```http
X-API-Key: <configured_api_key>
```

## Validation Rules

### Request Validation

#### Required Fields Check
```javascript
// n8n validation example
function validateWebhookPayload(payload) {
  const errors = [];
  
  // Required fields
  if (!payload.sessionId) errors.push('sessionId is required');
  if (!payload.messageId) errors.push('messageId is required'); 
  if (!payload.timestamp) errors.push('timestamp is required');
  if (!payload.message?.content) errors.push('message.content is required');
  
  // User identification (either userId or guestEmail)
  if (!payload.userId && !payload.guestEmail) {
    errors.push('Either userId or guestEmail is required');
  }
  
  // Message content length
  if (payload.message?.content && payload.message.content.length > 4000) {
    errors.push('message.content exceeds 4000 character limit');
  }
  
  return errors;
}
```

#### Data Type Validation
```javascript
function validateDataTypes(payload) {
  const errors = [];
  
  // String fields
  if (typeof payload.sessionId !== 'string') errors.push('sessionId must be string');
  if (typeof payload.messageId !== 'string') errors.push('messageId must be string');
  
  // Boolean fields
  if (typeof payload.userContext?.isAuthenticated !== 'boolean') {
    errors.push('userContext.isAuthenticated must be boolean');
  }
  
  // Enum fields
  const validMessageTypes = ['text', 'quick_reply'];
  if (!validMessageTypes.includes(payload.message?.type)) {
    errors.push('message.type must be text or quick_reply');
  }
  
  const validMembershipLevels = ['guest', 'member'];
  if (!validMembershipLevels.includes(payload.userContext?.membershipLevel)) {
    errors.push('userContext.membershipLevel must be guest or member');
  }
  
  return errors;
}
```

### Response Validation

```javascript
function validateResponsePayload(response) {
  const errors = [];
  
  // Required fields
  if (!response.sessionId) errors.push('sessionId is required');
  if (!response.response?.content) errors.push('response.content is required');
  if (!response.response?.type) errors.push('response.type is required');
  
  // Content length
  if (response.response.content.length > 4000) {
    errors.push('response.content exceeds 4000 character limit');
  }
  
  // Quick replies validation
  if (response.response.quickReplies) {
    if (response.response.quickReplies.length > 5) {
      errors.push('Maximum 5 quick replies allowed');
    }
    
    response.response.quickReplies.forEach((reply, index) => {
      if (typeof reply !== 'string' || reply.length > 20) {
        errors.push(`Quick reply ${index} must be string with max 20 characters`);
      }
    });
  }
  
  // Attachments validation
  if (response.response.attachments) {
    if (response.response.attachments.length > 3) {
      errors.push('Maximum 3 attachments allowed');
    }
    
    response.response.attachments.forEach((attachment, index) => {
      const validTypes = ['image', 'file', 'link'];
      if (!validTypes.includes(attachment.type)) {
        errors.push(`Attachment ${index} type must be image, file, or link`);
      }
      
      if (!attachment.url || !attachment.url.startsWith('https://')) {
        errors.push(`Attachment ${index} URL must be valid HTTPS URL`);
      }
    });
  }
  
  return errors;
}
```

## Error Handling

### Standard Error Responses

When validation fails or errors occur, return:

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
    "errorType": "validation_error",
    "errorDetails": ["Specific error messages"]
  }
}
```

### Timeout Handling

- **Request Timeout**: 30 seconds maximum
- **Response Timeout**: 30 seconds maximum
- **Recommended Processing Time**: < 25 seconds

```json
{
  "sessionId": "sess_123",
  "response": {
    "content": "I'm processing your request. This may take a moment...",
    "type": "text"
  },
  "metadata": {
    "processing": true,
    "estimatedTime": "15-20 seconds"
  }
}
```

## Testing & Development

### Test Payload Generator

```javascript
// Generate test payload for development
function generateTestPayload(messageContent, userType = 'guest') {
  const timestamp = new Date().toISOString();
  const sessionId = `sess_${Date.now()}`;
  const messageId = `msg_${Date.now()}`;
  
  const basePayload = {
    sessionId,
    messageId,
    timestamp,
    message: {
      content: messageContent,
      type: 'text'
    }
  };
  
  if (userType === 'member') {
    return {
      ...basePayload,
      userId: 'usr_test123',
      userContext: {
        isAuthenticated: true,
        membershipLevel: 'member',
        membershipTotal: 999.99,
        userInfo: {
          id: 'usr_test123',
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    };
  } else {
    return {
      ...basePayload,
      guestEmail: 'guest@example.com',
      userContext: {
        isAuthenticated: false,
        membershipLevel: 'guest',
        membershipTotal: null,
        userInfo: null
      }
    };
  }
}

// Usage
const testPayload = generateTestPayload('Hello, I need help!', 'member');
```

### Health Check Payload

For monitoring and health checks:

```json
{
  "sessionId": "health_check_123",
  "messageId": "health_msg_123", 
  "guestEmail": "healthcheck@system.local",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": {
    "content": "Health check message",
    "type": "text"
  },
  "userContext": {
    "isAuthenticated": false,
    "membershipLevel": "guest",
    "membershipTotal": null,
    "userInfo": null
  },
  "sessionMetadata": {
    "healthCheck": true,
    "source": "monitoring_system"
  }
}
```

Expected health check response:

```json
{
  "sessionId": "health_check_123",
  "response": {
    "content": "System operational",
    "type": "text"
  },
  "metadata": {
    "health": "ok",
    "version": "1.0",
    "responseTime": "150ms"
  }
}
```

---

*This specification provides the complete technical details for webhook payload integration. For implementation examples and workflow templates, see the main integration guide and example workflow files.*