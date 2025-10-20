/**

export const dynamic = 'force-dynamic';

 * Receipt Template Preview API
 * Generate preview HTML for a specific template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { receiptTemplateService } from '@/lib/receipts/template-service';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    templateId: string;
  };
}

/**
 * GET /api/admin/receipt-templates/[templateId]/preview
 * Generate preview HTML for a template
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    // Check admin authentication
    if (
      !session?.user ||
      ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(
        session.user.role as UserRole
      )
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sampleData = searchParams.get('sampleData') || 'default';

    // Generate preview HTML
    const previewHtml = await receiptTemplateService.generatePreview(
      params.templateId,
      sampleData === 'custom' ? undefined : undefined // TODO: Add custom sample data support
    );

    return new Response(previewHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Template preview error:', error);

    // Return error as HTML for iframe display
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Preview Error</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            text-align: center;
            background: #f8f9fa;
          }
          .error-container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 500px;
            margin: 0 auto;
          }
          .error-icon { font-size: 48px; margin-bottom: 16px; }
          .error-title { color: #dc3545; font-size: 18px; font-weight: bold; margin-bottom: 8px; }
          .error-message { color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <div class="error-title">Preview Generation Failed</div>
          <div class="error-message">
            ${error instanceof Error ? error.message : 'Unable to generate template preview'}
          </div>
        </div>
      </body>
      </html>
    `;

    return new Response(errorHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      status: 500,
    });
  }
}
