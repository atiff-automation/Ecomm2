import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import { validateExportOptions } from '@/utils/chat';
import { formatDateForFilename } from '@/lib/chat/data-management';
import * as PDFDocument from 'pdfkit';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      sessionIds,
      format,
      dateRange,
      includeMessages = true,
      autoArchive = false,
    } = body;

    // Validate export options
    const exportOptions = {
      sessionIds,
      format: format || 'json',
      dateRange: {
        from: dateRange?.from
          ? new Date(dateRange.from)
          : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        to: dateRange?.to ? new Date(dateRange.to) : new Date(),
      },
      includeMessages,
    };

    const validation = validateExportOptions(exportOptions);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Fetch sessions with messages
    const sessions = await prisma.chatSession.findMany({
      where: {
        sessionId: { in: sessionIds },
        createdAt: {
          gte: exportOptions.dateRange.from,
          lte: exportOptions.dateRange.to,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: includeMessages
          ? {
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
            }
          : false,
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data for export
    const exportData = sessions.map(session => ({
      sessionId: session.sessionId,
      status: session.status,
      startedAt: session.createdAt.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
      endedAt: session.endedAt?.toISOString(),
      duration: session.endedAt
        ? Math.floor(
            (session.endedAt.getTime() - session.createdAt.getTime()) / 1000
          )
        : Math.floor(
            (session.lastActivity.getTime() - session.createdAt.getTime()) /
              1000
          ),
      messageCount: session._count.messages,
      user: session.user
        ? {
            id: session.user.id,
            email: session.user.email,
            name: `${session.user.firstName} ${session.user.lastName}`.trim(),
          }
        : null,
      guestEmail: session.guestEmail,
      guestPhone: session.guestPhone,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      metadata: session.metadata,
      messages: includeMessages ? session.messages : undefined,
    }));

    // Auto-archive sessions if requested
    if (autoArchive) {
      try {
        await prisma.chatSession.updateMany({
          where: {
            sessionId: { in: sessionIds },
          },
          data: {
            status: 'archived',
            lastActivity: new Date(),
          },
        });
      } catch (archiveError) {
        console.error('Auto-archive failed:', archiveError);
        // Continue with export even if archive fails
      }
    }

    // Generate export content based on format
    switch (format) {
      case 'json':
        return generateJsonExport(exportData, sessionIds.length);

      case 'csv':
        return generateCsvExport(exportData, sessionIds.length);

      case 'pdf':
        return generatePdfExport(exportData, sessionIds.length);

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export chat sessions' },
      { status: 500 }
    );
  }
}

function generateJsonExport(data: any[], sessionCount: number) {
  const exportContent = {
    exportedAt: new Date().toISOString(),
    sessionCount,
    sessions: data,
  };

  const content = JSON.stringify(exportContent, null, 2);
  const timestamp = formatDateForFilename(new Date());
  const filename = `Chat_Export_${timestamp}_${sessionCount}Sessions.json`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': Buffer.byteLength(content).toString(),
    },
  });
}

function generateCsvExport(data: any[], sessionCount: number) {
  // Create CSV headers
  const headers = [
    'Session ID',
    'Status',
    'Started At',
    'Last Activity',
    'Ended At',
    'Duration (seconds)',
    'Message Count',
    'User Email',
    'User Name',
    'Guest Email',
    'Guest Phone',
    'IP Address',
    'User Agent',
  ];

  // Create CSV rows
  const rows = data.map(session => [
    session.sessionId,
    session.status,
    session.startedAt,
    session.lastActivity,
    session.endedAt || '',
    session.duration,
    session.messageCount,
    session.user?.email || session.guestEmail || '',
    session.user?.name || '',
    session.guestEmail || '',
    session.guestPhone || '',
    session.ipAddress || '',
    session.userAgent || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(field =>
          typeof field === 'string' && field.includes(',')
            ? `"${field.replace(/"/g, '""')}"`
            : field
        )
        .join(',')
    ),
  ].join('\n');

  const timestamp = formatDateForFilename(new Date());
  const filename = `Chat_Export_${timestamp}_${sessionCount}Sessions.csv`;

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': Buffer.byteLength(csvContent).toString(),
    },
  });
}

async function generatePdfExport(
  data: any[],
  sessionCount: number
): Promise<NextResponse> {
  return new Promise(resolve => {
    const doc = new (PDFDocument as any)();
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const timestamp = formatDateForFilename(new Date());
      const filename = `Chat_Export_${timestamp}_${sessionCount}Sessions.pdf`;

      resolve(
        new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        })
      );
    });

    // Generate PDF content
    doc.fontSize(20).text('Chat Sessions Export', 50, 50);
    doc
      .fontSize(12)
      .text(`Exported on: ${new Date().toLocaleString()}`, 50, 80);
    doc.text(`Total Sessions: ${sessionCount}`, 50, 100);

    let yPosition = 140;

    data.forEach((session, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc
        .fontSize(14)
        .text(`Session ${index + 1}: ${session.sessionId}`, 50, yPosition);
      yPosition += 20;

      doc
        .fontSize(10)
        .text(`Status: ${session.status}`, 50, yPosition)
        .text(
          `Started: ${new Date(session.startedAt).toLocaleString()}`,
          250,
          yPosition
        );
      yPosition += 15;

      doc
        .text(`Messages: ${session.messageCount}`, 50, yPosition)
        .text(
          `Duration: ${Math.floor(session.duration / 60)}m ${session.duration % 60}s`,
          250,
          yPosition
        );
      yPosition += 15;

      const userInfo = session.user?.email || session.guestEmail || 'Anonymous';
      doc.text(`User: ${userInfo}`, 50, yPosition);
      yPosition += 15;

      if (session.messages && session.messages.length > 0) {
        doc.text('Messages:', 50, yPosition);
        yPosition += 15;

        session.messages.slice(0, 5).forEach((message: any) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          const sender = message.senderType === 'user' ? 'User' : 'Bot';
          const time = new Date(message.createdAt).toLocaleTimeString();
          doc
            .fontSize(9)
            .text(
              `[${time}] ${sender}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
              70,
              yPosition
            );
          yPosition += 12;
        });

        if (session.messages.length > 5) {
          doc.text(
            `... and ${session.messages.length - 5} more messages`,
            70,
            yPosition
          );
          yPosition += 12;
        }
      }

      yPosition += 20;
    });

    doc.end();
  });
}
