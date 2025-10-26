/**
 * Shared Order Fulfillment Hook
 *
 * Centralized logic for order fulfillment operations to ensure
 * consistency across OrderTable and Individual Order Page.
 *
 * Follows DRY principle and Single Source of Truth from CLAUDE.md
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import type { FulfillmentOverrideOptions } from '@/components/admin/orders/types';

interface UseOrderFulfillmentParams {
  /**
   * Callback to refresh order data after successful fulfillment
   */
  onSuccess?: () => void;
  /**
   * Whether to reload the entire page on success (OrderTable behavior)
   * or just call onSuccess (OrderDetailsPage behavior)
   */
  reloadOnSuccess?: boolean;
}

interface FulfillableOrder {
  id: string;
  orderNumber: string;
  selectedCourierServiceId: string | null;
  paymentStatus: string;
  shipment?: unknown;
}

export function useOrderFulfillment({
  onSuccess,
  reloadOnSuccess = false,
}: UseOrderFulfillmentParams = {}) {
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
  const [selectedOrderForFulfillment, setSelectedOrderForFulfillment] =
    useState<FulfillableOrder | null>(null);
  const [isFulfilling, setIsFulfilling] = useState(false);

  /**
   * Validate and open fulfillment dialog for an order
   * @param order - Order data to validate and fulfill
   * @returns Result object with success flag and optional error message
   */
  const handleFulfill = (order: FulfillableOrder) => {
    // Validate: Order must not already be fulfilled
    if (order.shipment) {
      toast.error('This order has already been fulfilled');
      return {
        success: false,
        error: 'Order already fulfilled',
      };
    }

    // Validate: Payment must be completed
    if (order.paymentStatus !== 'PAID') {
      toast.error('Order must be paid before fulfillment');
      return {
        success: false,
        error: 'Payment not completed',
      };
    }

    // Validate: Courier service must be selected
    if (!order.selectedCourierServiceId) {
      toast.error(
        'No courier service selected. Please select a courier from the order settings.'
      );
      return {
        success: false,
        error: 'No courier service selected',
      };
    }

    // All validations passed - open dialog
    setSelectedOrderForFulfillment(order);
    setFulfillmentDialogOpen(true);

    return {
      success: true,
      message: 'Opening fulfillment dialog...',
    };
  };

  /**
   * Confirm and execute order fulfillment via API
   * @param pickupDate - Scheduled pickup date (YYYY-MM-DD format)
   * @param shipmentId - Legacy parameter, kept for backward compatibility (unused)
   * @param options - Override options (admin override flag and selected service ID)
   */
  const handleConfirmFulfillment = async (
    pickupDate: string,
    shipmentId?: string,
    options?: FulfillmentOverrideOptions
  ) => {
    if (!selectedOrderForFulfillment) {
      throw new Error('No order selected for fulfillment');
    }

    setIsFulfilling(true);

    try {
      const response = await fetchWithCSRF(
        `/api/admin/orders/${selectedOrderForFulfillment.id}/fulfill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId:
              options?.selectedServiceId ||
              selectedOrderForFulfillment.selectedCourierServiceId,
            pickupDate: pickupDate,
            shipmentId: shipmentId, // Legacy parameter, API may ignore
            overriddenByAdmin: options?.overriddenByAdmin || false,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Close dialog
        setFulfillmentDialogOpen(false);
        setSelectedOrderForFulfillment(null);

        // Show success message
        toast.success('Order fulfilled successfully', {
          description: data.trackingNumber
            ? `Tracking: ${data.trackingNumber}`
            : undefined,
        });

        // Trigger success callback or reload
        if (reloadOnSuccess) {
          window.location.reload();
        } else if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fulfill order');
      }
    } catch (error) {
      console.error('[useOrderFulfillment] Fulfillment error:', error);
      // Re-throw to be handled by dialog component
      throw error;
    } finally {
      setIsFulfilling(false);
    }
  };

  /**
   * Close the fulfillment dialog
   */
  const closeFulfillmentDialog = () => {
    setFulfillmentDialogOpen(false);
  };

  return {
    // State
    fulfillmentDialogOpen,
    setFulfillmentDialogOpen,
    selectedOrderForFulfillment,
    isFulfilling,

    // Actions
    handleFulfill,
    handleConfirmFulfillment,
    closeFulfillmentDialog,
  };
}
