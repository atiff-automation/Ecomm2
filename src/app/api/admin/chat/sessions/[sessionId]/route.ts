import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function GET(
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

    // Fetch the chat session with all related data
    const chatSession = await prisma.chatSession.findUnique({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            content: true,
            senderType: true,
            messageType: true,
            status: true,
            createdAt: true,
            metadata: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Transform the data for frontend consumption
    const sessionDetail = {
      id: chatSession.id,
      sessionId: chatSession.sessionId,
      status: chatSession.status,
      startedAt: chatSession.createdAt.toISOString(),
      endedAt: chatSession.endedAt?.toISOString(),
      lastActivity: chatSession.lastActivity.toISOString(),
      messageCount: chatSession._count.messages,
      user: chatSession.user
        ? {
            id: chatSession.user.id,
            email: chatSession.user.email,
            name: `${chatSession.user.firstName} ${chatSession.user.lastName}`.trim(),
          }
        : null,
      // Guest contact information
      guestEmail: chatSession.guestEmail,
      guestPhone: chatSession.guestPhone,
      userAgent: chatSession.userAgent,
      ipAddress: chatSession.ipAddress,
      metadata: chatSession.metadata,
      messages: chatSession.messages.map(message => ({
        id: message.id,
        content: message.content,
        senderType: message.senderType,
        messageType: message.messageType,
        status: message.status,
        createdAt: message.createdAt.toISOString(),
        metadata: message.metadata,
      })),
    };

    return NextResponse.json({
      success: true,
      session: sessionDetail,
    });
  } catch (error) {
    console.error('Admin session detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session details' },
      { status: 500 }
    );
  }
}

// Update session details
export async function PATCH(
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
    const body = await request.json();
    const { status, metadata } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Check if session exists
    const existingSession = await prisma.chatSession.findUnique({
      where: { sessionId },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      lastActivity: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'ended' && !existingSession.endedAt) {
        updateData.endedAt = new Date();
      }
    }

    if (metadata) {
      updateData.metadata = {
        ...existingSession.metadata,
        ...metadata,
        lastUpdatedBy: session.user.email,
        lastUpdatedAt: new Date().toISOString(),
      };
    }

    // Update the session
    const updatedSession = await prisma.chatSession.update({
      where: { sessionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      session: {
        id: updatedSession.id,
        sessionId: updatedSession.sessionId,
        status: updatedSession.status,
        endedAt: updatedSession.endedAt?.toISOString(),
        lastActivity: updatedSession.lastActivity.toISOString(),
        metadata: updatedSession.metadata,
      },
    });
  } catch (error) {
    console.error('Admin session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// Delete a chat session (soft delete by archiving)
export async function DELETE(
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
    // Only SUPERADMIN can delete sessions
    if (userRole !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { error: 'Superadmin access required for deletion' },
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

    // Check if session exists
    const existingSession = await prisma.chatSession.findUnique({
      where: { sessionId },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Soft delete by marking as archived
    const archivedSession = await prisma.chatSession.update({
      where: { sessionId },
      data: {
        status: 'archived',
        endedAt: existingSession.endedAt || new Date(),
        lastActivity: new Date(),
        metadata: {
          ...existingSession.metadata,
          archivedBy: session.user.email,
          archivedAt: new Date().toISOString(),
          originalStatus: existingSession.status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Session archived successfully',
      session: {
        id: archivedSession.id,
        sessionId: archivedSession.sessionId,
        status: archivedSession.status,
      },
    });
  } catch (error) {
    console.error('Admin session delete error:', error);
    return NextResponse.json(
      { error: 'Failed to archive session' },
      { status: 500 }
    );
  }
}
