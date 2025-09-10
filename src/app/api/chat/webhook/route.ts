import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { WebhookResponseSchema } from '@/lib/chat/validation';
import { handleChatError, createSuccessResponse, createChatError } from '@/lib/chat/errors';
import { verifyWebhookSignature } from '@/lib/chat/security';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { webSocketManager } from '@/lib/websocket/server';

async function handlePOST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    
    // Verify webhook signature
    const webhookSecret = process.env.CHAT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw createChatError('INTERNAL_ERROR', 'Webhook secret not configured');
    }
    
    if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
      throw createChatError('WEBHOOK_SIGNATURE_INVALID');
    }
    
    // Parse and validate request body
    const requestData = JSON.parse(body);
    const validatedData = WebhookResponseSchema.parse(requestData);
    
    // Verify session exists and is active
    const session = await prisma.chatSession.findUnique({
      where: { id: validatedData.sessionId },
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
        sessionId: validatedData.sessionId,
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
      where: { id: validatedData.sessionId },
      data: { updatedAt: new Date() },
    });
    
    // Broadcast bot message via WebSocket
    try {
      await webSocketManager.broadcastMessage(validatedData.sessionId, {
        id: botMessage.id,
        sessionId: validatedData.sessionId,
        senderType: 'bot',
        content: validatedData.response.content,
        messageType: validatedData.response.type,
        status: 'delivered',
        createdAt: botMessage.createdAt.toISOString()
      });
      
      // Send delivery receipt for the bot message
      await webSocketManager.sendDeliveryReceipt(botMessage.id, validatedData.sessionId);
    } catch (wsError) {
      console.warn('Failed to broadcast message via WebSocket:', wsError);
      // Don't fail the webhook if WebSocket fails
    }
    
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
export const GET = withRateLimit(handleGET, RateLimitPresets.WEBHOOK);