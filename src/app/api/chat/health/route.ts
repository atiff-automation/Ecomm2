import { NextRequest } from 'next/server';
import { createSuccessResponse } from '@/lib/chat/errors';

/**
 * Lightweight health check endpoint for chat system
 * This endpoint is designed to be fast and doesn't require database queries
 */
async function handleGET(request: NextRequest) {
  // Simple, fast health check - just return healthy status
  // No database queries or complex operations
  return createSuccessResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'chat-system',
    uptime: process.uptime(),
  });
}

// No rate limiting for health checks - they need to be fast
export const GET = handleGET;