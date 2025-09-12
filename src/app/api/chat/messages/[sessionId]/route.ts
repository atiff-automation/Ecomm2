import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { GetMessagesSchema, CHAT_CONFIG } from '@/lib/chat/validation';
import { handleChatError, createSuccessResponse, createChatError } from '@/lib/chat/errors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

async function handleGET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const validatedParams = GetMessagesSchema.parse({
      sessionId: params.sessionId,
      page,
      limit,
    });
    
    // Verify session exists and is active
    const session = await prisma.chatSession.findUnique({
      where: { sessionId: validatedParams.sessionId },
      select: {
        id: true,
        sessionId: true,
        status: true,
        expiresAt: true,
      },
    });
    
    if (!session) {
      throw createChatError('SESSION_NOT_FOUND');
    }
    
    // Check if session is expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      throw createChatError('SESSION_EXPIRED');
    }
    
    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    
    // Get messages with pagination
    const [messages, totalCount] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'asc' },
        skip,
        take: validatedParams.limit,
        select: {
          id: true,
          senderType: true,
          content: true,
          messageType: true,
          status: true,
          createdAt: true,
          metadata: true,
        },
      }),
      prisma.chatMessage.count({
        where: { sessionId: session.id },
      }),
    ]);
    
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    
    const response = {
      messages,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: totalCount,
        totalPages,
        hasNext: validatedParams.page < totalPages,
        hasPrev: validatedParams.page > 1,
      },
      sessionInfo: {
        sessionId: session.sessionId,
        status: session.status,
        expiresAt: session.expiresAt?.toISOString(),
      },
    };
    
    return createSuccessResponse(response);
    
  } catch (error) {
    return handleChatError(error);
  }
}

// Apply rate limiting to the GET endpoint
export const GET = withRateLimit(handleGET, RateLimitPresets.MESSAGE_READ);