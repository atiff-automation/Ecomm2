import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { CreateSessionSchema, CHAT_CONFIG } from '@/lib/chat/validation';
import { handleChatError, createSuccessResponse, createChatError } from '@/lib/chat/errors';
import { getClientIdentifier } from '@/lib/chat/security';

/**
 * Special initialization endpoint for chat widget
 * Bypasses rate limits for UI initialization
 * Only creates sessions, does not send messages
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateSessionSchema.parse(body);
    
    // Add special flag to identify this as UI initialization
    const isUIInit = body.isUIInit === true;
    
    if (!isUIInit) {
      throw createChatError('VALIDATION_ERROR', 'This endpoint is only for UI initialization');
    }
    
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
    
    // Check if session already exists for this user/email (avoid duplicates)
    let existingSession = null;
    if (validatedData.userId) {
      existingSession = await prisma.chatSession.findFirst({
        where: { 
          userId: validatedData.userId,
          status: 'active',
          expiresAt: { gt: new Date() }
        }
      });
    } else if (validatedData.guestEmail) {
      existingSession = await prisma.chatSession.findFirst({
        where: { 
          guestEmail: validatedData.guestEmail,
          status: 'active',
          expiresAt: { gt: new Date() }
        }
      });
    }
    
    // Return existing session if found
    if (existingSession) {
      const response = {
        sessionId: existingSession.sessionId,
        status: existingSession.status,
        expiresAt: existingSession.expiresAt?.toISOString(),
        isExisting: true,
        userContext: null,
      };
      
      return createSuccessResponse(response, 200);
    }
    
    // Create new chat session
    const session = await prisma.chatSession.create({
      data: {
        userId: validatedData.userId,
        guestEmail: validatedData.guestEmail,
        status: 'active',
        metadata: {
          ...validatedData.metadata,
          initSource: 'ui-widget',
          clientId: getClientIdentifier(request, 'unknown')
        },
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
    
    const response = {
      sessionId: session.sessionId, // Return the public CUID sessionId
      status: session.status,
      expiresAt: session.expiresAt?.toISOString(),
      isExisting: false,
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

// NO rate limiting applied to this endpoint
export const POST = handlePOST;