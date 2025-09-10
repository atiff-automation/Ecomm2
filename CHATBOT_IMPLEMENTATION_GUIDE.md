# Chatbot Implementation Guide
## n8n Webhook Integration for E-commerce Platform

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technical Specifications](#technical-specifications)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [Frontend Components](#frontend-components)
7. [n8n Integration](#n8n-integration)
8. [Security Implementation](#security-implementation)
9. [Implementation Phases](#implementation-phases)
10. [Risk Assessment](#risk-assessment)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Guide](#deployment-guide)
13. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Executive Summary

This document outlines the implementation of a chatbot system for the JRM E-commerce platform that integrates with n8n via webhooks for automated response processing. The solution uses an **async queue-based architecture** with real-time updates to ensure reliability, scalability, and optimal user experience.

### Key Features
- Real-time chat interface with WebSocket connectivity
- Resilient webhook processing with retry mechanisms
- User context awareness (authenticated and guest users)
- Message history and session management
- Rate limiting and security controls
- Scalable queue-based architecture

### Success Metrics
- Message delivery rate: >99.5%
- Average response time: <3 seconds
- System uptime: >99.9%
- User engagement through chat completion rates

---

## System Architecture

### Overview
The chatbot system follows an **async queue-based architecture** with the following flow:

```
User Message → API Storage → Queue Processing → n8n Webhook → Response Processing → Real-time Update → User Interface
```

### Core Components

#### 1. Chat API Layer
- RESTful endpoints for message handling
- Session management and user authentication
- Rate limiting and input validation
- Real-time WebSocket connections

#### 2. Database Layer
- PostgreSQL with Prisma ORM
- Chat sessions, messages, and webhook queue tables
- Optimized for read/write performance

#### 3. Queue System
- Background workers for webhook processing
- Retry logic with exponential backoff
- Dead letter queue for failed messages
- Monitoring and alerting

#### 4. Real-time Layer
- WebSocket connections for instant updates
- Connection pooling and management
- Fallback to Server-Sent Events (SSE)

#### 5. n8n Integration
- Secure webhook communication
- Standardized payload format
- Error handling and response validation

### Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    API Layer     │    │   Database      │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │Chat Widget  │◄┼────┼►│Chat Endpoints│◄┼────┼►│Chat Tables  │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │WebSocket    │◄┼────┼►│WebSocket     │ │    │ │Queue Tables │ │
│ │Connection   │ │    │ │Handler       │ │    │ └─────────────┘ │
│ └─────────────┘ │    │ └──────────────┘ │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Queue Worker    │    │      n8n        │
                       │                  │    │                 │
                       │ ┌──────────────┐ │    │ ┌─────────────┐ │
                       │ │Webhook       │◄┼────┼►│Workflow     │ │
                       │ │Processor     │ │    │ │Engine       │ │
                       │ └──────────────┘ │    │ └─────────────┘ │
                       │                  │    │                 │
                       │ ┌──────────────┐ │    │ ┌─────────────┐ │
                       │ │Retry Logic   │ │    │ │Response     │ │
                       │ └──────────────┘ │    │ │Handler      │ │
                       └──────────────────┘    │ └─────────────┘ │
                                               └─────────────────┘
```

---

## Technical Specifications

### Technology Stack
- **Backend**: Next.js 14 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue System**: Built on existing webhook queue pattern
- **Real-time**: WebSocket (Socket.io or native)
- **Frontend**: React with TypeScript
- **State Management**: Zustand or React Context
- **Authentication**: NextAuth integration

### Performance Requirements
- **Concurrent Users**: Support 1000+ simultaneous chat sessions
- **Message Throughput**: 10,000+ messages per hour
- **Response Time**: <3 seconds average
- **Availability**: 99.9% uptime

### Scalability Considerations
- Horizontal scaling of queue workers
- Database connection pooling
- Redis for session state (optional)
- CDN for static chat assets

---

## Database Schema

### New Tables

#### ChatSession
```sql
CREATE TABLE chat_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  guest_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_expires_at ON chat_sessions(expires_at);
```

#### ChatMessage
```sql
CREATE TABLE chat_messages (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'user' or 'bot'
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'quick_reply', 'rich_content'
  metadata JSONB,
  status VARCHAR(50) DEFAULT 'delivered', -- 'pending', 'sent', 'delivered', 'failed'
  webhook_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_status ON chat_messages(status);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

#### ChatWebhookQueue
```sql
CREATE TABLE chat_webhook_queue (
  id VARCHAR(255) PRIMARY KEY,
  message_id VARCHAR(255) REFERENCES chat_messages(id) ON DELETE CASCADE,
  webhook_url VARCHAR(500) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_webhook_queue_status ON chat_webhook_queue(status);
CREATE INDEX idx_chat_webhook_queue_next_retry ON chat_webhook_queue(next_retry_at);
CREATE INDEX idx_chat_webhook_queue_message_id ON chat_webhook_queue(message_id);
```

### Prisma Schema Additions

```prisma
model ChatSession {
  id          String      @id @default(cuid())
  userId      String?
  guestEmail  String?
  status      String      @default("active")
  metadata    Json?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  expiresAt   DateTime?
  
  user        User?       @relation(fields: [userId], references: [id])
  messages    ChatMessage[]
  
  @@index([userId])
  @@index([status])
  @@index([expiresAt])
  @@map("chat_sessions")
}

model ChatMessage {
  id              String    @id @default(cuid())
  sessionId       String
  senderType      String    // 'user' or 'bot'
  content         String
  messageType     String    @default("text")
  metadata        Json?
  status          String    @default("delivered")
  webhookAttempts Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  session         ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  webhookQueue    ChatWebhookQueue[]
  
  @@index([sessionId])
  @@index([status])
  @@index([createdAt])
  @@map("chat_messages")
}

model ChatWebhookQueue {
  id           String    @id @default(cuid())
  messageId    String
  webhookUrl   String
  payload      Json
  status       String    @default("pending")
  attempts     Int       @default(0)
  maxAttempts  Int       @default(3)
  nextRetryAt  DateTime  @default(now())
  lastError    String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  message      ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  @@index([status])
  @@index([nextRetryAt])
  @@index([messageId])
  @@map("chat_webhook_queue")
}
```

---

## API Design

### REST Endpoints

#### 1. Chat Session Management

**POST /api/chat/session**
```typescript
// Create new chat session
interface CreateSessionRequest {
  userId?: string;
  guestEmail?: string;
  metadata?: Record<string, any>;
}

interface CreateSessionResponse {
  sessionId: string;
  status: 'active';
  expiresAt: string;
}
```

**GET /api/chat/session/[sessionId]**
```typescript
// Get session details and recent messages
interface GetSessionResponse {
  sessionId: string;
  status: string;
  messages: ChatMessage[];
  metadata?: Record<string, any>;
}
```

#### 2. Message Handling

**POST /api/chat/send**
```typescript
// Send user message
interface SendMessageRequest {
  sessionId: string;
  content: string;
  messageType?: 'text' | 'quick_reply';
  metadata?: Record<string, any>;
}

interface SendMessageResponse {
  messageId: string;
  status: 'pending' | 'sent';
  timestamp: string;
}
```

**GET /api/chat/messages/[sessionId]**
```typescript
// Get message history
interface GetMessagesResponse {
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

#### 3. Webhook Endpoints

**POST /api/chat/webhook**
```typescript
// Receive responses from n8n
interface WebhookRequest {
  sessionId: string;
  response: string;
  responseType?: 'text' | 'quick_reply' | 'rich_content';
  metadata?: Record<string, any>;
  signature: string; // HMAC signature for verification
}

interface WebhookResponse {
  success: boolean;
  messageId?: string;
}
```

#### 4. WebSocket Events

**Client → Server Events:**
```typescript
// Join chat session
interface JoinChatEvent {
  type: 'join_chat';
  sessionId: string;
  userId?: string;
}

// Leave chat session
interface LeaveChatEvent {
  type: 'leave_chat';
  sessionId: string;
}

// Typing indicator
interface TypingEvent {
  type: 'typing';
  sessionId: string;
  isTyping: boolean;
}
```

**Server → Client Events:**
```typescript
// New message received
interface NewMessageEvent {
  type: 'new_message';
  sessionId: string;
  message: ChatMessage;
}

// Message status update
interface MessageStatusEvent {
  type: 'message_status';
  messageId: string;
  status: 'sent' | 'delivered' | 'failed';
}

// Bot typing indicator
interface BotTypingEvent {
  type: 'bot_typing';
  sessionId: string;
  isTyping: boolean;
}
```

---

## Frontend Components

### Component Structure
```
src/components/chat/
├── ChatWidget.tsx          # Main chat widget component
├── ChatBubble.tsx          # Floating chat bubble
├── ChatWindow.tsx          # Expandable chat interface
├── MessageList.tsx         # Message history display
├── MessageItem.tsx         # Individual message component
├── MessageInput.tsx        # Text input and send button
├── TypingIndicator.tsx     # Bot typing animation
├── ChatProvider.tsx        # Context provider for chat state
└── hooks/
    ├── useChat.ts          # Chat operations hook
    ├── useWebSocket.ts     # WebSocket connection hook
    └── useChatHistory.ts   # Message history management
```

### Key Components

#### ChatWidget.tsx
```typescript
interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark';
  initialExpanded?: boolean;
  guestEmail?: string;
  userId?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  position = 'bottom-right',
  theme = 'light',
  initialExpanded = false,
  guestEmail,
  userId
}) => {
  const { sessionId, messages, isConnected, sendMessage } = useChat({
    userId,
    guestEmail
  });

  const { isTyping } = useWebSocket(sessionId);

  return (
    <div className={`chat-widget ${position} ${theme}`}>
      <ChatBubble onClick={() => setExpanded(!expanded)} />
      {expanded && (
        <ChatWindow
          sessionId={sessionId}
          messages={messages}
          onSendMessage={sendMessage}
          isConnected={isConnected}
          isTyping={isTyping}
        />
      )}
    </div>
  );
};
```

#### useChat.ts Hook
```typescript
interface UseChatOptions {
  userId?: string;
  guestEmail?: string;
  autoConnect?: boolean;
}

interface UseChatReturn {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  sendMessage: (content: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearHistory: () => void;
}

export const useChat = (options: UseChatOptions): UseChatReturn => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isConnected, emit, on } = useWebSocket();

  const createSession = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: options.userId,
          guestEmail: options.guestEmail
        })
      });
      
      const data = await response.json();
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      throw error;
    }
  }, [options.userId, options.guestEmail]);

  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          content
        })
      });
      
      const data = await response.json();
      
      // Add user message optimistically
      const userMessage: ChatMessage = {
        id: data.messageId,
        sessionId,
        senderType: 'user',
        content,
        messageType: 'text',
        status: 'sent',
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // WebSocket event handlers
  useEffect(() => {
    if (!sessionId || !isConnected) return;

    // Join chat session
    emit('join_chat', { sessionId, userId: options.userId });

    // Listen for new messages
    const handleNewMessage = (event: NewMessageEvent) => {
      if (event.sessionId === sessionId) {
        setMessages(prev => [...prev, event.message]);
      }
    };

    on('new_message', handleNewMessage);

    return () => {
      emit('leave_chat', { sessionId });
    };
  }, [sessionId, isConnected, options.userId]);

  // Initialize session on mount
  useEffect(() => {
    if (options.autoConnect !== false) {
      createSession();
    }
  }, [createSession, options.autoConnect]);

  return {
    sessionId,
    messages,
    isLoading,
    isConnected,
    sendMessage,
    loadHistory: async () => {}, // Implementation for loading message history
    clearHistory: () => setMessages([])
  };
};
```

---

## n8n Integration

### Webhook Configuration

#### Outgoing Webhook (to n8n)
```typescript
// Payload sent to n8n
interface N8nWebhookPayload {
  sessionId: string;
  messageId: string;
  userId?: string;
  guestEmail?: string;
  message: {
    content: string;
    type: 'text' | 'quick_reply';
    timestamp: string;
  };
  userContext: {
    isAuthenticated: boolean;
    membershipLevel?: string;
    orderHistory?: any[];
    preferences?: Record<string, any>;
  };
  sessionMetadata?: Record<string, any>;
}
```

#### Incoming Webhook (from n8n)
```typescript
// Expected response from n8n
interface N8nWebhookResponse {
  sessionId: string;
  response: {
    content: string;
    type: 'text' | 'quick_reply' | 'rich_content';
    quickReplies?: string[];
    attachments?: {
      type: 'image' | 'file' | 'link';
      url: string;
      title?: string;
    }[];
  };
  metadata?: {
    intent?: string;
    confidence?: number;
    context?: Record<string, any>;
  };
  actions?: {
    type: 'redirect' | 'open_modal' | 'trigger_event';
    payload: Record<string, any>;
  }[];
}
```

### n8n Workflow Setup

#### Basic Workflow Structure
1. **Webhook Trigger Node**: Receives messages from chat API
2. **Function Node**: Process user input and context
3. **Decision Nodes**: Route based on intent/content
4. **Integration Nodes**: Connect to external services (OpenAI, knowledge base, etc.)
5. **Response Node**: Format and send response back

#### Example n8n Workflow Configuration

**Webhook Trigger Node:**
```json
{
  "httpMethod": "POST",
  "path": "chat-webhook",
  "authentication": "headerAuth",
  "options": {
    "noResponseBody": false
  }
}
```

**Function Node - Context Processing:**
```javascript
// Process incoming chat message
const { sessionId, userId, message, userContext } = $json;

// Extract user intent
const content = message.content.toLowerCase();
let intent = 'general';

if (content.includes('order') || content.includes('purchase')) {
  intent = 'order_inquiry';
} else if (content.includes('product') || content.includes('price')) {
  intent = 'product_inquiry';
} else if (content.includes('help') || content.includes('support')) {
  intent = 'support';
}

// Prepare context for downstream nodes
return {
  sessionId,
  userId,
  originalMessage: message.content,
  intent,
  userContext,
  processedAt: new Date().toISOString()
};
```

**Response Formatting Node:**
```javascript
// Format response for chat API
const response = $json;

return {
  sessionId: $('Webhook').first().json.sessionId,
  response: {
    content: response.aiResponse || response.templateResponse,
    type: 'text',
    quickReplies: response.suggestedActions || []
  },
  metadata: {
    intent: response.detectedIntent,
    confidence: response.confidence,
    processingTime: response.processingTime
  }
};
```

### n8n Security Configuration

#### Authentication Setup
```json
{
  "name": "Chat API Authentication",
  "type": "headerAuth",
  "credentials": {
    "name": "X-Webhook-Secret",
    "value": "your-secure-webhook-secret"
  }
}
```

#### Webhook URL Configuration
```
Production: https://your-domain.com/webhook/chat-response
Development: https://your-ngrok-url.com/webhook/chat-response
```

---

## Security Implementation

### Authentication & Authorization

#### Webhook Security
```typescript
// Webhook signature verification
import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage in webhook endpoint
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-webhook-signature');
  
  if (!signature || !verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Process webhook...
}
```

#### Rate Limiting
```typescript
// Rate limiting implementation
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function rateLimitCheck(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
  
  return { limit, reset, remaining };
}
```

#### Input Validation
```typescript
import { z } from 'zod';

export const SendMessageSchema = z.object({
  sessionId: z.string().cuid(),
  content: z.string().min(1).max(1000),
  messageType: z.enum(['text', 'quick_reply']).default('text'),
  metadata: z.record(z.any()).optional()
});

export const WebhookResponseSchema = z.object({
  sessionId: z.string().cuid(),
  response: z.object({
    content: z.string().min(1),
    type: z.enum(['text', 'quick_reply', 'rich_content']),
    quickReplies: z.array(z.string()).optional(),
    attachments: z.array(z.object({
      type: z.enum(['image', 'file', 'link']),
      url: z.string().url(),
      title: z.string().optional()
    })).optional()
  }),
  metadata: z.record(z.any()).optional()
});
```

### Data Protection

#### Session Management
- Session expiration: 24 hours for guests, 7 days for authenticated users
- Automatic cleanup of expired sessions and messages
- Secure session ID generation using cryptographically strong random values

#### Data Retention
```typescript
// Cleanup job for old chat data
export async function cleanupOldChatData() {
  const expiredSessions = await prisma.chatSession.findMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 days
      ]
    }
  });

  for (const session of expiredSessions) {
    await prisma.chatMessage.deleteMany({
      where: { sessionId: session.id }
    });
    
    await prisma.chatSession.delete({
      where: { id: session.id }
    });
  }
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-2)

#### Week 1: Database & API Foundation
**Objectives:**
- Set up database schema
- Implement basic API endpoints
- Create queue processing system

**Tasks Checklist:**
- [ ] Add Prisma schema for chat tables
- [ ] Run database migrations
- [ ] Implement `/api/chat/session` endpoint
- [ ] Implement `/api/chat/send` endpoint
- [ ] Implement `/api/chat/webhook` endpoint
- [ ] Create queue worker for webhook processing
- [ ] Add webhook signature verification
- [ ] Implement rate limiting
- [ ] Add basic error handling and logging
- [ ] Create unit tests for API endpoints

**Deliverables:**
- Working API endpoints with validation
- Database schema implementation
- Basic webhook processing system
- Test suite for core functionality

#### Week 2: Queue System & Reliability
**Objectives:**
- Implement robust queue processing
- Add retry mechanisms
- Create monitoring capabilities

**Tasks Checklist:**
- [ ] Implement exponential backoff for retries
- [ ] Add dead letter queue for failed messages
- [ ] Create queue monitoring dashboard
- [ ] Implement webhook health checks
- [ ] Add comprehensive logging
- [ ] Create admin endpoints for queue management
- [ ] Implement message status tracking
- [ ] Add queue performance metrics
- [ ] Create automated queue cleanup jobs
- [ ] Load testing for queue system

**Deliverables:**
- Production-ready queue system
- Monitoring and alerting setup
- Performance benchmarks
- Administrative tools

### Phase 2: Frontend Chat Interface (Weeks 2-3)

#### Week 2-3: Basic Chat UI
**Objectives:**
- Create chat widget component
- Implement message display
- Add basic real-time updates

**Tasks Checklist:**
- [ ] Design chat widget UI/UX
- [ ] Implement ChatWidget component
- [ ] Create MessageList and MessageItem components
- [ ] Implement MessageInput component
- [ ] Add chat session management
- [ ] Implement polling for message updates
- [ ] Add typing indicators
- [ ] Create chat state management
- [ ] Add responsive design for mobile
- [ ] Implement accessibility features (ARIA labels, keyboard navigation)
- [ ] Add loading states and error handling
- [ ] Create chat widget positioning options

**Deliverables:**
- Functional chat widget
- Mobile-responsive design
- Accessibility compliance
- Chat state management system

### Phase 3: Real-time Enhancement (Weeks 3-4)

#### Week 3-4: WebSocket Implementation
**Objectives:**
- Replace polling with WebSocket
- Add real-time features
- Optimize performance

**Tasks Checklist:**
- [ ] Set up WebSocket server infrastructure
- [ ] Implement WebSocket connection handling
- [ ] Create WebSocket client hooks
- [ ] Add real-time message delivery
- [ ] Implement connection recovery
- [ ] Add typing indicators with WebSocket
- [ ] Create presence management
- [ ] Implement message status updates
- [ ] Add connection status indicators
- [ ] Optimize WebSocket performance
- [ ] Add WebSocket monitoring
- [ ] Create fallback to SSE/polling

**Deliverables:**
- Real-time chat experience
- Connection resilience
- Performance optimizations
- Monitoring capabilities

### Phase 4: Advanced Features (Weeks 4+)

#### Week 4+: Enhanced Functionality
**Objectives:**
- Add rich message types
- Implement advanced features
- Create administrative tools

**Tasks Checklist:**
- [ ] Implement quick reply buttons
- [ ] Add rich content support (images, links)
- [ ] Create chat history persistence
- [ ] Implement message search
- [ ] Add file upload capability
- [ ] Create admin dashboard for chat monitoring
- [ ] Implement chat analytics
- [ ] Add conversation transcripts
- [ ] Create customer satisfaction ratings
- [ ] Implement chat routing (if multiple agents)
- [ ] Add conversation tags and categorization
- [ ] Create export functionality for chat data

**Deliverables:**
- Rich chat experience
- Administrative tools
- Analytics and reporting
- Data export capabilities

---

## Risk Assessment

### Technical Risks

#### High Risk
1. **n8n Service Availability**
   - **Impact**: Chat becomes non-functional
   - **Probability**: Medium
   - **Mitigation**: 
     - Implement robust retry mechanisms
     - Create fallback response system
     - Monitor n8n health continuously
     - Have backup response templates

2. **WebSocket Connection Failures**
   - **Impact**: Real-time updates fail
   - **Probability**: Medium
   - **Mitigation**:
     - Implement automatic reconnection
     - Fallback to SSE or polling
     - Connection health monitoring
     - User notification of connection issues

#### Medium Risk
3. **Database Performance Under Load**
   - **Impact**: Slow response times, timeouts
   - **Probability**: Medium
   - **Mitigation**:
     - Database indexing optimization
     - Connection pooling
     - Query optimization
     - Read replicas for chat history

4. **Queue Processing Bottlenecks**
   - **Impact**: Delayed message processing
   - **Probability**: Low
   - **Mitigation**:
     - Horizontal scaling of workers
     - Queue partitioning
     - Priority queues
     - Performance monitoring

#### Low Risk
5. **Security Vulnerabilities**
   - **Impact**: Data breach, service abuse
   - **Probability**: Low
   - **Mitigation**:
     - Regular security audits
     - Input validation and sanitization
     - Rate limiting
     - Webhook signature verification

### Business Risks

1. **User Experience Degradation**
   - **Risk**: Poor chat performance affects customer satisfaction
   - **Mitigation**: Comprehensive testing, performance monitoring, user feedback loops

2. **Operational Overhead**
   - **Risk**: High maintenance burden
   - **Mitigation**: Automated monitoring, self-healing systems, comprehensive documentation

### Risk Monitoring

#### Key Metrics to Monitor
- Message delivery success rate (target: >99.5%)
- Average response time (target: <3 seconds)
- WebSocket connection stability (target: >99% uptime)
- Queue processing time (target: <1 second)
- Error rates (target: <0.1%)

#### Alerting Thresholds
- Message delivery failure rate >1%
- Average response time >5 seconds
- Queue processing delay >30 seconds
- WebSocket connection failure rate >5%
- n8n webhook failure rate >2%

---

## Testing Strategy

### Unit Testing

#### Backend Testing
```typescript
// Example test for chat API
describe('Chat API', () => {
  describe('POST /api/chat/send', () => {
    it('should create and queue a user message', async () => {
      const response = await request(app)
        .post('/api/chat/send')
        .send({
          sessionId: 'test-session-id',
          content: 'Hello, bot!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('messageId');
      expect(response.body.status).toBe('pending');

      // Verify message was stored
      const message = await prisma.chatMessage.findUnique({
        where: { id: response.body.messageId }
      });
      expect(message).toBeTruthy();
      expect(message?.content).toBe('Hello, bot!');

      // Verify webhook was queued
      const webhookJob = await prisma.chatWebhookQueue.findFirst({
        where: { messageId: response.body.messageId }
      });
      expect(webhookJob).toBeTruthy();
    });

    it('should validate message content', async () => {
      await request(app)
        .post('/api/chat/send')
        .send({
          sessionId: 'test-session-id',
          content: '' // Empty content should fail
        })
        .expect(400);
    });

    it('should rate limit excessive requests', async () => {
      const sessionId = 'test-session-id';
      
      // Send messages up to rate limit
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/chat/send')
          .send({
            sessionId,
            content: `Message ${i}`
          })
          .expect(200);
      }

      // Next request should be rate limited
      await request(app)
        .post('/api/chat/send')
        .send({
          sessionId,
          content: 'Rate limited message'
        })
        .expect(429);
    });
  });

  describe('Queue Processing', () => {
    it('should process webhook queue successfully', async () => {
      // Create a test message and webhook job
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: 'test-session',
          senderType: 'user',
          content: 'Test message',
          status: 'pending'
        }
      });

      const webhookJob = await prisma.chatWebhookQueue.create({
        data: {
          messageId: message.id,
          webhookUrl: 'https://test-n8n-url.com/webhook',
          payload: { content: 'Test message' }
        }
      });

      // Mock successful webhook response
      nock('https://test-n8n-url.com')
        .post('/webhook')
        .reply(200, {
          sessionId: 'test-session',
          response: {
            content: 'Test response',
            type: 'text'
          }
        });

      // Process the queue
      await processWebhookQueue();

      // Verify job was completed
      const updatedJob = await prisma.chatWebhookQueue.findUnique({
        where: { id: webhookJob.id }
      });
      expect(updatedJob?.status).toBe('completed');

      // Verify response message was created
      const responseMessage = await prisma.chatMessage.findFirst({
        where: {
          sessionId: 'test-session',
          senderType: 'bot'
        }
      });
      expect(responseMessage).toBeTruthy();
      expect(responseMessage?.content).toBe('Test response');
    });
  });
});
```

#### Frontend Testing
```typescript
// Example test for chat component
describe('ChatWidget', () => {
  it('should render chat bubble initially', () => {
    render(<ChatWidget />);
    expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument();
  });

  it('should expand chat window when bubble is clicked', async () => {
    render(<ChatWidget />);
    
    const chatBubble = screen.getByRole('button', { name: /open chat/i });
    fireEvent.click(chatBubble);

    expect(await screen.findByRole('textbox', { name: /type a message/i })).toBeInTheDocument();
  });

  it('should send message when form is submitted', async () => {
    const mockSendMessage = jest.fn();
    jest.mocked(useChat).mockReturnValue({
      sessionId: 'test-session',
      messages: [],
      isLoading: false,
      isConnected: true,
      sendMessage: mockSendMessage,
      loadHistory: jest.fn(),
      clearHistory: jest.fn()
    });

    render(<ChatWidget />);
    
    // Expand chat
    fireEvent.click(screen.getByRole('button', { name: /open chat/i }));
    
    // Type and send message
    const input = await screen.findByRole('textbox', { name: /type a message/i });
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockSendMessage).toHaveBeenCalledWith('Hello');
  });
});
```

### Integration Testing

#### API Integration Tests
```typescript
describe('Chat Integration', () => {
  it('should handle full message flow', async () => {
    // 1. Create session
    const sessionResponse = await request(app)
      .post('/api/chat/session')
      .send({ userId: 'test-user' })
      .expect(200);

    const { sessionId } = sessionResponse.body;

    // 2. Send message
    const messageResponse = await request(app)
      .post('/api/chat/send')
      .send({
        sessionId,
        content: 'Hello, I need help with my order'
      })
      .expect(200);

    // 3. Simulate n8n webhook response
    const webhookSignature = generateWebhookSignature({
      sessionId,
      response: {
        content: 'I can help you with your order. What\'s your order number?',
        type: 'text'
      }
    });

    await request(app)
      .post('/api/chat/webhook')
      .set('X-Webhook-Signature', webhookSignature)
      .send({
        sessionId,
        response: {
          content: 'I can help you with your order. What\'s your order number?',
          type: 'text'
        }
      })
      .expect(200);

    // 4. Verify conversation in database
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].senderType).toBe('user');
    expect(messages[0].content).toBe('Hello, I need help with my order');
    expect(messages[1].senderType).toBe('bot');
    expect(messages[1].content).toBe('I can help you with your order. What\'s your order number?');
  });
});
```

### Load Testing

#### Performance Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 120
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Chat conversation flow"
    weight: 100
    flow:
      - post:
          url: "/api/chat/session"
          json:
            userId: "{{ $randomString() }}"
          capture:
            - json: "$.sessionId"
              as: "sessionId"
      - loop:
          - post:
              url: "/api/chat/send"
              json:
                sessionId: "{{ sessionId }}"
                content: "Test message {{ $randomInt(1, 1000) }}"
          - think: 2
        count: 5
```

### End-to-End Testing

#### Playwright E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test.describe('Chat Widget', () => {
  test('should complete a full chat conversation', async ({ page }) => {
    await page.goto('/');

    // Open chat widget
    await page.click('[data-testid="chat-bubble"]');
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

    // Send a message
    await page.fill('[data-testid="message-input"]', 'Hello, I need help');
    await page.click('[data-testid="send-button"]');

    // Verify message appears
    await expect(page.locator('[data-testid="message-user"]')).toContainText('Hello, I need help');

    // Wait for bot response (mocked in test environment)
    await expect(page.locator('[data-testid="message-bot"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="message-bot"]')).toContainText('How can I help you today?');

    // Test message history persistence
    await page.reload();
    await page.click('[data-testid="chat-bubble"]');
    
    // Messages should still be visible
    await expect(page.locator('[data-testid="message-user"]')).toContainText('Hello, I need help');
    await expect(page.locator('[data-testid="message-bot"]')).toContainText('How can I help you today?');
  });

  test('should handle connection failures gracefully', async ({ page }) => {
    // Simulate network offline
    await page.context().setOffline(true);
    
    await page.goto('/');
    await page.click('[data-testid="chat-bubble"]');
    
    // Try to send message while offline
    await page.fill('[data-testid="message-input"]', 'Test offline message');
    await page.click('[data-testid="send-button"]');
    
    // Should show error state
    await expect(page.locator('[data-testid="connection-error"]')).toBeVisible();
    
    // Restore connection
    await page.context().setOffline(false);
    
    // Error should clear and message should be sent
    await expect(page.locator('[data-testid="connection-error"]')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="message-user"]')).toContainText('Test offline message');
  });
});
```

---

## Deployment Guide

### Environment Setup

#### Environment Variables
```bash
# Chat Configuration
CHAT_ENABLED=true
CHAT_WEBHOOK_SECRET=your-secure-webhook-secret
CHAT_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat
CHAT_SESSION_TIMEOUT=86400000  # 24 hours in milliseconds
CHAT_MAX_MESSAGE_LENGTH=1000
CHAT_RATE_LIMIT_WINDOW=60000   # 1 minute in milliseconds
CHAT_RATE_LIMIT_MAX=10         # 10 messages per minute

# WebSocket Configuration
WEBSOCKET_ENABLED=true
WEBSOCKET_PORT=3001
WEBSOCKET_HEARTBEAT_INTERVAL=30000

# Queue Configuration
CHAT_QUEUE_WORKER_CONCURRENCY=5
CHAT_QUEUE_RETRY_ATTEMPTS=3
CHAT_QUEUE_RETRY_DELAY=1000    # Initial delay in milliseconds

# Redis Configuration (optional for scaling)
REDIS_URL=redis://localhost:6379
REDIS_SESSION_PREFIX=chat:session:
REDIS_QUEUE_PREFIX=chat:queue:

# Monitoring
CHAT_METRICS_ENABLED=true
CHAT_LOG_LEVEL=info
```

#### Production Environment Setup

**Docker Configuration**
```dockerfile
# Add to existing Dockerfile
FROM node:18-alpine

# Install additional dependencies for WebSocket
RUN npm install -g socket.io ws

# Copy chat-specific files
COPY src/components/chat ./src/components/chat
COPY src/lib/chat ./src/lib/chat

# Environment for chat
ENV CHAT_ENABLED=true
ENV WEBSOCKET_ENABLED=true

EXPOSE 3000 3001

CMD ["npm", "run", "start"]
```

**Docker Compose Configuration**
```yaml
# docker-compose.yml additions
services:
  app:
    environment:
      - CHAT_ENABLED=true
      - WEBSOCKET_ENABLED=true
      - CHAT_N8N_WEBHOOK_URL=${CHAT_N8N_WEBHOOK_URL}
      - CHAT_WEBHOOK_SECRET=${CHAT_WEBHOOK_SECRET}
    ports:
      - "3000:3000"
      - "3001:3001"  # WebSocket port

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  queue-worker:
    build: .
    command: npm run queue:worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - CHAT_N8N_WEBHOOK_URL=${CHAT_N8N_WEBHOOK_URL}
      - CHAT_WEBHOOK_SECRET=${CHAT_WEBHOOK_SECRET}
    depends_on:
      - db
      - redis

volumes:
  redis_data:
```

### Database Migration

```sql
-- Migration: Add chat system tables
-- File: prisma/migrations/xxxx_add_chat_system/migration.sql

-- Create chat sessions table
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "guest_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- Create chat messages table
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'delivered',
    "webhook_attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- Create chat webhook queue table
CREATE TABLE "chat_webhook_queue" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "webhook_url" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_webhook_queue_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_webhook_queue" ADD CONSTRAINT "chat_webhook_queue_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "chat_sessions_user_id_idx" ON "chat_sessions"("user_id");
CREATE INDEX "chat_sessions_status_idx" ON "chat_sessions"("status");
CREATE INDEX "chat_sessions_expires_at_idx" ON "chat_sessions"("expires_at");
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages"("session_id");
CREATE INDEX "chat_messages_status_idx" ON "chat_messages"("status");
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages"("created_at");
CREATE INDEX "chat_webhook_queue_status_idx" ON "chat_webhook_queue"("status");
CREATE INDEX "chat_webhook_queue_next_retry_idx" ON "chat_webhook_queue"("next_retry_at");
CREATE INDEX "chat_webhook_queue_message_id_idx" ON "chat_webhook_queue"("message_id");
```

### Queue Worker Deployment

#### Standalone Queue Worker
```typescript
// scripts/queue-worker.ts
import { PrismaClient } from '@prisma/client';
import { processWebhookQueue } from '../src/lib/chat/queue-processor';

const prisma = new PrismaClient();

async function startQueueWorker() {
  console.log('Starting chat webhook queue worker...');
  
  // Process queue every 5 seconds
  setInterval(async () => {
    try {
      await processWebhookQueue();
    } catch (error) {
      console.error('Queue processing error:', error);
    }
  }, 5000);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down queue worker...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

startQueueWorker().catch(console.error);
```

#### PM2 Configuration
```json
{
  "apps": [
    {
      "name": "chat-queue-worker",
      "script": "npm",
      "args": "run queue:worker",
      "instances": 2,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production"
      },
      "error_file": "./logs/queue-worker-error.log",
      "out_file": "./logs/queue-worker-out.log",
      "log_file": "./logs/queue-worker.log"
    }
  ]
}
```

### Load Balancer Configuration

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/chat-app
upstream app_servers {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;  # Additional instance if needed
}

upstream websocket_servers {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Regular HTTP traffic
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket traffic
    location /socket.io/ {
        proxy_pass http://websocket_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Chat API endpoints
    location /api/chat/ {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for webhook processing
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }
}
```

### SSL/TLS Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Rest of configuration...
}
```

---

## Monitoring & Maintenance

### Application Monitoring

#### Health Check Endpoints
```typescript
// /api/chat/health
export async function GET() {
  try {
    // Check database connectivity
    await prisma.chatSession.findFirst();
    
    // Check queue processing
    const pendingJobs = await prisma.chatWebhookQueue.count({
      where: { status: 'pending' }
    });
    
    // Check n8n webhook connectivity
    const webhookHealthy = await checkN8nWebhookHealth();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'healthy',
        queue: pendingJobs < 100 ? 'healthy' : 'warning',
        webhook: webhookHealthy ? 'healthy' : 'unhealthy'
      },
      metrics: {
        pendingWebhooks: pendingJobs,
        activeSessions: await getActiveSessionCount(),
        messagesLast24h: await getMessageCount24h()
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
```

#### Metrics Collection
```typescript
// lib/chat/metrics.ts
export class ChatMetrics {
  private static instance: ChatMetrics;
  private metrics: Map<string, number> = new Map();

  static getInstance(): ChatMetrics {
    if (!ChatMetrics.instance) {
      ChatMetrics.instance = new ChatMetrics();
    }
    return ChatMetrics.instance;
  }

  increment(metric: string, value: number = 1) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  getMetric(metric: string): number {
    return this.metrics.get(metric) || 0;
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Key metrics to track
  recordMessageSent() {
    this.increment('messages_sent');
  }

  recordMessageDelivered() {
    this.increment('messages_delivered');
  }

  recordWebhookFailure() {
    this.increment('webhook_failures');
  }

  recordSessionCreated() {
    this.increment('sessions_created');
  }

  recordResponseTime(duration: number) {
    this.increment('total_response_time', duration);
    this.increment('response_count');
  }

  getAverageResponseTime(): number {
    const total = this.getMetric('total_response_time');
    const count = this.getMetric('response_count');
    return count > 0 ? total / count : 0;
  }
}
```

### Logging Strategy

#### Structured Logging
```typescript
// lib/chat/logger.ts
import winston from 'winston';

export const chatLogger = winston.createLogger({
  level: process.env.CHAT_LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'chat-system' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/chat-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/chat-combined.log' 
    }),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ] : [])
  ]
});

// Usage examples
export function logMessageSent(sessionId: string, messageId: string, userId?: string) {
  chatLogger.info('Message sent', {
    event: 'message_sent',
    sessionId,
    messageId,
    userId,
    timestamp: new Date().toISOString()
  });
}

export function logWebhookFailure(messageId: string, error: Error, attempt: number) {
  chatLogger.error('Webhook processing failed', {
    event: 'webhook_failure',
    messageId,
    error: error.message,
    stack: error.stack,
    attempt,
    timestamp: new Date().toISOString()
  });
}
```

### Alerting Configuration

#### Alert Rules
```typescript
// lib/chat/alerts.ts
export interface AlertRule {
  id: string;
  name: string;
  condition: () => Promise<boolean>;
  severity: 'critical' | 'warning' | 'info';
  cooldown: number; // minutes
}

export const alertRules: AlertRule[] = [
  {
    id: 'high_webhook_failure_rate',
    name: 'High Webhook Failure Rate',
    condition: async () => {
      const failureRate = await getWebhookFailureRate();
      return failureRate > 0.05; // 5% failure rate
    },
    severity: 'critical',
    cooldown: 15
  },
  {
    id: 'queue_processing_delay',
    name: 'Queue Processing Delay',
    condition: async () => {
      const avgDelay = await getAverageQueueDelay();
      return avgDelay > 30000; // 30 seconds
    },
    severity: 'warning',
    cooldown: 10
  },
  {
    id: 'high_response_time',
    name: 'High Response Time',
    condition: async () => {
      const avgResponseTime = ChatMetrics.getInstance().getAverageResponseTime();
      return avgResponseTime > 5000; // 5 seconds
    },
    severity: 'warning',
    cooldown: 5
  }
];

export async function checkAlerts() {
  for (const rule of alertRules) {
    try {
      const shouldAlert = await rule.condition();
      if (shouldAlert) {
        await sendAlert(rule);
      }
    } catch (error) {
      chatLogger.error('Alert check failed', {
        rule: rule.id,
        error: error.message
      });
    }
  }
}
```

### Maintenance Tasks

#### Automated Cleanup Jobs
```typescript
// scripts/cleanup-chat-data.ts
import cron from 'node-cron';

// Run cleanup daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  chatLogger.info('Starting daily chat data cleanup');
  
  try {
    // Clean up expired sessions
    const expiredSessions = await prisma.chatSession.findMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { 
            createdAt: { 
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
            } 
          }
        ]
      }
    });

    for (const session of expiredSessions) {
      await prisma.chatMessage.deleteMany({
        where: { sessionId: session.id }
      });
      
      await prisma.chatSession.delete({
        where: { id: session.id }
      });
    }

    // Clean up completed webhook jobs older than 7 days
    await prisma.chatWebhookQueue.deleteMany({
      where: {
        status: 'completed',
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    chatLogger.info('Chat data cleanup completed', {
      expiredSessionsRemoved: expiredSessions.length
    });
  } catch (error) {
    chatLogger.error('Chat data cleanup failed', { error: error.message });
  }
});
```

#### Database Maintenance
```sql
-- Monthly database maintenance queries

-- Analyze and update table statistics
ANALYZE chat_sessions;
ANALYZE chat_messages;
ANALYZE chat_webhook_queue;

-- Reindex frequently queried tables
REINDEX INDEX chat_messages_session_id_idx;
REINDEX INDEX chat_messages_created_at_idx;
REINDEX INDEX chat_webhook_queue_status_idx;

-- Clean up orphaned records (run with caution)
DELETE FROM chat_messages 
WHERE session_id NOT IN (SELECT id FROM chat_sessions);

-- Update table statistics for query planner
UPDATE pg_stat_user_tables SET n_tup_upd = n_tup_upd + 1 
WHERE relname IN ('chat_sessions', 'chat_messages', 'chat_webhook_queue');
```

### Performance Optimization

#### Database Query Optimization
```typescript
// Optimized queries for common operations
export async function getRecentMessagesOptimized(
  sessionId: string, 
  limit: number = 50
): Promise<ChatMessage[]> {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      senderType: true,
      content: true,
      messageType: true,
      status: true,
      createdAt: true,
      // Don't select metadata unless needed
    }
  });
}

export async function getActiveSessionsCount(): Promise<number> {
  // Use database aggregation instead of fetching all records
  const result = await prisma.chatSession.aggregate({
    where: {
      status: 'active',
      expiresAt: { gt: new Date() }
    },
    _count: { id: true }
  });
  
  return result._count.id;
}
```

#### Caching Strategy
```typescript
// Redis caching for frequently accessed data
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedSessionData(sessionId: string): Promise<any> {
  const cacheKey = `chat:session:${sessionId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const sessionData = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });
  
  if (sessionData) {
    await redis.setex(cacheKey, 300, JSON.stringify(sessionData)); // 5 minute cache
  }
  
  return sessionData;
}
```

---

## Conclusion

This comprehensive implementation guide provides a robust foundation for integrating a chatbot system with n8n webhook processing into your e-commerce platform. The async queue-based architecture ensures reliability and scalability while maintaining an excellent user experience through real-time WebSocket communication.

### Key Success Factors

1. **Reliability**: Queue-based processing with retry mechanisms ensures message delivery
2. **Performance**: WebSocket real-time updates provide immediate user feedback
3. **Scalability**: Horizontal scaling of queue workers and database optimization
4. **Security**: Comprehensive authentication, validation, and rate limiting
5. **Maintainability**: Clear separation of concerns and comprehensive monitoring

### Next Steps

1. Review and approve the implementation plan
2. Set up development environment and n8n instance
3. Begin Phase 1 implementation following the detailed checklist
4. Establish monitoring and alerting before going to production
5. Plan for gradual rollout with feature flags

The system is designed to grow with your business needs while maintaining high availability and user satisfaction. Regular monitoring of the key metrics will ensure optimal performance and quick identification of any issues.

For questions or clarifications during implementation, refer to the specific sections of this guide or consult the n8n documentation for webhook-specific configurations.