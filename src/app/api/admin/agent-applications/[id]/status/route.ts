/**
 * Admin Agent Application Status Update API Route
 * Handle status updates for agent applications
 * Following CLAUDE.md principles: Systematic implementation, audit logging
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AgentApplicationService } from '@/lib/services/agent-application.service';
import { updateApplicationStatusSchema } from '@/lib/validation/agent-application';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/admin/agent-applications/[id]/status
 * Update application status
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authentication
    const session = await getServerSession();
    if (
      !session?.user?.role ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Akses tidak dibenarkan' },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID permohonan diperlukan' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = updateApplicationStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Data tidak sah',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Update status
    await AgentApplicationService.updateApplicationStatus(
      id,
      validationResult.data,
      session.user.id
    );

    return NextResponse.json({
      message: 'Status permohonan telah dikemaskini',
    });
  } catch (error) {
    console.error('Admin update status error:', error);

    // Handle specific errors
    if (error instanceof Error && error.message.includes('tidak dijumpai')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Ralat sistem berlaku';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
