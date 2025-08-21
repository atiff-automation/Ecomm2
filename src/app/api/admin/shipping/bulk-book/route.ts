/**
 * Admin Shipping - Bulk Shipment Booking API
 * Books multiple shipments with EasyParcel in batch
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 5.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { z } from 'zod';

const bulkBookingSchema = z.object({
  shipmentIds: z.array(z.string()).min(1).max(50), // Limit bulk operations
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shipmentIds } = bulkBookingSchema.parse(body);

    // Use singleton EasyParcel service
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each shipment
    for (const shipmentId of shipmentIds) {
      try {
        // Check if this is an order ID (for new shipments) or existing shipment ID
        let order;
        let existingShipment = null;

        if (shipmentId.startsWith('pending-')) {
          // This is a new shipment - extract order ID
          const orderId = shipmentId.replace('pending-', '');
          order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
              user: true,
              shippingAddress: true,
              orderItems: {
                include: {
                  product: {
                    select: {
                      name: true,
                      weight: true,
                      dimensions: true,
                      shippingClass: true,
                    }
                  }
                }
              }
            }
          });

          if (!order) {
            results.push({
              shipmentId,
              success: false,
              error: 'Order not found'
            });
            errorCount++;
            continue;
          }
        } else {
          // This is an existing shipment
          existingShipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: {
              order: {
                include: {
                  user: true,
                  shippingAddress: true,
                  orderItems: {
                    include: {
                      product: {
                        select: {
                          name: true,
                          weight: true,
                          dimensions: true,
                          shippingClass: true,
                        }
                      }
                    }
                  }
                }
              }
            }
          });

          if (!existingShipment) {
            results.push({
              shipmentId,
              success: false,
              error: 'Shipment not found'
            });
            errorCount++;
            continue;
          }

          order = existingShipment.order;
        }

        // Skip if already booked
        if (existingShipment && existingShipment.status !== 'DRAFT') {
          results.push({
            shipmentId,
            success: false,
            error: 'Shipment already processed'
          });
            errorCount++;
            continue;
        }

        // Get business address from config
        const businessConfig = await prisma.systemConfig.findFirst({
          where: { key: 'business_address' }
        });

        const businessAddress = businessConfig?.value ? JSON.parse(businessConfig.value) : {
          name: 'Your Business Name',
          phone: '+60123456789',
          email: 'business@example.com',
          addressLine1: 'Business Address',
          city: 'Kuala Lumpur',
          state: 'KUL',
          postalCode: '50000'
        };

        // Calculate parcel details
        const totalWeight = order.orderItems.reduce((sum, item) => {
          const productWeight = item.product.weight || 0.5; // Default 0.5kg
          return sum + (productWeight * item.quantity);
        }, 0);

        // Get largest dimensions
        const dimensions = order.orderItems.reduce((max, item) => {
          const productDimensions = item.product.dimensions as any;
          if (productDimensions && typeof productDimensions === 'object') {
            return {
              length: Math.max(max.length, productDimensions.length || 0),
              width: Math.max(max.width, productDimensions.width || 0),
              height: Math.max(max.height, productDimensions.height || 0),
            };
          }
          return max;
        }, { length: 30, width: 20, height: 10 }); // Default dimensions

        // Prepare shipment booking request
        const bookingRequest = {
          pickup_address: {
            name: businessAddress.name,
            phone: businessAddress.phone,
            email: businessAddress.email,
            address_line_1: businessAddress.addressLine1,
            address_line_2: businessAddress.addressLine2 || '',
            city: businessAddress.city,
            state: businessAddress.state,
            postcode: businessAddress.postalCode,
            country: 'MY'
          },
          delivery_address: {
            name: order.shippingAddress?.name || order.user?.name || order.guestEmail || 'Customer',
            phone: order.user?.phone || order.guestPhone || '+60123456789',
            email: order.user?.email || order.guestEmail || 'customer@example.com',
            address_line_1: order.shippingAddress?.addressLine1 || '',
            address_line_2: order.shippingAddress?.addressLine2 || '',
            city: order.shippingAddress?.city || '',
            state: order.shippingAddress?.state || '',
            postcode: order.shippingAddress?.postalCode || '',
            country: 'MY'
          },
          parcel: {
            weight: Math.max(totalWeight, 0.1), // Minimum 0.1kg
            length: dimensions.length,
            width: dimensions.width,
            height: dimensions.height,
            content: `Order ${order.orderNumber} - ${order.orderItems.length} items`,
            value: order.total,
            quantity: 1
          },
          service_id: order.selectedCourierId || 'default-service',
          reference: order.orderNumber,
          special_instruction: order.deliveryInstructions || 'Handle with care',
          insurance: order.total > 100, // Auto-insure orders over RM100
          signature_required: order.total > 200 // Require signature for high-value orders
        };

        // Book the shipment with EasyParcel
        const bookingResponse = await easyParcelService.bookShipment(bookingRequest);

        if (bookingResponse.shipment_id) {
          // Create or update shipment record
          const shipmentData = {
            easyParcelShipmentId: bookingResponse.shipment_id,
            trackingNumber: bookingResponse.tracking_number,
            status: 'BOOKED',
            statusDescription: 'Shipment booked successfully',
            courierName: bookingResponse.courier?.name || 'EasyParcel',
            serviceName: bookingResponse.courier?.service_name || 'Standard',
            serviceType: 'STANDARD',
            pickupAddress: bookingRequest.pickup_address,
            deliveryAddress: bookingRequest.delivery_address,
            parcelDetails: bookingRequest.parcel,
            originalPrice: bookingResponse.total_price || order.shippingCost || 0,
            finalPrice: bookingResponse.total_price || order.shippingCost || 0,
            estimatedDelivery: bookingResponse.estimated_delivery ? new Date(bookingResponse.estimated_delivery) : undefined,
            specialInstructions: bookingRequest.special_instruction,
            signatureRequired: bookingRequest.signature_required || false,
            insuranceRequired: bookingRequest.insurance || false,
            updatedAt: new Date()
          };

          if (existingShipment) {
            // Update existing shipment
            await prisma.shipment.update({
              where: { id: existingShipment.id },
              data: shipmentData
            });
          } else {
            // Create new shipment
            await prisma.shipment.create({
              data: {
                ...shipmentData,
                orderId: order.id,
                courierId: order.selectedCourierId || 'default',
              }
            });
          }

          // Update order status
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'PROCESSING',
              shippedAt: new Date()
            }
          });

          results.push({
            shipmentId,
            success: true,
            trackingNumber: bookingResponse.tracking_number,
            courierName: bookingResponse.courier?.name,
            orderNumber: order.orderNumber
          });
          successCount++;

        } else {
          results.push({
            shipmentId,
            success: false,
            error: 'EasyParcel booking failed - no shipment ID returned'
          });
          errorCount++;
        }

      } catch (error) {
        console.error(`Error booking shipment ${shipmentId}:`, error);
        results.push({
          shipmentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      results,
      summary: {
        total: shipmentIds.length,
        successCount,
        errorCount,
        successRate: `${Math.round((successCount / shipmentIds.length) * 100)}%`
      }
    });

  } catch (error) {
    console.error('Error in bulk shipment booking:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk shipment booking' },
      { status: 500 }
    );
  }
}