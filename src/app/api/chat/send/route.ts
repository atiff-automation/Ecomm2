import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SendMessageSchema, CHAT_CONFIG } from '@/lib/chat/validation';
import { handleChatError, createSuccessResponse, createChatError } from '@/lib/chat/errors';
import { webhookService } from '@/lib/chat/webhook-service';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { webSocketManager } from '@/lib/websocket/server';
import { getChatConfig, isChatSystemHealthy } from '@/lib/chat/config';

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SendMessageSchema.parse(body);
    
    // Validate session exists and is active
    const session = await prisma.chatSession.findUnique({
      where: { sessionId: validatedData.sessionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isMember: true,
            membershipTotal: true,
          }
        },
      },
    });
    
    if (!session) {
      throw createChatError('SESSION_NOT_FOUND');
    }
    
    // Check if session is expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      throw createChatError('SESSION_EXPIRED');
    }
    
    // Check if session is active
    if (session.status !== 'active') {
      throw createChatError('SESSION_NOT_FOUND', 'Chat session is not active');
    }
    
    // Create user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        senderType: 'user',
        content: validatedData.content,
        messageType: validatedData.messageType,
        status: 'pending',
        metadata: validatedData.metadata,
      },
    });
    
    // Prepare webhook payload with user context
    const webhookPayload = {
      sessionId: session.sessionId,
      messageId: userMessage.id,
      userId: session.userId,
      guestEmail: session.guestEmail,
      message: {
        content: validatedData.content,
        type: validatedData.messageType,
        timestamp: userMessage.createdAt.toISOString(),
      },
      userContext: {
        isAuthenticated: !!session.userId,
        membershipLevel: session.user?.isMember ? 'member' : 'guest',
        membershipTotal: session.user?.membershipTotal ? Number(session.user.membershipTotal) : null,
        userInfo: session.user ? {
          id: session.user.id,
          name: `${session.user.firstName} ${session.user.lastName}`,
          email: session.user.email,
        } : null,
      },
      sessionMetadata: session.metadata,
    };
    
    // Check if chat system is healthy and get configuration
    const isHealthy = await isChatSystemHealthy();
    if (!isHealthy) {
      throw createChatError('INTERNAL_ERROR', 'Chat system is not properly configured or unhealthy');
    }

    const config = await getChatConfig();
    if (!config.webhookUrl) {
      throw createChatError('INTERNAL_ERROR', 'Chat webhook URL not configured');
    }
    
    await webhookService.queueWebhook(webhookPayload, config.webhookUrl, userMessage.id);
    
    // Update message status to sent
    await prisma.chatMessage.update({
      where: { id: userMessage.id },
      data: { status: 'sent' },
    });
    
    // Send delivery receipt via WebSocket
    try {
      await webSocketManager.sendDeliveryReceipt(userMessage.id, validatedData.sessionId);
    } catch (wsError) {
      console.warn('Failed to send WebSocket delivery receipt:', wsError);
      // Don't fail the request if WebSocket fails
    }
    
    const response = {
      messageId: userMessage.id,
      status: 'sent',
      timestamp: userMessage.createdAt.toISOString(),
      sessionId: validatedData.sessionId,
    };
    
    return createSuccessResponse(response, 201);
    
  } catch (error) {
    console.error('Detailed send error:', error);
    return handleChatError(error);
  }
}

// Apply rate limiting to the POST endpoint - disabled for testing
export const POST = handlePOST; // Temporarily disable rate limiting for testing