/**
 * EasyParcel API Logger
 * Wraps EasyParcel service with detailed logging
 *
 * Usage:
 *   import { createLoggedEasyParcelService } from '@/lib/monitoring/easyparcel-logger';
 *   const service = createLoggedEasyParcelService(settings);
 */

import { orderFlowLogger } from './order-flow-logger';
import { createEasyParcelService } from '@/lib/shipping/easyparcel-service';
import type { ShippingSettings } from '@/lib/shipping/types';

/**
 * Wraps EasyParcel service with detailed logging
 */
export function createLoggedEasyParcelService(settings: ShippingSettings) {
  const service = createEasyParcelService(settings);

  return {
    async getRates(pickup: any, delivery: any, weight: number) {
      orderFlowLogger.logInfo(
        'EasyParcel: Rate Checking',
        'Starting rate check',
        {
          pickup: {
            postalCode: pickup.postalCode,
            state: pickup.state,
            country: pickup.country
          },
          delivery: {
            postalCode: delivery.postalCode,
            state: delivery.state,
            country: delivery.country
          },
          weight
        }
      );

      orderFlowLogger.logRequest('EasyParcel: Rate Request', 'EPRateCheckingBulk', {
        pickup: pickup.postalCode,
        delivery: delivery.postalCode,
        weight
      });

      try {
        const rates = await service.getRates(pickup, delivery, weight);

        orderFlowLogger.logResponse('EasyParcel: Rate Response', 'EPRateCheckingBulk', {
          ratesCount: rates.length,
          rates: rates.map(r => ({
            serviceId: r.service_id,
            courier: r.courier_name,
            service: r.service_name,
            price: r.price,
            delivery: r.estimated_delivery_days
          }))
        });

        return rates;
      } catch (error) {
        orderFlowLogger.logError('EasyParcel: Rate Check Failed', error, {
          pickup: pickup.postalCode,
          delivery: delivery.postalCode,
          weight
        });
        throw error;
      }
    },

    async createShipment(request: any) {
      orderFlowLogger.logInfo(
        'EasyParcel: Shipment Booking',
        '⚠️ PAID OPERATION - Creating shipment (this will use credits!)'
      );

      orderFlowLogger.logRequest('EasyParcel: Shipment Request', 'EPMakeOrderBulk', {
        serviceId: request.service_id,
        reference: request.reference,
        pickup: {
          name: request.pickup.name,
          postalCode: request.pickup.postcode,
          state: request.pickup.state
        },
        delivery: {
          name: request.delivery.name,
          postalCode: request.delivery.postcode,
          state: request.delivery.state
        },
        parcel: request.parcel,
        pickupDate: request.pickup.pickup_date,
        whatsappTracking: request.addon_whatsapp_tracking_enabled
      });

      try {
        const result = await service.createShipment(request);

        orderFlowLogger.logResponse('EasyParcel: Shipment Response', 'EPMakeOrderBulk', {
          shipmentId: result.data.shipment_id,
          trackingNumber: result.data.tracking_number,
          awbNumber: result.data.awb_number,
          labelUrl: result.data.label_url,
          estimatedCost: result.data.price || 'Unknown'
        });

        orderFlowLogger.logInfo(
          'EasyParcel: Shipment Created',
          '💰 Credits have been deducted from your account',
          {
            trackingNumber: result.data.tracking_number,
            cost: result.data.price || 'Unknown'
          }
        );

        return result;
      } catch (error) {
        orderFlowLogger.logError('EasyParcel: Shipment Booking Failed', error, {
          serviceId: request.service_id,
          reference: request.reference
        });
        throw error;
      }
    },

    async getBalance() {
      orderFlowLogger.logInfo('EasyParcel: Balance Check', 'Checking account balance');

      try {
        const result = await service.getBalance();

        orderFlowLogger.logResponse('EasyParcel: Balance', 'EPCheckCreditBalance', {
          balance: result.data.balance,
          currency: result.data.currency
        });

        return result;
      } catch (error) {
        orderFlowLogger.logError('EasyParcel: Balance Check Failed', error);
        throw error;
      }
    },

    async getTracking(trackingNumber: string) {
      orderFlowLogger.logInfo('EasyParcel: Tracking', 'Fetching tracking information', {
        trackingNumber
      });

      try {
        const result = await service.getTracking(trackingNumber);

        orderFlowLogger.logResponse('EasyParcel: Tracking Response', 'EPTracking', {
          trackingNumber: result.data.tracking_number,
          status: result.data.current_status,
          eventsCount: result.data.events?.length || 0
        });

        return result;
      } catch (error) {
        orderFlowLogger.logError('EasyParcel: Tracking Failed', error, {
          trackingNumber
        });
        throw error;
      }
    }
  };
}
