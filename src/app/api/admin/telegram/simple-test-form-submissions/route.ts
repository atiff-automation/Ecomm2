/**
export const dynamic = 'force-dynamic';

 * Simplified Test Form Submission Notification API - Malaysian E-commerce Platform
 * CENTRALIZED test functionality using simplified service
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { simplifiedTelegramService } from '@/lib/telegram/simplified-telegram-service';

/**
 * POST /api/admin/telegram/simple-test-form-submissions - Send test form submission notification
 * DRY: Uses same notification format as production
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // NO HARDCODE: Dynamic test data with Malaysian context
    const now = new Date();
    const mockSubmissionData = {
      id: `test-submission-${Date.now()}`,
      clickPageId: 'test-page-id',
      blockId: 'test-form-block',
      data: {
        name: 'Ahmad Bin Abdullah',
        email: 'ahmad.abdullah@example.com',
        phone: '+60123456789',
        message: 'I am interested in your products. Please contact me for more information.',
        interest: 'Product Inquiry',
      } as Record<string, unknown>,
      ipAddress: '203.106.123.45',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      createdAt: now,
    };

    const mockClickPage = {
      id: 'test-page-id',
      title: 'Product Landing Page - Test',
      slug: 'test-product-landing',
    };

    const mockFormBlock = {
      id: 'test-form-block',
      type: 'FORM' as const,
      settings: {
        title: 'Contact Form',
        description: 'Get in touch with us',
        fields: [
          {
            id: 'name',
            type: 'text' as const,
            label: 'Full Name',
            required: true,
          },
          {
            id: 'email',
            type: 'email' as const,
            label: 'Email Address',
            required: true,
          },
          {
            id: 'phone',
            type: 'phone' as const,
            label: 'Phone Number',
            required: true,
          },
          {
            id: 'interest',
            type: 'select' as const,
            label: 'Area of Interest',
            required: false,
            options: ['Product Inquiry', 'Partnership', 'Support', 'Other'],
          },
          {
            id: 'message',
            type: 'textarea' as const,
            label: 'Message',
            required: true,
          },
        ],
        submitButtonText: 'Submit',
        successMessage: 'Thank you for your submission!',
      },
    };

    // DRY: Use simplified service
    const success = await simplifiedTelegramService.sendFormSubmissionNotification(
      mockSubmissionData,
      mockClickPage,
      mockFormBlock
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test form submission notification sent successfully!',
        data: {
          submission: mockSubmissionData,
          page: mockClickPage,
          form: mockFormBlock.settings.title,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send test form submission notification',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test form submission notification:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send test form submission notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
