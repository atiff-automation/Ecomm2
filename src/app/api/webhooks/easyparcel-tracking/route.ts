/**
 * EasyParcel Tracking Webhook Handler
 * Handles real-time tracking updates from EasyParcel
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 2.6 - Webhook Setup
 * PDF Section 6.3 - Webhook Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { z } from 'zod';

// Webhook payload validation schema (PDF Section 6.3)
const webhookPayloadSchema = z.object({
  tracking_number: z.string().min(1, 'Tracking number is required'),
  event_code: z.string().min(1, 'Event code is required'),
  event_name: z.string().min(1, 'Event name is required'),
  event_description: z.string().optional(),
  event_time: z.string().datetime(), // ISO 8601
  location: z.string().optional(),
  shipment_id: z.string().min(1, 'Shipment ID is required'),
  signature: z.string().optional(), // Webhook signature verification
  courier_remarks: z.string().optional(),
  delivery_info: z.object({
    delivered_at: z.string().datetime().optional(),
    received_by: z.string().optional(),
    signature_image: z.string().url().optional(),
  }).optional(),
});

// Webhook payload interface (PDF Section 6.3)
interface WebhookPayload {
  tracking_number: string;
  event_code: string;
  event_name: string;
  event_description?: string;
  event_time: string; // ISO 8601
  location?: string;
  shipment_id: string;
  signature?: string; // Webhook signature verification
  courier_remarks?: string;
  delivery_info?: {
    delivered_at?: string;
    received_by?: string;
    signature_image?: string;
  };
}

/**
 * POST - Handle EasyParcel tracking webhook
 * Reference: PDF Section 6.3 - Webhook Implementation
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 EasyParcel webhook received');

    // Parse webhook payload
    const rawBody = await request.text();
    let webhookPayload: WebhookPayload;

    try {
      webhookPayload = JSON.parse(rawBody);
    } catch (error) {
      console.error('❌ Invalid webhook payload format:', error);
      return NextResponse.json(
        { message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log('📦 Webhook payload:', {
      trackingNumber: webhookPayload.tracking_number,
      eventCode: webhookPayload.event_code,
      eventName: webhookPayload.event_name,
      eventTime: webhookPayload.event_time,
    });

    // Verify webhook signature (PDF Section 6.3.1)
    if (!verifyWebhookSignature(rawBody, webhookPayload.signature || '', request)) {
      console.error('❌ Webhook signature verification failed');
      return NextResponse.json(
        { message: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Validate payload structure
    const validatedData = webhookPayloadSchema.parse(webhookPayload);

    // Find shipment by tracking number
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber: validatedData.tracking_number },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
      },
    });

    if (!shipment) {
      console.warn('⚠️ Shipment not found for tracking number:', validatedData.tracking_number);
      return NextResponse.json(
        { message: 'Shipment not found' },
        { status: 404 }
      );
    }

    console.log('📋 Processing webhook for shipment:', {
      shipmentId: shipment.id,
      orderNumber: shipment.order.orderNumber,
      currentStatus: shipment.status,
    });

    // Map EasyParcel event codes to our shipment status (PDF Section 6.1)
    const newStatus = mapEventCodeToStatus(validatedData.event_code);
    const statusChanged = newStatus && newStatus !== shipment.status;

    // Process webhook in database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tracking event record
      const trackingEvent = await tx.shipmentTracking.create({
        data: {
          shipmentId: shipment.id,
          eventCode: validatedData.event_code,
          eventName: validatedData.event_name,
          description: validatedData.event_description || validatedData.event_name,
          location: validatedData.location || 'In Transit',
          eventTime: new Date(validatedData.event_time),
          source: 'EASYPARCEL',
          courierRemarks: validatedData.courier_remarks,
        },
      });

      // Update shipment status if changed
      let updatedShipment = shipment;
      if (statusChanged) {
        updatedShipment = await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            status: newStatus,
            statusDescription: validatedData.event_description || validatedData.event_name,
            actualDelivery: validatedData.delivery_info?.delivered_at ? 
              new Date(validatedData.delivery_info.delivered_at) : null,
            lastTrackedAt: new Date(),
          },
        });

        console.log('📈 Shipment status updated:', {
          shipmentId: shipment.id,
          oldStatus: shipment.status,
          newStatus: newStatus,
        });

        // Update related order status if delivered
        if (['DELIVERED', 'COMPLETED'].includes(newStatus)) {
          await tx.order.update({
            where: { id: shipment.order.id },
            data: {
              status: 'DELIVERED',
              deliveredAt: validatedData.delivery_info?.delivered_at ? 
                new Date(validatedData.delivery_info.delivered_at) : new Date(),
            },
          });

          console.log('📦 Order marked as delivered:', shipment.order.orderNumber);
        }
      }

      // Create webhook audit log
      await tx.auditLog.create({
        data: {
          userId: null, // System webhook
          action: 'WEBHOOK_RECEIVED',
          resource: 'Shipment',
          resourceId: shipment.id,
          details: {
            trackingNumber: validatedData.tracking_number,
            eventCode: validatedData.event_code,
            eventName: validatedData.event_name,
            statusChanged,
            oldStatus: shipment.status,
            newStatus: statusChanged ? newStatus : shipment.status,
            webhookSource: 'EasyParcel',
            location: validatedData.location,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'easyparcel',
          userAgent: request.headers.get('user-agent') || 'EasyParcel Webhook',
        },
      });

      return {
        trackingEvent,
        updatedShipment,
        statusChanged,
      };
    });

    // Send notifications for important events (async)
    if (shouldSendNotification(validatedData.event_code)) {
      await sendTrackingNotification(shipment, validatedData, result.statusChanged);
    }

    console.log('✅ Webhook processed successfully:', {
      trackingNumber: validatedData.tracking_number,
      eventCode: validatedData.event_code,
      statusChanged: result.statusChanged,
    });

    // Return success response to EasyParcel
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      tracking_number: validatedData.tracking_number,
      event_processed: validatedData.event_code,
      status_updated: result.statusChanged,
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Invalid webhook payload',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Don't expose internal errors to EasyParcel
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Webhook endpoint verification
 * For EasyParcel webhook URL validation
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  console.log('🔍 Webhook verification request');

  if (challenge) {
    // Return challenge for webhook verification
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({
    message: 'EasyParcel tracking webhook endpoint',
    status: 'active',
    version: '1.4.0',
    supported_events: [
      'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 
      'DELIVERED', 'DELIVERY_ATTEMPTED', 'CANCELLED', 'FAILED'
    ],
  });
}

// ===== Helper Functions =====

/**
 * Verify webhook signature (PDF Section 6.3.1)
 */
function verifyWebhookSignature(
  payload: string, 
  signature: string, 
  request: NextRequest
): boolean {
  // Skip verification in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const secret = process.env.EASYPARCEL_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('⚠️ EASYPARCEL_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    // EasyParcel uses HMAC-SHA256 for signature verification
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

/**
 * Map EasyParcel event codes to our shipment status (PDF Section 6.1)
 */
function mapEventCodeToStatus(eventCode: string): string | null {
  const statusMapping: Record<string, string> = {
    // Preparation events
    'BOOKED': 'BOOKED',
    'LABEL_GENERATED': 'LABEL_GENERATED',
    
    // Pickup events
    'PICKUP_SCHEDULED': 'PICKUP_SCHEDULED',
    'PICKED_UP': 'PICKED_UP',
    
    // Transit events
    'IN_TRANSIT': 'IN_TRANSIT',
    'ARRIVED_AT_HUB': 'IN_TRANSIT',
    'DEPARTED_FROM_HUB': 'IN_TRANSIT',
    'CUSTOMS_CLEARANCE': 'IN_TRANSIT',
    
    // Delivery events
    'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
    'DELIVERY_ATTEMPTED': 'OUT_FOR_DELIVERY',
    'DELIVERED': 'DELIVERED',
    'COMPLETED': 'DELIVERED', // Alternative delivered status
    
    // Exception events
    'CANCELLED': 'CANCELLED',
    'FAILED': 'FAILED',
    'RETURNED': 'FAILED',
    'DAMAGED': 'FAILED',
  };

  return statusMapping[eventCode] || null;
}

/**
 * Determine if notification should be sent for event
 */
function shouldSendNotification(eventCode: string): boolean {
  const notificationEvents = [
    'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 
    'DELIVERY_ATTEMPTED', 'CANCELLED', 'FAILED'
  ];
  return notificationEvents.includes(eventCode);
}

/**
 * Send tracking notification to customer
 */
async function sendTrackingNotification(
  shipment: any,
  webhookData: WebhookPayload,
  statusChanged: boolean
) {
  try {
    // Skip notifications if no customer email
    if (!shipment.order.user?.email) {
      console.log('📧 No customer email for notification');
      return;
    }

    console.log('📧 Sending tracking notification:', {
      email: shipment.order.user.email,
      eventCode: webhookData.event_code,
      statusChanged,
    });

    // TODO: Implement email notification service
    // This would integrate with your email service (e.g., SendGrid, AWS SES)
    
    // Example structure:
    const notificationData = {
      to: shipment.order.user.email,
      customerName: `${shipment.order.user.firstName} ${shipment.order.user.lastName}`,
      orderNumber: shipment.order.orderNumber,
      trackingNumber: shipment.trackingNumber,
      eventName: webhookData.event_name,
      eventDescription: webhookData.event_description,
      location: webhookData.location,
      eventTime: webhookData.event_time,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/track/${shipment.trackingNumber}`,
    };

    // Log notification for development
    console.log('📬 Notification queued:', notificationData);

  } catch (error) {
    console.error('❌ Notification sending failed:', error);
    // Don't throw error - webhook should still succeed
  }
}