'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderInlineActions } from './OrderInlineActions';
import { ResponsiveFulfillmentDialog } from './ResponsiveFulfillmentDialog';
import {
  formatCurrency,
  formatOrderDate,
  getCustomerName,
  getTotalItemsCount,
} from '@/lib/utils/order';
import { OrderStatus } from '@prisma/client';
import type { OrderTableData, OrderTableProps, ActionResult } from './types';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import { useOrderFulfillment } from '@/hooks/use-order-fulfillment';

export function OrderTable({
  orders,
  selectedOrderIds = [],
  onSelectOrder,
  onSelectAll,
  onSort,
  sortColumn,
  sortDirection = 'desc',
  isLoading = false,
}: OrderTableProps) {
  // Use shared fulfillment hook (reload page on success for table view)
  const {
    fulfillmentDialogOpen,
    setFulfillmentDialogOpen,
    selectedOrderForFulfillment,
    isFulfilling,
    handleFulfill: fulfillOrder,
    handleConfirmFulfillment,
  } = useOrderFulfillment({
    reloadOnSuccess: true,
  });

  const allSelected =
    orders.length > 0 && selectedOrderIds.length === orders.length;
  const someSelected =
    selectedOrderIds.length > 0 && selectedOrderIds.length < orders.length;

  const handleStatusUpdate = async (
    orderId: string,
    status: OrderStatus
  ): Promise<ActionResult> => {
    try {
      const response = await fetchWithCSRF(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, triggeredBy: 'admin' }),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Order status updated successfully',
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to update status',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  };

  /**
   * Adapter function for OrderInlineActions compatibility
   * Wraps the shared hook's handleFulfill to return ActionResult
   */
  const handleFulfill = async (orderId: string): Promise<ActionResult> => {
    const orderToFulfill = orders.find(o => o.id === orderId);

    if (!orderToFulfill) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    // Use shared hook's fulfillment logic
    return fulfillOrder(orderToFulfill);
  };

  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center h-64"
        role="status"
        aria-live="polite"
      >
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
          aria-label="Loading orders"
        ></div>
        <span className="sr-only">Loading orders...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 text-gray-500"
        role="status"
      >
        <p className="text-lg font-medium">No orders found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Checkbox Column */}
              <TableHead className="w-12">
                {onSelectAll && (
                  <Checkbox
                    checked={allSelected}
                    {...(someSelected ? { indeterminate: true } : {})}
                    onCheckedChange={checked => onSelectAll(!!checked)}
                    aria-label={
                      allSelected ? 'Deselect all orders' : 'Select all orders'
                    }
                  />
                )}
              </TableHead>

              {/* Order Number */}
              <TableHead className="min-w-[150px]">Order #</TableHead>

              {/* Date - Hidden on mobile */}
              <TableHead className="hidden md:table-cell min-w-[120px]">
                Date
              </TableHead>

              {/* Customer */}
              <TableHead className="min-w-[180px]">Customer</TableHead>

              {/* Items - Hidden on mobile and tablet */}
              <TableHead className="hidden lg:table-cell text-center w-20">
                Items
              </TableHead>

              {/* Total */}
              <TableHead className="text-right min-w-[100px]">Total</TableHead>

              {/* Status */}
              <TableHead className="min-w-[120px]">Status</TableHead>

              {/* Payment - Hidden on mobile */}
              <TableHead className="hidden md:table-cell min-w-[120px]">
                Payment
              </TableHead>

              {/* Actions */}
              <TableHead className="text-right min-w-[200px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orders.map(order => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={e => {
                  // Don't navigate if clicking on checkbox, buttons, or select
                  if (
                    (e.target as HTMLElement).closest('button') ||
                    (e.target as HTMLElement).closest('[role="checkbox"]') ||
                    (e.target as HTMLElement).closest('[role="combobox"]')
                  ) {
                    return;
                  }
                  window.location.href = `/admin/orders/${order.id}`;
                }}
              >
                {/* Checkbox */}
                <TableCell onClick={e => e.stopPropagation()}>
                  {onSelectOrder && (
                    <Checkbox
                      checked={selectedOrderIds.includes(order.id)}
                      onCheckedChange={checked =>
                        onSelectOrder(order.id, !!checked)
                      }
                      aria-label={`Select order ${order.orderNumber}`}
                    />
                  )}
                </TableCell>

                {/* Order Number */}
                <TableCell className="font-medium font-mono text-sm">
                  {order.orderNumber}
                </TableCell>

                {/* Date */}
                <TableCell className="hidden md:table-cell text-sm text-gray-600">
                  {formatOrderDate(order.createdAt)}
                </TableCell>

                {/* Customer */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {getCustomerName(order)}
                    </span>
                    {order.user?.email && (
                      <span className="text-xs text-gray-500">
                        {order.user.email}
                      </span>
                    )}
                    {order.guestEmail && (
                      <span className="text-xs text-gray-500">
                        {order.guestEmail}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Items Count */}
                <TableCell className="hidden lg:table-cell text-center">
                  <span
                    className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-medium"
                    aria-label={`${getTotalItemsCount(order.orderItems)} items`}
                  >
                    {getTotalItemsCount(order.orderItems)}
                  </span>
                </TableCell>

                {/* Total */}
                <TableCell className="text-right font-semibold">
                  {formatCurrency(order.total)}
                </TableCell>

                {/* Order Status */}
                <TableCell>
                  <OrderStatusBadge
                    status={order.status}
                    type="order"
                    size="sm"
                  />
                </TableCell>

                {/* Payment Status */}
                <TableCell className="hidden md:table-cell">
                  <OrderStatusBadge
                    status={order.paymentStatus}
                    type="payment"
                    size="sm"
                  />
                </TableCell>

                {/* Inline Actions */}
                <TableCell
                  className="text-right"
                  onClick={e => e.stopPropagation()}
                >
                  <OrderInlineActions
                    order={{
                      id: order.id,
                      orderNumber: order.orderNumber,
                      status: order.status,
                      paymentStatus: order.paymentStatus,
                      airwayBillGenerated: order.airwayBillGenerated,
                      airwayBillUrl: order.airwayBillUrl,
                      shipment: order.shipment
                        ? {
                            trackingNumber: order.shipment.trackingNumber || '',
                          }
                        : null,
                    }}
                    onStatusUpdate={handleStatusUpdate}
                    onFulfill={handleFulfill}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Fulfillment Confirmation Dialog */}
      {selectedOrderForFulfillment && (
        <ResponsiveFulfillmentDialog
          open={fulfillmentDialogOpen}
          onOpenChange={setFulfillmentDialogOpen}
          order={{
            id: selectedOrderForFulfillment.id,
            orderNumber: selectedOrderForFulfillment.orderNumber,
            courierName: selectedOrderForFulfillment.courierName,
            courierServiceDetail: selectedOrderForFulfillment.courierServiceDetail,
            selectedCourierServiceId:
              selectedOrderForFulfillment.selectedCourierServiceId || '',
            shippingCost: selectedOrderForFulfillment.shippingCost,
          }}
          onConfirm={handleConfirmFulfillment}
          isLoading={isFulfilling}
        />
      )}
    </>
  );
}
