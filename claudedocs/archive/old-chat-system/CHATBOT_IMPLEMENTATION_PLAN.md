# Chatbot Implementation Phase Plan
## Step-by-Step Execution Guide

---

## Overview

This document provides a detailed phase plan for implementing the chatbot system with n8n webhook integration. Each phase includes specific steps, checklists, and deliverables.

**Architecture Chosen**: Async Queue-Based with Real-time Updates
**Estimated Timeline**: 4-6 weeks
**Team Size**: 1-2 developers
**Deployment**: Hostinger VPS with PM2 + Nginx
**Authentication**: HMAC signature verification
**Response Type**: Text + Quick Replies (optimized for efficiency)

---

## Phase 1: Core Infrastructure (Week 1-2)

### Week 1: Database & API Foundation

#### Step 1.1: Database Schema Setup
**Duration**: 1-2 days

**Tasks:**
- [ ] Add Prisma schema models for chat system
- [ ] Create and run database migration
- [ ] Verify schema in database

**Checklist:**
```bash
# 1. Add to prisma/schema.prisma
- [ ] Add ChatSession model
- [ ] Add ChatMessage model  
- [ ] Add ChatWebhookQueue model
- [ ] Add User relation updates

# 2. Generate and run migration
- [ ] npx prisma migrate dev --name add_chat_system
- [ ] npx prisma generate
- [ ] Verify tables created in database
- [ ] Test basic CRUD operations
```

**Files to Create:**
- `prisma/migrations/xxxx_add_chat_system/migration.sql`

**Validation:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_sessions', 'chat_messages', 'chat_webhook_queue');
```

#### Step 1.2: API Endpoints Development
**Duration**: 2-3 days

**Tasks:**
- [ ] Create chat API structure
- [ ] Implement session management
- [ ] Implement message handling
- [ ] Add webhook endpoint

**Checklist:**
```bash
# 1. Create API structure
- [ ] Create src/app/api/chat/session/route.ts
- [ ] Create src/app/api/chat/send/route.ts
- [ ] Create src/app/api/chat/webhook/route.ts
- [ ] Create src/app/api/chat/messages/[sessionId]/route.ts

# 2. Implement validation schemas
- [ ] Create src/lib/chat/validation.ts
- [ ] Add Zod schemas for all endpoints
- [ ] Implement input sanitization

# 3. Add error handling
- [ ] Create src/lib/chat/errors.ts
- [ ] Implement consistent error responses
- [ ] Add error logging
```

**Files to Create:**
- `src/app/api/chat/session/route.ts`
- `src/app/api/chat/send/route.ts`
- `src/app/api/chat/webhook/route.ts`
- `src/app/api/chat/messages/[sessionId]/route.ts`
- `src/lib/chat/validation.ts`
- `src/lib/chat/errors.ts`

**Testing:**
```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/chat/session \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'

curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-session","content":"Hello"}'
```

#### Step 1.3: Queue System Implementation
**Duration**: 2-3 days

**Tasks:**
- [ ] Create queue processor
- [ ] Implement webhook worker
- [ ] Add retry logic
- [ ] Configure queue monitoring

**Checklist:**
```bash
# 1. Create queue processor
- [ ] Create src/lib/chat/queue-processor.ts
- [ ] Implement processWebhookQueue function
- [ ] Add exponential backoff retry logic
- [ ] Add dead letter queue handling

# 2. Create webhook service
- [ ] Create src/lib/chat/webhook-service.ts
- [ ] Implement sendToN8n function
- [ ] Add webhook signature generation
- [ ] Add response handling

# 3. Add queue worker
- [ ] Create scripts/queue-worker.ts
- [ ] Add package.json script "queue:worker"
- [ ] Test queue processing locally
```

**Files to Create:**
- `src/lib/chat/queue-processor.ts`
- `src/lib/chat/webhook-service.ts`
- `scripts/queue-worker.ts`

**Environment Variables:**
```bash
# n8n Integration (to be provided by stakeholder)
CHAT_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat
CHAT_WEBHOOK_SECRET=your-secure-webhook-secret

# Queue Configuration
CHAT_QUEUE_WORKER_CONCURRENCY=5
CHAT_QUEUE_RETRY_ATTEMPTS=3
CHAT_QUEUE_RETRY_DELAY=1000

# Hostinger VPS Optimization
NODE_ENV=production
PORT=3000
WEBSOCKET_PORT=3001
```

### Week 2: Security & Reliability

#### Step 2.1: Security Implementation
**Duration**: 1-2 days

**Tasks:**
- [ ] Implement webhook signature verification
- [ ] Add rate limiting
- [ ] Implement input validation
- [ ] Add authentication checks

**Checklist:**
```bash
# 1. Webhook security
- [ ] Create src/lib/chat/security.ts
- [ ] Implement HMAC signature verification
- [ ] Add signature validation to webhook endpoint
- [ ] Test with invalid signatures

# 2. Rate limiting
- [ ] Install @upstash/ratelimit (if using Redis)
- [ ] Implement rate limiting middleware
- [ ] Add rate limiting to send endpoint
- [ ] Test rate limiting functionality

# 3. Input validation
- [ ] Add comprehensive Zod schemas
- [ ] Implement request sanitization
- [ ] Add XSS protection
- [ ] Test with malicious inputs
```

**Files to Create:**
- `src/lib/chat/security.ts`
- `src/middleware/rate-limit.ts`

#### Step 2.2: Error Handling & Logging
**Duration**: 1 day

**Tasks:**
- [ ] Implement structured logging
- [ ] Add error handling middleware
- [ ] Create monitoring endpoints
- [ ] Add health checks

**Checklist:**
```bash
# 1. Logging setup
- [ ] Install winston
- [ ] Create src/lib/chat/logger.ts
- [ ] Add structured logging to all endpoints
- [ ] Configure log rotation

# 2. Health checks
- [ ] Create src/app/api/chat/health/route.ts
- [ ] Add database connectivity check
- [ ] Add n8n webhook health check
- [ ] Add queue status check
```

**Files to Create:**
- `src/lib/chat/logger.ts`
- `src/app/api/chat/health/route.ts`

#### Step 2.3: Testing Infrastructure
**Duration**: 2 days

**Tasks:**
- [ ] Set up testing framework
- [ ] Create unit tests
- [ ] Create integration tests
- [ ] Add test data fixtures

**Checklist:**
```bash
# 1. Test setup
- [ ] Configure Jest for chat tests
- [ ] Create test database setup
- [ ] Add test environment variables
- [ ] Create mock n8n webhook

# 2. Unit tests
- [ ] Test API endpoints
- [ ] Test queue processor
- [ ] Test security functions
- [ ] Test validation schemas

# 3. Integration tests
- [ ] Test complete message flow
- [ ] Test webhook processing
- [ ] Test error scenarios
- [ ] Test rate limiting
```

**Files to Create:**
- `src/lib/chat/__tests__/api.test.ts`
- `src/lib/chat/__tests__/queue.test.ts`
- `src/lib/chat/__tests__/security.test.ts`

---

## Phase 2: Frontend Chat Interface (Week 2-3)

### Week 2-3: Core Chat UI

#### Step 2.1: Component Architecture
**Duration**: 1 day

**Tasks:**
- [ ] Design component structure
- [ ] Create base components
- [ ] Set up state management
- [ ] Configure styling

**Checklist:**
```bash
# 1. Component structure
- [ ] Create src/components/chat/ directory
- [ ] Plan component hierarchy
- [ ] Create TypeScript interfaces
- [ ] Set up component exports

# 2. Styling setup
- [ ] Add chat-specific Tailwind classes
- [ ] Create CSS modules if needed
- [ ] Design responsive breakpoints
- [ ] Plan theme variations
```

**Files to Create:**
- `src/components/chat/types.ts`
- `src/components/chat/index.ts`

#### Step 2.2: Chat Widget Implementation
**Duration**: 2-3 days

**Tasks:**
- [ ] Create chat bubble component
- [ ] Implement chat window
- [ ] Add message components
- [ ] Implement input handling

**Checklist:**
```bash
# 1. Chat bubble
- [ ] Create ChatBubble.tsx
- [ ] Add expand/collapse functionality
- [ ] Implement positioning options
- [ ] Add animation effects

# 2. Chat window
- [ ] Create ChatWindow.tsx
- [ ] Implement resizable interface
- [ ] Add header with controls
- [ ] Implement scroll behavior

# 3. Message components
- [ ] Create MessageList.tsx
- [ ] Create MessageItem.tsx
- [ ] Add message types (user/bot)
- [ ] Implement message timestamps

# 4. Input handling
- [ ] Create MessageInput.tsx
- [ ] Add send button
- [ ] Implement keyboard shortcuts
- [ ] Add character limits
```

**Files to Create:**
- `src/components/chat/ChatBubble.tsx`
- `src/components/chat/ChatWindow.tsx`
- `src/components/chat/MessageList.tsx`
- `src/components/chat/MessageItem.tsx`
- `src/components/chat/MessageInput.tsx`

#### Step 2.3: State Management & Hooks
**Duration**: 2 days

**Tasks:**
- [ ] Create chat context
- [ ] Implement custom hooks
- [ ] Add session management
- [ ] Implement message handling

**Checklist:**
```bash
# 1. Context setup
- [ ] Create ChatProvider.tsx
- [ ] Define chat state interface
- [ ] Implement state reducers
- [ ] Add context methods

# 2. Custom hooks
- [ ] Create useChat.ts
- [ ] Create useChatHistory.ts
- [ ] Add session persistence
- [ ] Implement optimistic updates

# 3. API integration
- [ ] Add fetch utilities
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Test API connections
```

**Files to Create:**
- `src/components/chat/ChatProvider.tsx`
- `src/components/chat/hooks/useChat.ts`
- `src/components/chat/hooks/useChatHistory.ts`
- `src/lib/chat/api-client.ts`

#### Step 2.4: Basic Real-time Updates
**Duration**: 1-2 days

**Tasks:**
- [ ] Implement polling mechanism
- [ ] Add message status indicators
- [ ] Create typing indicators
- [ ] Add connection status

**Checklist:**
```bash
# 1. Polling implementation
- [ ] Create polling hook
- [ ] Add configurable intervals
- [ ] Implement smart polling
- [ ] Add background/foreground handling

# 2. Status indicators
- [ ] Add message status icons
- [ ] Implement typing indicator
- [ ] Add connection status badge
- [ ] Create loading animations
```

**Files to Create:**
- `src/components/chat/hooks/usePolling.ts`
- `src/components/chat/TypingIndicator.tsx`
- `src/components/chat/ConnectionStatus.tsx`

---

## Phase 3: Real-time Enhancement (Week 3-4)

### Week 3-4: WebSocket Implementation

#### Step 3.1: WebSocket Server Setup
**Duration**: 1-2 days

**Tasks:**
- [ ] Choose WebSocket library
- [ ] Set up WebSocket server
- [ ] Implement connection handling
- [ ] Add authentication

**Checklist:**
```bash
# 1. Library selection
- [ ] Evaluate Socket.io vs native WebSocket
- [ ] Install chosen library
- [ ] Configure server setup
- [ ] Plan event structure

# 2. Server implementation
- [ ] Create WebSocket server file
- [ ] Add connection event handlers
- [ ] Implement room management
- [ ] Add authentication middleware

# 3. Integration
- [ ] Add WebSocket to Next.js
- [ ] Configure development setup
- [ ] Test basic connections
- [ ] Add error handling
```

**Files to Create:**
- `src/lib/websocket/server.ts`
- `src/lib/websocket/events.ts`
- `scripts/websocket-server.ts`

**Environment Variables:**
```bash
# WebSocket Configuration for Hostinger VPS
WEBSOCKET_ENABLED=true
WEBSOCKET_PORT=3001
WEBSOCKET_HEARTBEAT_INTERVAL=30000

# Hostinger-specific settings
WEBSOCKET_CORS_ORIGIN=https://your-domain.com
WEBSOCKET_TRANSPORTS=["websocket","polling"]
```

#### Step 3.2: Client WebSocket Integration
**Duration**: 2 days

**Tasks:**
- [ ] Create WebSocket client
- [ ] Implement connection management
- [ ] Add event handlers
- [ ] Replace polling with WebSocket

**Checklist:**
```bash
# 1. Client setup
- [ ] Create useWebSocket hook
- [ ] Implement connection logic
- [ ] Add reconnection handling
- [ ] Configure event listeners

# 2. Event handling
- [ ] Handle new message events
- [ ] Implement typing events
- [ ] Add presence updates
- [ ] Handle connection status

# 3. Integration
- [ ] Update useChat hook
- [ ] Remove polling implementation
- [ ] Test real-time messaging
- [ ] Add fallback mechanisms
```

**Files to Create:**
- `src/components/chat/hooks/useWebSocket.ts`
- `src/lib/websocket/client.ts`

#### Step 3.3: Advanced Real-time Features
**Duration**: 1-2 days

**Tasks:**
- [ ] Implement typing indicators
- [ ] Add presence management
- [ ] Create message status updates
- [ ] Add performance optimizations

**Checklist:**
```bash
# 1. Typing indicators
- [ ] Add typing event emission
- [ ] Implement typing timeouts
- [ ] Show typing indicators
- [ ] Test multi-user typing

# 2. Message status
- [ ] Track message delivery
- [ ] Update message statuses
- [ ] Add read receipts
- [ ] Implement status icons

# 3. Optimizations
- [ ] Add message batching
- [ ] Implement connection pooling
- [ ] Add bandwidth optimization
- [ ] Test performance under load
```

---

## Phase 4: Advanced Features & Production (Week 4+)

### Week 4: Rich Content & Admin Tools

#### Step 4.1: Rich Message Types
**Duration**: 2-3 days

**Tasks:**
- [ ] Implement quick replies
- [ ] Add rich content support
- [ ] Create message templates
- [ ] Add media support

**Checklist:**
```bash
# 1. Quick replies
- [ ] Create QuickReply component
- [ ] Add quick reply handling
- [ ] Implement button interactions
- [ ] Style quick reply buttons

# 2. Rich content
- [ ] Support for images
- [ ] Add link previews
- [ ] Implement card layouts
- [ ] Add interactive elements

# 3. Media support
- [ ] File upload capability
- [ ] Image display
- [ ] File download links
- [ ] Media validation
```

**Files to Create:**
- `src/components/chat/QuickReply.tsx`
- `src/components/chat/RichContent.tsx`
- `src/components/chat/MediaUpload.tsx`

#### Step 4.2: Admin Dashboard
**Duration**: 2-3 days

**Tasks:**
- [ ] Create admin interface
- [ ] Add chat monitoring
- [ ] Implement analytics
- [ ] Create management tools

**Checklist:**
```bash
# 1. Admin interface
- [ ] Create admin layout
- [ ] Add authentication check
- [ ] Implement navigation
- [ ] Add responsive design

# 2. Monitoring tools
- [ ] Chat session overview
- [ ] Message statistics
- [ ] Error monitoring
- [ ] Performance metrics

# 3. Management features
- [ ] Session management
- [ ] Message history export
- [ ] User blocking
- [ ] System controls
```

**Files to Create:**
- `src/app/admin/chat/page.tsx`
- `src/components/admin/ChatDashboard.tsx`
- `src/components/admin/ChatMetrics.tsx`

### Week 5+: Production Readiness

#### Step 5.1: Performance Optimization
**Duration**: 2-3 days

**Tasks:**
- [ ] Database optimization
- [ ] Frontend performance
- [ ] Caching implementation
- [ ] Load testing

**Checklist:**
```bash
# 1. Database optimization
- [ ] Add database indexes
- [ ] Optimize queries
- [ ] Implement connection pooling
- [ ] Add query monitoring

# 2. Frontend optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Bundle optimization
- [ ] Performance monitoring

# 3. Caching
- [ ] Redis implementation
- [ ] Session caching
- [ ] Message caching
- [ ] Cache invalidation

# 4. Load testing
- [ ] Artillery configuration
- [ ] Performance benchmarks
- [ ] Stress testing
- [ ] Bottleneck identification
```

#### Step 5.2: Hostinger VPS Deployment
**Duration**: 2-3 days

**Tasks:**
- [ ] Hostinger VPS environment setup
- [ ] PM2 process management configuration
- [ ] Nginx reverse proxy setup
- [ ] SSL certificate installation
- [ ] Monitoring setup
- [ ] Documentation

**Checklist:**
```bash
# 1. Hostinger VPS setup
- [ ] Configure Node.js environment
- [ ] Install PM2 globally
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Set up file permissions

# 2. Process management
- [ ] Create PM2 ecosystem file
- [ ] Configure app and queue worker processes
- [ ] Set up PM2 startup scripts
- [ ] Configure log rotation

# 3. Web server
- [ ] Install and configure Nginx
- [ ] Set up reverse proxy
- [ ] Configure WebSocket support
- [ ] Install SSL certificates (Let's Encrypt)

# 4. Monitoring & Security
- [ ] Configure PM2 monitoring
- [ ] Set up log aggregation
- [ ] Configure firewall rules
- [ ] Set up automated backups

# 5. Documentation
- [ ] Hostinger deployment guide
- [ ] PM2 operations manual
- [ ] Troubleshooting guide
- [ ] Backup/restore procedures
```

---

## n8n Workflow Setup

### Step 1: Basic n8n Workflow
**Duration**: 1-2 days

**Tasks:**
- [ ] Create n8n workflow
- [ ] Configure webhook trigger
- [ ] Implement basic response
- [ ] Test integration

**Checklist:**
```bash
# 1. Workflow creation
- [ ] Create new workflow in n8n
- [ ] Add webhook trigger node
- [ ] Configure webhook authentication
- [ ] Set webhook URL in application

# 2. Basic processing
- [ ] Add function node for processing
- [ ] Implement intent detection
- [ ] Add response formatting
- [ ] Test with sample data

# 3. Integration testing
- [ ] Test from chat application
- [ ] Verify webhook delivery
- [ ] Test response handling
- [ ] Debug any issues
```

### Step 2: Advanced n8n Features
**Duration**: 2-3 days

**Tasks:**
- [ ] Enhance documentation search
- [ ] Implement decision trees
- [ ] Add context awareness
- [ ] Create response templates with quick replies

**Checklist:**
```bash
# 1. Documentation integration
- [ ] Optimize product documentation search
- [ ] Enhance customer support docs integration
- [ ] Configure intent detection
- [ ] Test documentation responses

# 2. Decision logic
- [ ] Add IF nodes for routing
- [ ] Implement intent-based responses
- [ ] Add fallback handling
- [ ] Create error responses

# 3. Response enhancement
- [ ] Create quick reply templates
- [ ] Add contextual suggestions
- [ ] Implement escalation paths
- [ ] Test user experience flows
```

---

## Testing Checklist

### Unit Testing
- [ ] API endpoint tests
- [ ] Queue processor tests
- [ ] Security function tests
- [ ] Validation schema tests
- [ ] Database operation tests

### Integration Testing
- [ ] Complete message flow test
- [ ] Webhook integration test
- [ ] WebSocket functionality test
- [ ] Error handling test
- [ ] Rate limiting test

### End-to-End Testing
- [ ] User journey tests
- [ ] Chat widget functionality
- [ ] Real-time features
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### Performance Testing
- [ ] Load testing with Artillery
- [ ] Database performance
- [ ] WebSocket connection limits
- [ ] Memory usage analysis
- [ ] Response time benchmarks

### Security Testing
- [ ] Input validation testing
- [ ] Authentication bypass attempts
- [ ] Rate limiting validation
- [ ] Webhook signature verification
- [ ] XSS/injection testing

---

## Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Load balancer configured
- [ ] Monitoring tools set up

### Deployment Steps
- [ ] Deploy application code
- [ ] Start queue workers
- [ ] Configure WebSocket server
- [ ] Update n8n webhook URLs
- [ ] Test all functionality

### Post-deployment
- [ ] Health check verification
- [ ] Performance monitoring
- [ ] Error rate monitoring
- [ ] User acceptance testing
- [ ] Documentation updates

---

## Success Criteria

### Technical Metrics
- [ ] Message delivery rate >99.5%
- [ ] Average response time <3 seconds
- [ ] WebSocket connection stability >99%
- [ ] Queue processing time <1 second
- [ ] Error rate <0.1%

### User Experience
- [ ] Chat widget loads in <2 seconds
- [ ] Real-time messaging works reliably
- [ ] Mobile interface is responsive
- [ ] Accessibility standards met
- [ ] Error messages are user-friendly

### Operational
- [ ] Monitoring and alerting functional
- [ ] Automated backups configured
- [ ] Disaster recovery plan tested
- [ ] Documentation complete
- [ ] Team training completed

---

## Risk Mitigation

### Development Risks
- **Risk**: Underestimating complexity
  - **Mitigation**: Break tasks into smaller chunks, regular progress reviews

- **Risk**: Integration challenges with n8n
  - **Mitigation**: Early integration testing, fallback response system

### Production Risks
- **Risk**: High load causing system failures
  - **Mitigation**: Load testing, auto-scaling, queue system

- **Risk**: n8n service downtime
  - **Mitigation**: Health checks, retry logic, fallback responses

### Timeline Risks
- **Risk**: Features taking longer than expected
  - **Mitigation**: Prioritize MVP features, defer advanced features

---

## ✅ Confirmed Project Requirements

Based on stakeholder discussion:

1. **✅ n8n Instance**: Existing n8n workflow ready with product documentation and customer support docs
2. **✅ Webhook URL**: To be provided by stakeholder for n8n integration
3. **✅ Authentication**: HMAC signature verification (simple, secure, not over-engineered)
4. **✅ Response Types**: Text messages with optional quick replies (efficient approach)
5. **✅ User Context**: Simplified text-only approach - n8n has its own documentation data
6. **✅ Branding**: Standard chat widget design (to be refined during implementation)
7. **✅ Deployment**: Hostinger VPS deployment with PM2 process management
8. **✅ Timeline**: Flexible timeline, no hard deadlines

## Additional Confirmed Details
- **Bidirectional Flow**: Complete webhook response handling from n8n back to chat interface
- **Real-time Updates**: WebSocket implementation for instant user feedback
- **Security**: HMAC signature verification for webhook authentication
- **Deployment**: Optimized for Hostinger VPS environment

---

## Hostinger VPS Deployment Guide

### Server Requirements
- **VPS Plan**: Business VPS or higher (2+ CPU cores, 4GB+ RAM)
- **OS**: Ubuntu 20.04 LTS or newer
- **Node.js**: Version 18 or higher
- **Database**: PostgreSQL 14+
- **Process Manager**: PM2
- **Web Server**: Nginx

### Deployment Configuration

#### PM2 Ecosystem File
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ecom-chat-app',
      script: 'npm',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'chat-queue-worker',
      script: 'npm',
      args: 'run queue:worker',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'websocket-server',
      script: 'npm',
      args: 'run websocket:server',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WEBSOCKET_PORT: 3001
      }
    }
  ]
};
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/chatbot-app
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket for chat
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Environment Variables for Hostinger
```bash
# .env.production
NODE_ENV=production
PORT=3000
WEBSOCKET_PORT=3001

# Database (update with your Hostinger DB details)
DATABASE_URL="postgresql://username:password@localhost:5432/ecom_chat_db"

# Chat Configuration
CHAT_ENABLED=true
CHAT_WEBHOOK_SECRET=your-super-secure-secret-here
CHAT_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat
CHAT_SESSION_TIMEOUT=86400000
CHAT_MAX_MESSAGE_LENGTH=1000
CHAT_RATE_LIMIT_WINDOW=60000
CHAT_RATE_LIMIT_MAX=10

# WebSocket Configuration
WEBSOCKET_ENABLED=true
WEBSOCKET_HEARTBEAT_INTERVAL=30000
WEBSOCKET_CORS_ORIGIN=https://your-domain.com

# Queue Configuration
CHAT_QUEUE_WORKER_CONCURRENCY=3
CHAT_QUEUE_RETRY_ATTEMPTS=3
CHAT_QUEUE_RETRY_DELAY=1000

# Monitoring
CHAT_METRICS_ENABLED=true
CHAT_LOG_LEVEL=info
```

#### Deployment Commands
```bash
# Initial setup on Hostinger VPS
sudo apt update && sudo apt upgrade -y
sudo apt install nginx postgresql postgresql-contrib -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
npm install -g pm2

# Clone and setup application
git clone your-repo-url /var/www/chatbot-app
cd /var/www/chatbot-app
npm install --production
npx prisma generate
npx prisma migrate deploy

# Start services
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Configure Nginx
sudo ln -s /etc/nginx/sites-available/chatbot-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL Certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

This implementation plan provides a systematic approach to building the chatbot system. Each phase builds upon the previous one, ensuring a stable and functional system at every step.