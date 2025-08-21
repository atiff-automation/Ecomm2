/**
 * Admin Courier Assignment API
 * Assigns main and alternative couriers to orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const courierAssignmentSchema = z.object({
  orderId: z.string().min(1),
  mainCourier: z.object({
    courier_id: z.string().min(1),
    courier_name: z.string().min(1),
    service_name: z.string().min(1),
    service_type: z.string(),
    price: z.number().min(0),
    estimated_delivery_days: z.number().min(1),
    estimated_delivery: z.string().min(1),
    features: z.object({
      insurance_available: z.boolean(),
      cod_available: z.boolean(),
      signature_required_available: z.boolean(),
    }),
    description: z.string().optional(),
  }),
  alternativeCourier: z.object({
    courier_id: z.string().min(1),
    courier_name: z.string().min(1),
    service_name: z.string().min(1),
    service_type: z.string(),
    price: z.number().min(0),
    estimated_delivery_days: z.number().min(1),
    estimated_delivery: z.string().min(1),
    features: z.object({
      insurance_available: z.boolean(),
      cod_available: z.boolean(),
      signature_required_available: z.boolean(),
    }),
    description: z.string().optional(),
  }).optional(),
  selectionReason: z.string().optional(),
});

/**
 * POST - Assign couriers to order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📋 Courier assignment request:', body);

    // Validate request
    const validatedData = courierAssignmentSchema.parse(body);

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        orderItems: {
          include: {
            product: {
              select: { name: true, weight: true }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate total weight for validation
    const totalWeight = order.orderItems.reduce((sum, item) => {
      return sum + (item.product.weight || 0.5) * item.quantity;
    }, 0);

    const result = await prisma.$transaction(async (tx) => {
      // Create or update shipment record
      let shipment = await tx.shipment.findFirst({
        where: { orderId: validatedData.orderId }
      });

      if (shipment) {
        // Update existing shipment
        shipment = await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            courierName: validatedData.mainCourier.courier_name,
            courierService: validatedData.mainCourier.service_name,
            serviceName: validatedData.mainCourier.service_name,
            serviceType: validatedData.mainCourier.service_type as any,
            shippingCost: validatedData.mainCourier.price,
            estimatedDelivery: new Date(Date.now() + validatedData.mainCourier.estimated_delivery_days * 24 * 60 * 60 * 1000),
            status: 'COURIER_ASSIGNED',
            statusDescription: `Assigned to ${validatedData.mainCourier.courier_name}`,
            updatedAt: new Date(),
            // Store courier selection data in metadata
            metadata: {
              adminSelection: {
                mainCourier: validatedData.mainCourier,
                alternativeCourier: validatedData.alternativeCourier,
                selectionReason: validatedData.selectionReason,
                assignedBy: session.user.email,
                assignedAt: new Date().toISOString(),
                totalWeight,
              }
            }
          }
        });
      } else {
        // Create new shipment
        shipment = await tx.shipment.create({
          data: {
            orderId: validatedData.orderId,
            courierName: validatedData.mainCourier.courier_name,
            courierService: validatedData.mainCourier.service_name,
            serviceName: validatedData.mainCourier.service_name,
            serviceType: validatedData.mainCourier.service_type as any,
            shippingCost: validatedData.mainCourier.price,
            estimatedDelivery: new Date(Date.now() + validatedData.mainCourier.estimated_delivery_days * 24 * 60 * 60 * 1000),
            status: 'COURIER_ASSIGNED',
            statusDescription: `Assigned to ${validatedData.mainCourier.courier_name}`,
            // Store courier selection data in metadata
            metadata: {
              adminSelection: {
                mainCourier: validatedData.mainCourier,
                alternativeCourier: validatedData.alternativeCourier,
                selectionReason: validatedData.selectionReason,
                assignedBy: session.user.email,
                assignedAt: new Date().toISOString(),
                totalWeight,
              }
            }
          }
        });
      }

      // Create shipment tracking event
      await tx.shipmentTracking.create({
        data: {
          shipmentId: shipment.id,
          eventCode: 'COURIER_ASSIGNED',
          eventName: 'Courier Assigned',
          description: `Admin assigned ${validatedData.mainCourier.courier_name} (${validatedData.mainCourier.service_name})${validatedData.alternativeCourier ? ` with ${validatedData.alternativeCourier.courier_name} as alternative` : ''}`,
          eventTime: new Date(),
          source: 'ADMIN',
        }
      });

      // Update order status if needed
      if (order.status === 'CONFIRMED') {
        await tx.order.update({
          where: { id: validatedData.orderId },
          data: { 
            status: 'PROCESSING',
            updatedAt: new Date(),
          }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'COURIER_ASSIGNED',
          resource: 'Order',
          resourceId: validatedData.orderId,
          details: {
            orderNumber: order.orderNumber,
            mainCourier: {
              name: validatedData.mainCourier.courier_name,
              service: validatedData.mainCourier.service_name,
              price: validatedData.mainCourier.price,
            },
            alternativeCourier: validatedData.alternativeCourier ? {
              name: validatedData.alternativeCourier.courier_name,
              service: validatedData.alternativeCourier.service_name,
              price: validatedData.alternativeCourier.price,
            } : null,
            selectionReason: validatedData.selectionReason,
            totalWeight,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'admin',
          userAgent: request.headers.get('user-agent') || 'Admin Panel',
        }
      });

      return { shipment, order };
    });

    console.log('✅ Courier assignment completed:', {
      orderId: validatedData.orderId,
      orderNumber: order.orderNumber,
      mainCourier: validatedData.mainCourier.courier_name,
      alternativeCourier: validatedData.alternativeCourier?.courier_name,
      shipmentId: result.shipment.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Courier assignment completed successfully',
      data: {
        shipmentId: result.shipment.id,
        orderId: validatedData.orderId,
        orderNumber: order.orderNumber,
        mainCourier: {
          name: validatedData.mainCourier.courier_name,
          service: validatedData.mainCourier.service_name,
          price: validatedData.mainCourier.price,
          estimatedDelivery: validatedData.mainCourier.estimated_delivery,
        },
        alternativeCourier: validatedData.alternativeCourier ? {
          name: validatedData.alternativeCourier.courier_name,
          service: validatedData.alternativeCourier.service_name,
          price: validatedData.alternativeCourier.price,
          estimatedDelivery: validatedData.alternativeCourier.estimated_delivery,
        } : null,
        status: result.shipment.status,
        assignedBy: session.user.email,
        assignedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Courier assignment error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to assign couriers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get courier assignments for orders
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      // Get specific order's courier assignment
      const shipment = await prisma.shipment.findFirst({
        where: { orderId },
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
            }
          }
        }
      });

      if (!shipment) {
        return NextResponse.json(
          { error: 'No courier assignment found for this order' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        assignment: {
          shipmentId: shipment.id,
          orderId: shipment.orderId,
          orderNumber: shipment.order.orderNumber,
          courierName: shipment.courierName,
          serviceName: shipment.serviceName,
          shippingCost: shipment.shippingCost,
          status: shipment.status,
          estimatedDelivery: shipment.estimatedDelivery,
          metadata: shipment.metadata,
        }
      });
    } else {
      // Get all recent courier assignments
      const assignments = await prisma.shipment.findMany({
        where: {
          status: 'COURIER_ASSIGNED'
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      });

      return NextResponse.json({
        success: true,
        assignments: assignments.map(shipment => ({
          shipmentId: shipment.id,
          orderId: shipment.orderId,
          orderNumber: shipment.order.orderNumber,
          customerName: `${shipment.order.user?.firstName} ${shipment.order.user?.lastName}`,
          courierName: shipment.courierName,
          serviceName: shipment.serviceName,
          shippingCost: shipment.shippingCost,
          status: shipment.status,
          assignedAt: shipment.updatedAt,
          estimatedDelivery: shipment.estimatedDelivery,
        }))
      });
    }

  } catch (error) {
    console.error('❌ Get courier assignments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courier assignments' },
      { status: 500 }
    );
  }
}