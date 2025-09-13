import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { CreateSessionSchema, CHAT_CONFIG } from '@/lib/chat/validation';
import { handleChatError, createSuccessResponse, createChatError } from '@/lib/chat/errors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateSessionSchema.parse(body);
    
    // Calculate expiration time based on user authentication
    const isAuthenticated = !!validatedData.userId;
    const expirationTime = new Date(
      Date.now() + (isAuthenticated 
        ? CHAT_CONFIG.SESSION_TIMEOUT.AUTHENTICATED 
        : CHAT_CONFIG.SESSION_TIMEOUT.GUEST)
    );
    
    // Validate that either userId or guestEmail is provided
    if (!validatedData.userId && !validatedData.guestEmail) {
      throw createChatError('VALIDATION_ERROR', 'Either userId or guestEmail must be provided');
    }
    
    console.log(`🆕 Creating new session for: ${validatedData.userId ? 'user ' + validatedData.userId : validatedData.guestEmail}`);
    
    // Create new chat session with explicit transaction to prevent race conditions
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.chatSession.create({
        data: {
          userId: validatedData.userId,
          guestEmail: validatedData.guestEmail,
          status: 'active',
          metadata: validatedData.metadata,
          expiresAt: expirationTime,
        },
        include: {
          user: validatedData.userId ? {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              isMember: true,
            }
          } : false,
        },
      });
      
      // Ensure session is committed before returning
      console.log(`✅ Created session: ${newSession.sessionId} (id: ${newSession.id})`);
      return newSession;
    });
    
    const response = {
      sessionId: session.sessionId, // Return the public CUID sessionId
      status: session.status,
      expiresAt: session.expiresAt?.toISOString(),
      userContext: session.user ? {
        id: session.user.id,
        name: `${session.user.firstName} ${session.user.lastName}`,
        email: session.user.email,
        isMember: session.user.isMember,
      } : null,
    };
    
    return createSuccessResponse(response, 201);
    
  } catch (error) {
    return handleChatError(error);
  }
}

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      throw createChatError('VALIDATION_ERROR', 'Session ID is required');
    }
    
    // Find session with recent messages
    const session = await prisma.chatSession.findUnique({
      where: { sessionId: sessionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isMember: true,
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: CHAT_CONFIG.MESSAGE_LIMITS.MAX_HISTORY,
          select: {
            id: true,
            senderType: true,
            content: true,
            messageType: true,
            status: true,
            createdAt: true,
            metadata: true,
          },
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
    
    const response = {
      sessionId: session.sessionId,
      status: session.status,
      expiresAt: session.expiresAt?.toISOString(),
      messages: session.messages.reverse(), // Reverse to show oldest first
      metadata: session.metadata,
      userContext: session.user ? {
        id: session.user.id,
        name: `${session.user.firstName} ${session.user.lastName}`,
        email: session.user.email,
        isMember: session.user.isMember,
      } : null,
    };
    
    return createSuccessResponse(response);
    
  } catch (error) {
    return handleChatError(error);
  }
}

// Temporarily disable rate limiting for testing
export const POST = handlePOST;
export const GET = handleGET;