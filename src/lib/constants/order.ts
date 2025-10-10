import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

/**
 * Order Status Configurations
 * Single source of truth for all order statuses
 * Based on Prisma enums from schema.prisma (lines 1124-1155)
 */
export const ORDER_STATUSES = {
  PENDING: {
    value: 'PENDING' as OrderStatus,
    label: 'Pending',
    color: 'gray' as const,
    icon: 'Clock',
    description: 'Order created, awaiting payment',
  },
  PAID: {
    value: 'PAID' as OrderStatus,
    label: 'Paid',
    color: 'green' as const,
    icon: 'CheckCircle',
    description: 'Payment received, ready to process',
  },
  READY_TO_SHIP: {
    value: 'READY_TO_SHIP' as OrderStatus,
    label: 'Ready to Ship',
    color: 'blue' as const,
    icon: 'Package',
    description: 'Order packed and ready for pickup',
  },
  IN_TRANSIT: {
    value: 'IN_TRANSIT' as OrderStatus,
    label: 'In Transit',
    color: 'purple' as const,
    icon: 'Truck',
    description: 'Order is on the way to customer',
  },
  OUT_FOR_DELIVERY: {
    value: 'OUT_FOR_DELIVERY' as OrderStatus,
    label: 'Out for Delivery',
    color: 'indigo' as const,
    icon: 'Truck',
    description: 'Order is out for final delivery',
  },
  DELIVERED: {
    value: 'DELIVERED' as OrderStatus,
    label: 'Delivered',
    color: 'green' as const,
    icon: 'CheckCircle',
    description: 'Order successfully delivered',
  },
  CANCELLED: {
    value: 'CANCELLED' as OrderStatus,
    label: 'Cancelled',
    color: 'red' as const,
    icon: 'XCircle',
    description: 'Order cancelled by customer or admin',
  },
  REFUNDED: {
    value: 'REFUNDED' as OrderStatus,
    label: 'Refunded',
    color: 'orange' as const,
    icon: 'RefreshCw',
    description: 'Payment refunded to customer',
  },
} as const;

/**
 * Payment Status Configurations
 */
export const PAYMENT_STATUSES = {
  PENDING: {
    value: 'PENDING' as PaymentStatus,
    label: 'Awaiting Payment',
    color: 'yellow' as const,
    icon: 'Clock',
    description: 'Payment not yet received',
  },
  PAID: {
    value: 'PAID' as PaymentStatus,
    label: 'Paid',
    color: 'green' as const,
    icon: 'CheckCircle',
    description: 'Payment successfully received',
  },
  FAILED: {
    value: 'FAILED' as PaymentStatus,
    label: 'Payment Failed',
    color: 'red' as const,
    icon: 'XCircle',
    description: 'Payment processing failed',
  },
  REFUNDED: {
    value: 'REFUNDED' as PaymentStatus,
    label: 'Refunded',
    color: 'orange' as const,
    icon: 'RefreshCw',
    description: 'Full refund processed',
  },
  PARTIALLY_REFUNDED: {
    value: 'PARTIALLY_REFUNDED' as PaymentStatus,
    label: 'Partially Refunded',
    color: 'orange' as const,
    icon: 'RefreshCw',
    description: 'Partial refund processed',
  },
} as const;

/**
 * Shipment Status Configurations
 */
export const SHIPMENT_STATUSES = {
  DRAFT: {
    value: 'DRAFT' as ShipmentStatus,
    label: 'Draft',
    color: 'gray' as const,
    icon: 'FileText',
    description: 'Shipment details being prepared',
  },
  RATE_CALCULATED: {
    value: 'RATE_CALCULATED' as ShipmentStatus,
    label: 'Rate Calculated',
    color: 'blue' as const,
    icon: 'Calculator',
    description: 'Shipping rate calculated',
  },
  BOOKED: {
    value: 'BOOKED' as ShipmentStatus,
    label: 'Booked',
    color: 'blue' as const,
    icon: 'CheckSquare',
    description: 'Shipment booked with courier',
  },
  LABEL_GENERATED: {
    value: 'LABEL_GENERATED' as ShipmentStatus,
    label: 'Label Generated',
    color: 'indigo' as const,
    icon: 'Tag',
    description: 'Shipping label generated',
  },
  PICKUP_SCHEDULED: {
    value: 'PICKUP_SCHEDULED' as ShipmentStatus,
    label: 'Pickup Scheduled',
    color: 'purple' as const,
    icon: 'Calendar',
    description: 'Courier pickup scheduled',
  },
  PICKED_UP: {
    value: 'PICKED_UP' as ShipmentStatus,
    label: 'Picked Up',
    color: 'purple' as const,
    icon: 'Package',
    description: 'Package picked up by courier',
  },
  IN_TRANSIT: {
    value: 'IN_TRANSIT' as ShipmentStatus,
    label: 'In Transit',
    color: 'blue' as const,
    icon: 'Truck',
    description: 'Package in transit',
  },
  OUT_FOR_DELIVERY: {
    value: 'OUT_FOR_DELIVERY' as ShipmentStatus,
    label: 'Out for Delivery',
    color: 'indigo' as const,
    icon: 'Truck',
    description: 'Package out for final delivery',
  },
  DELIVERED: {
    value: 'DELIVERED' as ShipmentStatus,
    label: 'Delivered',
    color: 'green' as const,
    icon: 'CheckCircle',
    description: 'Package successfully delivered',
  },
  FAILED: {
    value: 'FAILED' as ShipmentStatus,
    label: 'Delivery Failed',
    color: 'red' as const,
    icon: 'AlertCircle',
    description: 'Delivery attempt failed',
  },
  CANCELLED: {
    value: 'CANCELLED' as ShipmentStatus,
    label: 'Cancelled',
    color: 'red' as const,
    icon: 'XCircle',
    description: 'Shipment cancelled',
  },
} as const;

/**
 * Status Tabs Configuration
 * For main order list page filtering (WooCommerce-style)
 */
export const ORDER_STATUS_TABS = [
  {
    id: 'all',
    label: 'All',
    filter: null,
    icon: 'List',
    description: 'Show all orders',
  },
  {
    id: 'awaiting-payment',
    label: 'Awaiting Payment',
    filter: { paymentStatus: 'PENDING' },
    icon: 'Clock',
    badge: 'urgent' as const,
    description: 'Orders waiting for payment',
  },
  {
    id: 'processing',
    label: 'Processing',
    filter: {
      paymentStatus: 'PAID',
      status: { in: ['PAID', 'READY_TO_SHIP'] },
      shipment: null,
    },
    icon: 'Package',
    badge: 'warning' as const,
    description: 'Paid orders awaiting fulfillment',
  },
  {
    id: 'shipped',
    label: 'Shipped',
    filter: {
      status: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
    },
    icon: 'Truck',
    description: 'Orders in transit',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    filter: { status: 'DELIVERED' },
    icon: 'CheckCircle',
    description: 'Successfully delivered orders',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    filter: { status: 'CANCELLED' },
    icon: 'XCircle',
    description: 'Cancelled orders',
  },
] as const;

/**
 * Date Filter Presets
 */
export const ORDER_DATE_FILTERS = [
  {
    id: 'today',
    label: 'Today',
    days: 0,
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { from: today, to: tomorrow };
    },
  },
  {
    id: 'last-7-days',
    label: 'Last 7 Days',
    days: 7,
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);
      return { from, to };
    },
  },
  {
    id: 'last-30-days',
    label: 'Last 30 Days',
    days: 30,
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      return { from, to };
    },
  },
  {
    id: 'last-90-days',
    label: 'Last 90 Days',
    days: 90,
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);
      return { from, to };
    },
  },
  {
    id: 'custom',
    label: 'Custom Range',
    days: null,
    getValue: () => null, // User will provide custom dates
  },
] as const;

/**
 * Type exports
 */
export type OrderStatusKey = keyof typeof ORDER_STATUSES;
export type PaymentStatusKey = keyof typeof PAYMENT_STATUSES;
export type ShipmentStatusKey = keyof typeof SHIPMENT_STATUSES;
