/**

export const dynamic = 'force-dynamic';

 * Agent Application Public API Routes
 * Handle public form submissions and status checks
 * Following CLAUDE.md principles: Systematic implementation, proper error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AgentApplicationService } from '@/lib/services/agent-application.service';
import { agentApplicationSchema } from '@/lib/validation/agent-application';
import { rateLimit } from '@/lib/utils/rate-limit';

// Rate limiting: 5 submissions per hour per IP
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500, // Max 500 unique IPs per interval
});

/**
 * POST /api/agent-application
 * Submit a new agent application
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip ?? 'anonymous';
    await limiter.check(5, ip); // 5 requests per hour

    // Get user session (optional)
    const session = await getServerSession();
    const userId = session?.user?.id;

    // Parse request body
    const body = await request.json();

    // Validate input
    if (!body.formData) {
      return NextResponse.json(
        { error: 'Data permohonan diperlukan' },
        { status: 400 }
      );
    }

    // Validate form data structure
    const validationResult = agentApplicationSchema.safeParse(body.formData);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Data permohonan tidak sah',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Create application
    const result = await AgentApplicationService.createApplication({
      formData: body.formData,
      userId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Agent application submission error:', error);

    // Handle rate limiting
    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Terlalu banyak permohonan. Sila cuba lagi kemudian.' },
        { status: 429 }
      );
    }

    // Handle validation errors
    if (
      error instanceof Error &&
      error.message.includes('sudah mempunyai permohonan')
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof Error && error.message.includes('telah digunakan')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    // Generic error
    const errorMessage =
      error instanceof Error ? error.message : 'Ralat sistem berlaku';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET /api/agent-application?id=xxx
 * Get application status by ID (for public tracking)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

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

    // Return public information only
    const publicData = {
      id: application.id,
      status: application.status,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      createdAt: application.createdAt,
      fullName: application.fullName, // For confirmation
      email: application.email, // For confirmation
    };

    return NextResponse.json(publicData);
  } catch (error) {
    console.error('Get application error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Ralat sistem berlaku';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/agent-application
 * Update draft application
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Pengesahan diperlukan' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, formData } = body;

    if (!id || !formData) {
      return NextResponse.json(
        { error: 'ID permohonan dan data diperlukan' },
        { status: 400 }
      );
    }

    // Update application
    const updatedApplication = await AgentApplicationService.updateApplication(
      id,
      formData,
      session.user.id
    );

    return NextResponse.json({
      id: updatedApplication.id,
      status: updatedApplication.status,
      message: 'Permohonan telah dikemaskini',
    });
  } catch (error) {
    console.error('Update application error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Ralat sistem berlaku';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
