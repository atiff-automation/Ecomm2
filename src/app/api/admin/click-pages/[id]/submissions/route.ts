/**
 * Admin Click Page Form Submissions API Route
 * GET /api/admin/click-pages/[id]/submissions - Get all form submissions for a click page
 * DELETE /api/admin/click-pages/[id]/submissions/[submissionId] - Delete a form submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCSRF } from '@/lib/middleware/with-csrf';
import {
  buildFieldLabelMap,
  enhanceSubmissionData,
  type EnhancedSubmissionField,
} from '@/lib/utils/submission-enhancer';
import type { Block } from '@/types/click-page.types';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/admin/click-pages/[id]/submissions
 * Get all form submissions for a click page with pagination and filtering
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if click page exists and fetch blocks for field label mapping
    const clickPage = await prisma.clickPage.findUnique({
      where: { id },
      select: { id: true, title: true, blocks: true },
    });

    if (!clickPage) {
      return NextResponse.json(
        { error: 'Click page not found' },
        { status: 404 }
      );
    }

    // Build field label mapping from blocks
    const blocks = clickPage.blocks as Block[];
    const fieldLabelMap = buildFieldLabelMap(blocks);

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const blockId = searchParams.get('blockId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where = {
      clickPageId: id,
      ...(blockId && { blockId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    // Fetch submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          blockId: true,
          data: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      prisma.formSubmission.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Enhance submissions with field labels
    const enhancedSubmissions = submissions.map((submission) => ({
      ...submission,
      enhancedData: enhanceSubmissionData(
        submission.data as Record<string, unknown>,
        fieldLabelMap
      ),
    }));

    return NextResponse.json({
      submissions: enhancedSubmissions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      clickPage: {
        id: clickPage.id,
        title: clickPage.title,
      },
    });
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form submissions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/click-pages/[id]/submissions
 * Delete form submissions (accepts submissionIds in request body)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(req);
  if (csrfCheck) return csrfCheck;

  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if click page exists
    const clickPage = await prisma.clickPage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!clickPage) {
      return NextResponse.json(
        { error: 'Click page not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { submissionIds } = body as { submissionIds: string[] };

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Submission IDs are required' },
        { status: 400 }
      );
    }

    // Delete submissions
    const result = await prisma.formSubmission.deleteMany({
      where: {
        id: { in: submissionIds },
        clickPageId: id, // Ensure submissions belong to this click page
      },
    });

    return NextResponse.json({
      message: `${result.count} submission(s) deleted successfully`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Error deleting form submissions:', error);
    return NextResponse.json(
      { error: 'Failed to delete form submissions' },
      { status: 500 }
    );
  }
}
