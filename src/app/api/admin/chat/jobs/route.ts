/**
 * Chat Data Management Jobs API
 * Control and monitor background jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import ChatDataJobScheduler from '@/lib/jobs/scheduler';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user || ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get job status
    const scheduler = ChatDataJobScheduler.getInstance();
    const status = scheduler.getJobStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Jobs status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user || ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, jobName } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const scheduler = ChatDataJobScheduler.getInstance();

    switch (action) {
      case 'start':
        scheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Job scheduler started',
        });

      case 'stop':
        scheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Job scheduler stopped',
        });

      case 'run':
        if (!jobName) {
          return NextResponse.json(
            { error: 'Job name is required for manual run' },
            { status: 400 }
          );
        }

        try {
          const result = await scheduler.runJobManually(jobName);
          return NextResponse.json({
            success: true,
            message: `Job ${jobName} executed manually`,
            result,
          });
        } catch (jobError) {
          return NextResponse.json(
            { error: `Failed to run job ${jobName}`, details: jobError instanceof Error ? jobError.message : 'Unknown error' },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be "start", "stop", or "run"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Jobs control API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}