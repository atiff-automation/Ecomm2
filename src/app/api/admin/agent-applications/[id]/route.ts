/**
 * Admin Individual Agent Application API Routes
 * Handle individual application operations for admins
 * Following CLAUDE.md principles: Systematic implementation, proper security
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { AgentApplicationService } from '@/lib/services/agent-application.service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/agent-applications/[id]
 * Get specific application details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.STAFF)
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

    // Get application
    const application = await AgentApplicationService.getApplicationById(id);

    if (!application) {
      return NextResponse.json(
        { error: 'Permohonan tidak dijumpai' },
        { status: 404 }
      );
    }

    return NextResponse.json(application);

  } catch (error) {
    console.error('Admin get application error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ralat sistem berlaku';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}