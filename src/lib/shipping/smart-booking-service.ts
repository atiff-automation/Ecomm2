/**
 * Smart Booking Service with Courier Fallback
 * Handles booking with main courier and fallback to alternative if needed
 * Reference: Malaysia_Individual_1.4.0.0.pdf Section 5 - Booking Process
 */

import { easyParcelService, EasyParcelService, type BookingRequest, type ShipmentBookingResponse } from './easyparcel-service';
import { prisma } from '@/lib/db/prisma';

export interface CourierBookingData {
  courier_id: string;
  courier_name: string;
  service_name: string;
  service_type: string;
  price: number;
  estimated_delivery_days: number;
  estimated_delivery: string;
  features: {
    insurance_available: boolean;
    cod_available: boolean;
    signature_required_available: boolean;
  };
}

export interface SmartBookingRequest {
  orderId: string;
  mainCourier: CourierBookingData;
  alternativeCourier?: CourierBookingData;
  bookingData: BookingRequest;
  options?: {
    insurance?: boolean;
    insuranceAmount?: number;
    cod?: boolean;
    codAmount?: number;
    signatureRequired?: boolean;
    specialInstructions?: string;
  };
}

export interface SmartBookingResult {
  success: boolean;
  bookingResponse?: ShipmentBookingResponse;
  usedCourier: CourierBookingData;
  fallbackUsed: boolean;
  attempts: Array<{
    courier: string;
    success: boolean;
    error?: string;
    timestamp: Date;
  }>;
  shipmentId?: string;
  trackingNumber?: string;
}

export class SmartBookingService {
  private easyParcelService: EasyParcelService;

  constructor() {
    this.easyParcelService = easyParcelService;
  }

  /**
   * Book shipment with main courier and fallback to alternative if needed
   */
  async bookShipmentWithFallback(request: SmartBookingRequest): Promise<SmartBookingResult> {
    const attempts: SmartBookingResult['attempts'] = [];
    
    console.log('🎯 Starting smart booking for order:', request.orderId);
    console.log('📋 Main courier:', request.mainCourier.courier_name);
    console.log('🔄 Alternative courier:', request.alternativeCourier?.courier_name || 'None');

    // Attempt 1: Try main courier
    console.log('🚀 Attempting booking with main courier:', request.mainCourier.courier_name);
    
    const mainBookingRequest = this.buildBookingRequest(request, request.mainCourier);
    
    try {
      const mainResult = await this.easyParcelService.bookShipment(mainBookingRequest);
      
      attempts.push({
        courier: request.mainCourier.courier_name,
        success: true,
        timestamp: new Date(),
      });

      console.log('✅ Main courier booking successful:', {
        courier: request.mainCourier.courier_name,
        shipmentId: mainResult.shipment_id,
        trackingNumber: mainResult.tracking_number,
      });

      // Update shipment record with booking details
      await this.updateShipmentWithBooking(request.orderId, mainResult, request.mainCourier, false);

      return {
        success: true,
        bookingResponse: mainResult,
        usedCourier: request.mainCourier,
        fallbackUsed: false,
        attempts,
        shipmentId: mainResult.shipment_id,
        trackingNumber: mainResult.tracking_number,
      };

    } catch (mainError) {
      const errorMessage = mainError instanceof Error ? mainError.message : 'Unknown error';
      console.warn('⚠️ Main courier booking failed:', {
        courier: request.mainCourier.courier_name,
        error: errorMessage,
      });

      attempts.push({
        courier: request.mainCourier.courier_name,
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      });

      // Attempt 2: Try alternative courier if available
      if (request.alternativeCourier) {
        console.log('🔄 Attempting fallback to alternative courier:', request.alternativeCourier.courier_name);
        
        const altBookingRequest = this.buildBookingRequest(request, request.alternativeCourier);
        
        try {
          const altResult = await this.easyParcelService.bookShipment(altBookingRequest);
          
          attempts.push({
            courier: request.alternativeCourier.courier_name,
            success: true,
            timestamp: new Date(),
          });

          console.log('✅ Alternative courier booking successful:', {
            courier: request.alternativeCourier.courier_name,
            shipmentId: altResult.shipment_id,
            trackingNumber: altResult.tracking_number,
          });

          // Update shipment record with fallback booking details
          await this.updateShipmentWithBooking(request.orderId, altResult, request.alternativeCourier, true);

          return {
            success: true,
            bookingResponse: altResult,
            usedCourier: request.alternativeCourier,
            fallbackUsed: true,
            attempts,
            shipmentId: altResult.shipment_id,
            trackingNumber: altResult.tracking_number,
          };

        } catch (altError) {
          const altErrorMessage = altError instanceof Error ? altError.message : 'Unknown error';
          console.error('❌ Alternative courier booking also failed:', {
            courier: request.alternativeCourier.courier_name,
            error: altErrorMessage,
          });

          attempts.push({
            courier: request.alternativeCourier.courier_name,
            success: false,
            error: altErrorMessage,
            timestamp: new Date(),
          });

          // Both couriers failed - update shipment status
          await this.updateShipmentWithFailure(request.orderId, attempts);

          return {
            success: false,
            usedCourier: request.mainCourier, // Return main courier for reference
            fallbackUsed: false,
            attempts,
          };
        }
      } else {
        console.error('❌ No alternative courier available, booking failed');
        
        // Update shipment status with failure
        await this.updateShipmentWithFailure(request.orderId, attempts);

        return {
          success: false,
          usedCourier: request.mainCourier,
          fallbackUsed: false,
          attempts,
        };
      }
    }
  }

  /**
   * Build EasyParcel booking request for specific courier
   */
  private buildBookingRequest(request: SmartBookingRequest, courier: CourierBookingData): BookingRequest {
    const baseRequest = request.bookingData;
    
    return {
      ...baseRequest,
      service_type: courier.service_type as any,
      courier_name: courier.courier_name,
      service_name: courier.service_name,
      // Apply options if provided
      insurance: request.options?.insurance && courier.features.insurance_available,
      insurance_amount: request.options?.insuranceAmount,
      cod: request.options?.cod && courier.features.cod_available,
      cod_amount: request.options?.codAmount,
      signature_required: request.options?.signatureRequired && courier.features.signature_required_available,
      special_instructions: request.options?.specialInstructions,
    };
  }

  /**
   * Update shipment record with successful booking details
   */
  private async updateShipmentWithBooking(
    orderId: string, 
    bookingResult: ShipmentBookingResponse, 
    usedCourier: CourierBookingData,
    fallbackUsed: boolean
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update shipment
        const shipment = await tx.shipment.updateMany({
          where: { orderId },
          data: {
            easyParcelShipmentId: bookingResult.shipment_id,
            trackingNumber: bookingResult.tracking_number,
            courierName: usedCourier.courier_name,
            serviceName: usedCourier.service_name,
            serviceType: usedCourier.service_type as any,
            status: 'BOOKED',
            statusDescription: fallbackUsed 
              ? `Booked with ${usedCourier.courier_name} (fallback used)`
              : `Booked with ${usedCourier.courier_name}`,
            updatedAt: new Date(),
            // Update metadata with booking details
            metadata: {
              booking: {
                shipmentId: bookingResult.shipment_id,
                trackingNumber: bookingResult.tracking_number,
                usedCourier: usedCourier.courier_name,
                fallbackUsed,
                bookedAt: new Date().toISOString(),
                estimatedDelivery: bookingResult.estimated_delivery,
                pickupDate: bookingResult.pickup_date,
              }
            }
          }
        });

        // Create tracking event
        const shipmentRecord = await tx.shipment.findFirst({
          where: { orderId }
        });

        if (shipmentRecord) {
          await tx.shipmentTracking.create({
            data: {
              shipmentId: shipmentRecord.id,
              eventCode: 'BOOKED',
              eventName: 'Shipment Booked',
              description: fallbackUsed 
                ? `Shipment successfully booked with ${usedCourier.courier_name} (alternative courier used due to main courier failure)`
                : `Shipment successfully booked with ${usedCourier.courier_name}`,
              eventTime: new Date(),
              source: 'EASYPARCEL',
            }
          });
        }

        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'SHIPPED',
            shippedAt: new Date(),
            trackingNumber: bookingResult.tracking_number,
          }
        });
      });

      console.log('✅ Shipment record updated with booking details');
    } catch (error) {
      console.error('❌ Failed to update shipment record:', error);
      throw error;
    }
  }

  /**
   * Update shipment record with booking failure details
   */
  private async updateShipmentWithFailure(
    orderId: string, 
    attempts: SmartBookingResult['attempts']
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update shipment with failure
        await tx.shipment.updateMany({
          where: { orderId },
          data: {
            status: 'BOOKING_FAILED',
            statusDescription: 'Booking failed with all selected couriers',
            updatedAt: new Date(),
            metadata: {
              bookingFailure: {
                attempts: attempts.map(attempt => ({
                  courier: attempt.courier,
                  success: attempt.success,
                  error: attempt.error,
                  timestamp: attempt.timestamp.toISOString(),
                })),
                failedAt: new Date().toISOString(),
              }
            }
          }
        });

        // Create tracking event for failure
        const shipmentRecord = await tx.shipment.findFirst({
          where: { orderId }
        });

        if (shipmentRecord) {
          await tx.shipmentTracking.create({
            data: {
              shipmentId: shipmentRecord.id,
              eventCode: 'BOOKING_FAILED',
              eventName: 'Booking Failed',
              description: `Failed to book shipment with all selected couriers: ${attempts.map(a => `${a.courier} (${a.success ? 'success' : 'failed'})`).join(', ')}`,
              eventTime: new Date(),
              source: 'SYSTEM',
            }
          });
        }
      });

      console.log('✅ Shipment record updated with failure details');
    } catch (error) {
      console.error('❌ Failed to update shipment failure record:', error);
      throw error;
    }
  }

  /**
   * Get booking status and history for an order
   */
  async getBookingStatus(orderId: string): Promise<{
    shipment?: any;
    history: any[];
    lastAttempt?: Date;
  }> {
    try {
      const shipment = await prisma.shipment.findFirst({
        where: { orderId },
        include: {
          trackingEvents: {
            orderBy: { eventTime: 'desc' }
          }
        }
      });

      if (!shipment) {
        return { history: [] };
      }

      return {
        shipment,
        history: shipment.trackingEvents,
        lastAttempt: shipment.updatedAt,
      };
    } catch (error) {
      console.error('❌ Failed to get booking status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const smartBookingService = new SmartBookingService();