/**
 * Public Click Page Form Submission API Route
 * POST /api/public/click-pages/[slug]/forms/submit - Submit a form from a FORM block
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formSubmissionSchema } from '@/lib/validation/click-page-schemas';
import { Block } from '@/types/click-page.types';
import { checkCSRF } from '@/lib/middleware/with-csrf';

interface RouteParams {
  params: { slug: string };
}

/**
 * POST /api/public/click-pages/[slug]/forms/submit
 * Submit form data from a FORM block on a click page
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(req);
  if (csrfCheck) return csrfCheck;

  try {
    const { slug } = params;

    // 1. Find the click page
    const clickPage = await prisma.clickPage.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        // Only show if not scheduled or if within scheduled dates
        OR: [
          { scheduledPublishAt: null },
          { scheduledPublishAt: { lte: new Date() } },
        ],
      },
      select: {
        id: true,
        blocks: true,
        scheduledUnpublishAt: true,
      },
    });

    if (!clickPage) {
      return NextResponse.json(
        { error: 'Click page not found' },
        { status: 404 }
      );
    }

    // 2. Check if campaign is still active
    if (clickPage.scheduledUnpublishAt && new Date() > clickPage.scheduledUnpublishAt) {
      return NextResponse.json(
        { error: 'Click page is no longer available' },
        { status: 404 }
      );
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = formSubmissionSchema.parse(body);

    // 4. Verify the block exists and is a FORM block
    const blocks = clickPage.blocks as Block[];
    const formBlock = blocks.find((block) => block.id === validatedData.blockId);

    if (!formBlock) {
      return NextResponse.json(
        { error: 'Form block not found' },
        { status: 404 }
      );
    }

    if (formBlock.type !== 'FORM') {
      return NextResponse.json(
        { error: 'Block is not a form block' },
        { status: 400 }
      );
    }

    // 5. Extract IP address and user agent
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      req.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 6. Create form submission record
    const submission = await prisma.formSubmission.create({
      data: {
        clickPageId: clickPage.id,
        blockId: validatedData.blockId,
        data: validatedData.data,
        ipAddress,
        userAgent,
      },
    });

    // 7. Send email notification if configured (fire and forget)
    if (
      formBlock.settings.emailNotification?.enabled &&
      formBlock.settings.emailNotification.recipients.length > 0
    ) {
      // Import email service dynamically to avoid circular dependencies
      import('@/lib/services/email-notification-service')
        .then(({ EmailNotificationService }) => {
          return EmailNotificationService.sendFormSubmissionNotification({
            clickPageSlug: slug,
            blockId: validatedData.blockId,
            formTitle: formBlock.settings.title || 'Form Submission',
            submissionData: validatedData.data,
            recipients: formBlock.settings.emailNotification!.recipients,
            subject: formBlock.settings.emailNotification!.subject,
            submittedAt: submission.createdAt,
          });
        })
        .catch((error) => {
          console.error('Error sending email notification:', error);
        });
    }

    // 8. Return success response
    return NextResponse.json({
      success: true,
      message: formBlock.settings.successMessage || 'Form submitted successfully',
      redirectUrl: formBlock.settings.redirectUrl || null,
    });
  } catch (error) {
    console.error('Error submitting form:', error);

    // Handle validation errors
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}
