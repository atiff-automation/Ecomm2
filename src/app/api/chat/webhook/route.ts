import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { WebhookResponseSchema } from '@/lib/chat/validation';
import { handleChatError, createSuccessResponse, createChatError } from '@/lib/chat/errors';
import { verifyWebhookSignature } from '@/lib/chat/security';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

async function handlePOST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');

    // Get webhook secret from database configuration
    const chatConfig = await prisma.chatConfig.findFirst({
      where: { isActive: true },
      select: { webhookSecret: true }
    });

    if (!chatConfig?.webhookSecret) {
      throw createChatError('INTERNAL_ERROR', 'Webhook secret not configured in database');
    }

    if (!signature || !verifyWebhookSignature(body, signature, chatConfig.webhookSecret)) {
      throw createChatError('WEBHOOK_SIGNATURE_INVALID');
    }
    
    // Parse request body
    const requestData = JSON.parse(body);

    // Handle health check requests separately
    if (requestData.type === 'health_check') {
      console.log('✅ Health check webhook received');
      return createSuccessResponse('Health check successful', {
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    }

    // Validate regular webhook responses
    const validatedData = WebhookResponseSchema.parse(requestData);

    // Verify session exists and is active
    const session = await prisma.chatSession.findUnique({
      where: { sessionId: validatedData.sessionId },
    });

    if (!session) {
      throw createChatError('SESSION_NOT_FOUND');
    }

    if (session.status !== 'active') {
      throw createChatError('SESSION_NOT_FOUND', 'Chat session is not active');
    }
    
    // Create bot response message
    const botMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id, // Use internal database ID for FK relationship
        senderType: 'bot',
        content: validatedData.response.content,
        messageType: validatedData.response.type,
        status: 'delivered',
        metadata: {
          ...validatedData.metadata,
          quickReplies: validatedData.response.quickReplies,
          attachments: validatedData.response.attachments,
        },
      },
    });
    
    // Update session's updated timestamp
    await prisma.chatSession.update({
      where: { sessionId: validatedData.sessionId },
      data: { lastActivity: new Date() },
    });
    
    // Note: Using polling approach for real-time updates instead of WebSocket
    // The client will poll for new messages and receive this bot response
    
    const response = {
      success: true,
      messageId: botMessage.id,
      sessionId: validatedData.sessionId,
      timestamp: botMessage.createdAt.toISOString(),
    };
    
    return createSuccessResponse(response);
    
  } catch (error) {
    return handleChatError(error);
  }
}

// Health check endpoint for n8n
async function handleGET(request: NextRequest) {
  try {
    // Simple health check - verify database connection
    await prisma.chatSession.findFirst({
      take: 1,
    });
    
    return createSuccessResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'chat-webhook',
    });
    
  } catch (error) {
    return handleChatError(error);
  }
}

// Apply rate limiting to endpoints
export const POST = withRateLimit(handlePOST, RateLimitPresets.WEBHOOK);
// Disable rate limiting for health checks during development
export const GET = handleGET;