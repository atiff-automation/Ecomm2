/**

export const dynamic = 'force-dynamic';

 * Airway Bill Download API - JRM E-commerce Platform
 * Secure endpoint for downloading airway bills by order ID
 * Features: Admin authentication, order validation, file streaming
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import { AirwayBillService } from '@/lib/services/airway-bill.service';
import axios from 'axios';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/orders/[id]/airway-bill
 * Download airway bill PDF for specific order
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // ✅ Admin authentication check
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const orderId = params.id;

    // ✅ Order existence validation
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        airwayBillGenerated: true,
        airwayBillUrl: true,
        trackingNumber: true,
        airwayBillGeneratedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if airway bill is generated
    if (!order.airwayBillGenerated || !order.airwayBillUrl) {
      return NextResponse.json(
        {
          message: 'Airway bill not generated for this order',
          orderId,
          orderNumber: order.orderNumber,
          airwayBillGenerated: order.airwayBillGenerated,
        },
        { status: 404 }
      );
    }

    // ✅ Fetch and stream the PDF file
    try {
      console.log('📄 Downloading airway bill:', {
        orderId,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        airwayBillUrl: order.airwayBillUrl,
      });

      // Fetch the PDF from the URL
      const response = await axios.get(order.airwayBillUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds timeout
      });

      // Validate response
      if (response.status !== 200) {
        console.error('Failed to fetch airway bill PDF:', {
          status: response.status,
          statusText: response.statusText,
        });

        return NextResponse.json(
          {
            message: 'Failed to retrieve airway bill PDF',
            error: `HTTP ${response.status}: ${response.statusText}`,
          },
          { status: 502 }
        );
      }

      // ✅ File stream response with proper headers for PDF download
      const filename = `airway-bill-${order.orderNumber}-${order.trackingNumber}.pdf`;

      return new NextResponse(response.data, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': response.data.length.toString(),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Expires': '0',
        },
      });

    } catch (downloadError: any) {
      console.error('Error downloading airway bill PDF:', {
        orderId,
        orderNumber: order.orderNumber,
        error: downloadError.message,
        response: downloadError.response?.data,
      });

      // Handle different error types
      if (downloadError.code === 'ENOTFOUND' || downloadError.code === 'ECONNREFUSED') {
        return NextResponse.json(
          {
            message: 'Airway bill service temporarily unavailable',
            error: 'Network error',
          },
          { status: 503 }
        );
      }

      if (downloadError.response?.status === 404) {
        return NextResponse.json(
          {
            message: 'Airway bill file not found',
            error: 'File may have been moved or deleted',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          message: 'Failed to download airway bill',
          error: downloadError.message,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Airway bill download API error:', error);

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/orders/[id]/airway-bill?info=true
 * Get airway bill information without downloading
 */
export async function HEAD(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if this is an info request
    const url = new URL(request.url);
    const isInfoRequest = url.searchParams.get('info') === 'true';

    if (!isInfoRequest) {
      return new NextResponse(null, { status: 405 });
    }

    // Admin authentication check
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const orderId = params.id;

    // Get airway bill information
    const airwayBillInfo = await AirwayBillService.getAirwayBillInfo(orderId);

    if (!airwayBillInfo.generated) {
      return NextResponse.json(
        {
          message: 'Airway bill not generated',
          generated: false,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      generated: airwayBillInfo.generated,
      airwayBillNumber: airwayBillInfo.airwayBillNumber,
      generatedAt: airwayBillInfo.generatedAt,
    });

  } catch (error: any) {
    console.error('Airway bill info API error:', error);

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}