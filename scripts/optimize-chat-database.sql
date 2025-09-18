-- Chat Database Optimization Script
-- Following @CLAUDE.md systematic approach with performance indexes
-- Using correct table names from Prisma mapping

-- Performance optimization for chat_sessions table (maps to chat_sessions)
-- Primary optimization: lastActivity sorting (used in main query)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity
ON chat_sessions("lastActivity" DESC);

-- Status filtering optimization
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status
ON chat_sessions(status);

-- Created date optimization for metrics queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at
ON chat_sessions("createdAt");

-- User relationship optimization
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
ON chat_sessions("userId");

-- Performance optimization for chat_messages table
-- Session relationship optimization (for message counts)
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
ON chat_messages("sessionId");

-- Message timestamp optimization for metrics
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
ON chat_messages("createdAt");

-- Sender type optimization for response time calculations
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type
ON chat_messages("senderType");

-- Composite index for complex queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_sender_created
ON chat_messages("sessionId", "senderType", "createdAt");

-- Session status and created_at composite index for metrics
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status_created
ON chat_sessions(status, "createdAt");

-- Analyze tables to update statistics
ANALYZE chat_sessions;
ANALYZE chat_messages;