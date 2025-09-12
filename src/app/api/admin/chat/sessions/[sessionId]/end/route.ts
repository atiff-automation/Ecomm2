import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Check authentication and admin access
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Check if session exists and is active
    const existingSession = await prisma.chatSession.findUnique({
      where: { sessionId },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    if (existingSession.status === 'ended') {
      return NextResponse.json(
        { error: 'Session is already ended' },
        { status: 400 }
      );
    }

    // Update the session to ended status
    const updatedSession = await prisma.chatSession.update({
      where: { sessionId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        lastActivity: new Date(),
        metadata: {
          ...existingSession.metadata,
          endedBy: 'admin',
          endedByUser: session.user.email,
          endedAt: new Date().toISOString(),
        },
      },
    });

    // Add an admin message to the chat indicating session was ended
    await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: 'system',
        content: 'Chat session ended by administrator',
        messageType: 'system',
        status: 'delivered',
        metadata: {
          systemAction: 'admin_end_session',
          adminUser: session.user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Chat session ended successfully',
      session: {
        id: updatedSession.id,
        sessionId: updatedSession.sessionId,
        status: updatedSession.status,
        endedAt: updatedSession.endedAt?.toISOString(),
        lastActivity: updatedSession.lastActivity.toISOString(),
      },
    });

  } catch (error) {
    console.error('Admin end chat session error:', error);
    return NextResponse.json(
      { error: 'Failed to end chat session' },
      { status: 500 }
    );
  }
}