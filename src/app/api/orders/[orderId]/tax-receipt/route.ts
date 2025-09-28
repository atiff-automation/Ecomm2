/**
 * Tax Receipt Generation API
 * Generates official tax receipts for orders with Malaysian tax compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { taxReceiptService } from '@/lib/receipts/receipt-service';
import { businessProfileService } from '@/lib/receipts/business-profile-service';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    orderId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html'; // html, pdf
    const download = searchParams.get('download') === 'true';
    const templateId = searchParams.get('templateId') || undefined;

    // Check authentication and authorization
    const orderId = params.orderId;
    let userId: string | undefined;

    if (session?.user) {
      // Regular users can only access their own orders
      if (session.user.role === UserRole.CUSTOMER) {
        userId = session.user.id;
      }
      // Admins can access any order (userId remains undefined)
    } else {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get tax receipt data
    const receiptData = await taxReceiptService.getTaxReceiptData(
      orderId,
      userId
    );

    if (!receiptData) {
      return NextResponse.json(
        { message: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Check if order is paid (tax receipts should only be generated for paid orders)
    if (receiptData.order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { message: 'Tax receipt can only be generated for paid orders' },
        { status: 400 }
      );
    }

    if (format === 'html') {
      // Return HTML tax receipt for preview or client-side PDF generation
      const htmlReceipt = await taxReceiptService.generateTaxReceiptHTML(receiptData, templateId);

      return new Response(htmlReceipt, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...(download && {
            'Content-Disposition': `attachment; filename="TaxReceipt_${taxReceiptService.generateReceiptNumber(receiptData.order.orderNumber)}.html"`,
          }),
        },
      });
    }

    // For PDF generation, we'll return the HTML and let the client handle PDF conversion
    // This avoids the complexity of server-side PDF generation
    const htmlReceipt = await taxReceiptService.generateTaxReceiptHTML(receiptData, templateId);

    return NextResponse.json({
      success: true,
      receiptData: {
        receiptNumber: taxReceiptService.generateReceiptNumber(
          receiptData.order.orderNumber
        ),
        orderNumber: receiptData.order.orderNumber,
        customerName:
          `${receiptData.customer.firstName || ''} ${receiptData.customer.lastName || ''}`.trim(),
        total: receiptData.order.total,
        taxAmount: receiptData.taxBreakdown.totalTax,
        createdAt: receiptData.order.createdAt,
      },
      htmlContent: htmlReceipt,
      filename: taxReceiptService.getTaxReceiptFilename(
        receiptData.order.orderNumber
      ),
    });
  } catch (error) {
    console.error('Tax receipt generation error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate tax receipt',
      },
      { status: 500 }
    );
  }
}

// GET tax receipt data only (without generating HTML)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const orderId = params.orderId;
    let userId: string | undefined;

    // Regular users can only access their own orders
    if (session.user.role === UserRole.CUSTOMER) {
      userId = session.user.id;
    }

    // Get tax receipt data
    const receiptData = await taxReceiptService.getTaxReceiptData(
      orderId,
      userId
    );

    if (!receiptData) {
      return NextResponse.json(
        { message: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Get company info from business profile service
    const companyInfo = await businessProfileService.getLegacyCompanyInfo();

    return NextResponse.json({
      success: true,
      receiptData: {
        order: receiptData.order,
        customer: receiptData.customer,
        orderItems: receiptData.orderItems,
        shippingAddress: receiptData.shippingAddress,
        billingAddress: receiptData.billingAddress,
        taxBreakdown: receiptData.taxBreakdown,
      },
      companyInfo,
    });
  } catch (error) {
    console.error('Tax receipt data fetch error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch tax receipt data',
      },
      { status: 500 }
    );
  }
}
