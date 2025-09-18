/**
 * Individual Session Transcript Export API
 * Export single session with complete chat transcript
 * Following @CLAUDE.md approach with systematic validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import * as PDFDocument from 'pdfkit';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Authentication and authorization
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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    // Fetch session with complete message history
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
          orderBy: { createdAt: 'asc' },
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

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Transform session data
    const sessionData = {
      sessionId: chatSession.sessionId,
      status: chatSession.status,
      startedAt: chatSession.createdAt.toISOString(),
      lastActivity: chatSession.lastActivity.toISOString(),
      endedAt: chatSession.endedAt?.toISOString(),
      duration: chatSession.endedAt
        ? Math.floor((chatSession.endedAt.getTime() - chatSession.createdAt.getTime()) / 1000)
        : Math.floor((chatSession.lastActivity.getTime() - chatSession.createdAt.getTime()) / 1000),
      messageCount: chatSession.messages.length,
      user: chatSession.user ? {
        id: chatSession.user.id,
        email: chatSession.user.email,
        name: `${chatSession.user.firstName} ${chatSession.user.lastName}`.trim(),
      } : null,
      guestEmail: chatSession.guestEmail,
      guestPhone: chatSession.guestPhone,
      userAgent: chatSession.userAgent,
      ipAddress: chatSession.ipAddress,
      metadata: chatSession.metadata,
      messages: chatSession.messages,
    };

    // Generate export based on format
    switch (format) {
      case 'json':
        return generateJsonTranscript(sessionData);
      case 'pdf':
        return generatePdfTranscript(sessionData);
      default:
        return NextResponse.json(
          { error: 'Invalid format. Supported: json, pdf' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Transcript export error:', error);
    return NextResponse.json(
      { error: 'Failed to export session transcript' },
      { status: 500 }
    );
  }
}

function generateJsonTranscript(sessionData: any) {
  const transcript = {
    exportedAt: new Date().toISOString(),
    session: sessionData,
  };

  const content = JSON.stringify(transcript, null, 2);
  const filename = `chat_transcript_${sessionData.sessionId}_${new Date().toISOString().split('T')[0]}.json`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': Buffer.byteLength(content).toString(),
    },
  });
}

async function generatePdfTranscript(sessionData: any): Promise<NextResponse> {
  return new Promise((resolve) => {
    const doc = new (PDFDocument as any)();
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const filename = `chat_transcript_${sessionData.sessionId}_${new Date().toISOString().split('T')[0]}.pdf`;

      resolve(new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      }));
    });

    // Generate detailed PDF transcript
    doc.fontSize(20).text('Chat Session Transcript', 50, 50);
    doc.fontSize(12);

    // Session header
    doc.text(`Session ID: ${sessionData.sessionId}`, 50, 90);
    doc.text(`Status: ${sessionData.status}`, 50, 110);
    doc.text(`Started: ${new Date(sessionData.startedAt).toLocaleString()}`, 50, 130);
    doc.text(`Duration: ${Math.floor(sessionData.duration / 60)}m ${sessionData.duration % 60}s`, 50, 150);
    doc.text(`Messages: ${sessionData.messageCount}`, 50, 170);

    // User information
    const userInfo = sessionData.user?.email || sessionData.guestEmail || 'Anonymous';
    doc.text(`User: ${userInfo}`, 50, 190);
    if (sessionData.ipAddress) {
      doc.text(`IP: ${sessionData.ipAddress}`, 50, 210);
    }

    let yPosition = 250;

    // Messages
    doc.fontSize(14).text('Conversation', 50, yPosition);
    yPosition += 30;

    sessionData.messages.forEach((message: any, index: number) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      const timestamp = new Date(message.createdAt).toLocaleTimeString();
      const sender = message.senderType === 'user' ? 'User' : 'Bot';

      // Message header
      doc.fontSize(10)
        .fillColor('#666666')
        .text(`[${timestamp}] ${sender}:`, 50, yPosition);
      yPosition += 15;

      // Message content
      doc.fontSize(11)
        .fillColor('#000000')
        .text(message.content, 70, yPosition, {
          width: 500,
          align: 'left'
        });

      // Calculate text height for proper spacing
      const textHeight = doc.heightOfString(message.content, {
        width: 500,
        align: 'left'
      });
      yPosition += textHeight + 15;

      // Add some spacing between messages
      yPosition += 5;
    });

    // Footer
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }

    yPosition += 30;
    doc.fontSize(10)
      .fillColor('#666666')
      .text(`Generated on ${new Date().toLocaleString()}`, 50, yPosition);

    doc.end();
  });
}