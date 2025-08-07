/**
 * Invoice Generation API
 * Generates PDF invoices for orders with Malaysian tax compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { invoiceService } from '@/lib/invoices/invoice-service';
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

    // Get invoice data
    const invoiceData = await invoiceService.getInvoiceData(orderId, userId);

    if (!invoiceData) {
      return NextResponse.json(
        { message: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Check if order is paid (invoices should only be generated for paid orders)
    if (invoiceData.order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { message: 'Invoice can only be generated for paid orders' },
        { status: 400 }
      );
    }

    if (format === 'html') {
      // Return HTML invoice for preview or client-side PDF generation
      const htmlInvoice = invoiceService.generateInvoiceHTML(invoiceData);

      return new Response(htmlInvoice, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...(download && {
            'Content-Disposition': `attachment; filename="Invoice_${invoiceData.order.orderNumber}.html"`,
          }),
        },
      });
    }

    // For PDF generation, we'll return the HTML and let the client handle PDF conversion
    // This avoids the complexity of server-side PDF generation
    const htmlInvoice = invoiceService.generateInvoiceHTML(invoiceData);

    return NextResponse.json({
      success: true,
      invoiceData: {
        orderNumber: invoiceData.order.orderNumber,
        customerName:
          `${invoiceData.customer.firstName || ''} ${invoiceData.customer.lastName || ''}`.trim(),
        total: invoiceData.order.total,
        createdAt: invoiceData.order.createdAt,
      },
      htmlContent: htmlInvoice,
      filename: invoiceService.getInvoiceFilename(
        invoiceData.order.orderNumber
      ),
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Failed to generate invoice',
      },
      { status: 500 }
    );
  }
}

// GET invoice data only (without generating HTML)
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

    // Get invoice data
    const invoiceData = await invoiceService.getInvoiceData(orderId, userId);

    if (!invoiceData) {
      return NextResponse.json(
        { message: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceData: {
        order: invoiceData.order,
        customer: invoiceData.customer,
        orderItems: invoiceData.orderItems,
        shippingAddress: invoiceData.shippingAddress,
        billingAddress: invoiceData.billingAddress,
        taxBreakdown: invoiceData.taxBreakdown,
      },
      companyInfo: {
        name: process.env.COMPANY_NAME || 'JRM E-commerce Sdn Bhd',
        address: process.env.COMPANY_ADDRESS || 'Kuala Lumpur, Malaysia',
        phone: process.env.COMPANY_PHONE || '+60 3-1234 5678',
        email: process.env.COMPANY_EMAIL || 'info@jrmecommerce.com',
        registrationNo: process.env.COMPANY_REGISTRATION || '202301234567',
        sstNo: process.env.COMPANY_SST_NO || 'A12-3456-78901234',
      },
    });
  } catch (error) {
    console.error('Invoice data fetch error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch invoice data',
      },
      { status: 500 }
    );
  }
}
