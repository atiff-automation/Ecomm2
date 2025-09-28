/**
 * Admin Agent Applications API Routes
 * Handle admin operations for agent applications
 * Following CLAUDE.md principles: Systematic implementation, proper security
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { AgentApplicationService } from '@/lib/services/agent-application.service';
import { applicationFiltersSchema } from '@/lib/validation/agent-application';

/**
 * GET /api/admin/agent-applications
 * Get paginated list of applications with filters
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      hasJrmExp: searchParams.get('hasJrmExp') ? searchParams.get('hasJrmExp') === 'true' : undefined,
      socialMediaLevel: searchParams.get('socialMediaLevel') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    // Validate filters
    const validationResult = applicationFiltersSchema.safeParse(filters);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Parameter tidak sah',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    // Get applications
    const result = await AgentApplicationService.getApplications(validationResult.data);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Admin get applications error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ralat sistem berlaku';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}