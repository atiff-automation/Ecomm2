/**

export const dynamic = 'force-dynamic';

 * Public Receipt Download API - Malaysian E-commerce Platform
 * Allows receipt download by order number for thank-you pages
 * Public endpoint with enhanced security measures (similar to order lookup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sanitizeInput } from '@/lib/utils/validation';
import { getClientIP } from '@/lib/utils/security';
import { invoiceService } from '@/lib/invoices/invoice-service';

interface Params {
  orderNumber: string;
}

// SECURITY NOTE: Rate limiting now handled at Railway platform level
// Previously: In-memory rate limiting (5 req/min) - removed due to memory leaks
// Now: Railway provides DDoS protection and rate limiting infrastructure

// Order number validation regex
const ORDER_NUMBER_REGEX = /^ORD-\d{8}-[A-Z0-9]{4,8}$/;

// Security headers for responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Maximum order age for receipt download (48 hours)
const MAX_ORDER_AGE_MS = 48 * 60 * 60 * 1000;

/**
 * GET /api/orders/receipt/[orderNumber] - Download receipt by order number
 * Public endpoint for order confirmation pages with enhanced security
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';
    const download = searchParams.get('download') === 'true';

    // Validate and sanitize order number
    const orderNumber = params.orderNumber;
    const sanitizedOrderNumber = sanitizeInput(orderNumber);

    if (
      !sanitizedOrderNumber ||
      !ORDER_NUMBER_REGEX.test(sanitizedOrderNumber)
    ) {
      console.warn(
        `🚫 Invalid order number format from IP: ${clientIP}, order: ${orderNumber}`
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid order number format',
          error: 'INVALID_ORDER_NUMBER',
        },
        {
          status: 400,
          headers: SECURITY_HEADERS,
        }
      );
    }

    console.log(
      `🧾 Receipt download request: ${sanitizedOrderNumber} from IP: ${clientIP}`
    );

    // Find the order with security constraints
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: sanitizedOrderNumber,
        // Only allow recent orders for security
        createdAt: {
          gte: new Date(Date.now() - MAX_ORDER_AGE_MS),
        },
        // Only allow paid orders
        paymentStatus: 'PAID',
      },
    });

    if (!order) {
      console.warn(
        `❌ Receipt not available: ${sanitizedOrderNumber} from IP: ${clientIP}`
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Receipt not available or order not found',
          error: 'RECEIPT_NOT_AVAILABLE',
        },
        {
          status: 404,
          headers: SECURITY_HEADERS,
        }
      );
    }

    // Generate receipt using the existing invoice service
    const receiptData = await invoiceService.getReceiptData(order.id);

    if (!receiptData) {
      console.error(
        `💥 Failed to generate receipt data for order: ${sanitizedOrderNumber}`
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to generate receipt',
          error: 'RECEIPT_GENERATION_FAILED',
        },
        {
          status: 500,
          headers: SECURITY_HEADERS,
        }
      );
    }

    if (format === 'pdf') {
      // Generate PDF using Puppeteer (same as invoice route)
      const htmlReceipt = await invoiceService.generateReceiptHTML(receiptData);

      let browser;
      try {
        // Dynamic import to avoid SSR issues
        const puppeteer = (await import('puppeteer')).default;

        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.setContent(htmlReceipt, {
          waitUntil: 'networkidle0', // Wait for all network requests to finish
        });

        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm',
          },
        });

        await browser.close();

        const responseTime = Date.now() - startTime;
        console.log(
          `✅ Receipt PDF generated in ${responseTime}ms for order: ${sanitizedOrderNumber}`
        );

        return new NextResponse(pdfBuffer, {
          headers: {
            ...SECURITY_HEADERS,
            'Content-Type': 'application/pdf',
            'Content-Disposition': download
              ? `attachment; filename="Receipt-${sanitizedOrderNumber}.pdf"`
              : `inline; filename="Receipt-${sanitizedOrderNumber}.pdf"`,
          },
        });
      } catch (error) {
        if (browser) {
          await browser.close();
        }
        console.error('PDF generation error:', error);
        throw error;
      }
    } else {
      // Return HTML receipt
      const htmlReceipt = await invoiceService.generateReceiptHTML(receiptData);

      const responseTime = Date.now() - startTime;
      console.log(
        `✅ Receipt HTML generated in ${responseTime}ms for order: ${sanitizedOrderNumber}`
      );

      return new NextResponse(htmlReceipt, {
        headers: {
          ...SECURITY_HEADERS,
          'Content-Type': 'text/html',
        },
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 Receipt download error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during receipt generation',
        error: 'INTERNAL_ERROR',
      },
      {
        status: 500,
        headers: SECURITY_HEADERS,
      }
    );
  }
}
