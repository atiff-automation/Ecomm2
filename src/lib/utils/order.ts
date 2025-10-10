import { Decimal } from '@prisma/client/runtime/library';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';
import { formatPrice } from '@/lib/utils/currency';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SHIPMENT_STATUSES,
} from '@/lib/constants/order';

/**
 * Format currency using existing utility
 * @param amount - Number or Decimal amount
 * @returns Formatted price string (e.g., "RM 150.00")
 */
export function formatCurrency(amount: number | Decimal): string {
  return formatPrice(Number(amount));
}

/**
 * Format order date
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "Oct 9, 2025")
 */
export function formatOrderDate(date: Date | string): string {
  return formatDate(date, { format: 'medium' });
}

/**
 * Format order date and time
 * @param date - Date object or ISO string
 * @returns Formatted datetime string (e.g., "Oct 9, 2025, 10:30 AM")
 */
export function formatOrderDateTime(date: Date | string): string {
  return formatDateTime(date, {
    dateFormat: 'medium',
    timeFormat: 'short',
  });
}

/**
 * Get status badge configuration
 * @param status - Status value
 * @param type - Status type (order, payment, shipment)
 * @returns Status configuration object
 */
export function getStatusBadge(
  status: string,
  type: 'order' | 'payment' | 'shipment'
): {
  label: string;
  color: string;
  icon: string;
  description: string;
} {
  const statusMap = {
    order: ORDER_STATUSES,
    payment: PAYMENT_STATUSES,
    shipment: SHIPMENT_STATUSES,
  }[type];

  const config = statusMap[status as keyof typeof statusMap];

  return (
    config || {
      label: status,
      color: 'gray' as const,
      icon: 'HelpCircle',
      description: 'Unknown status',
    }
  );
}

/**
 * Get Tailwind color classes for status
 * @param status - Status value
 * @param type - Status type (order, payment, shipment)
 * @returns Tailwind CSS class string
 */
export function getStatusColor(
  status: string,
  type: 'order' | 'payment' | 'shipment'
): string {
  const badge = getStatusBadge(status, type);

  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
  };

  return colorMap[badge.color] || colorMap.gray;
}

/**
 * Format order number for display
 * Order numbers are already formatted from API (e.g., ORD-20251009-ABCD)
 * @param orderNumber - Order number string
 * @returns Formatted order number
 */
export function formatOrderNumber(orderNumber: string): string {
  return orderNumber;
}

/**
 * Get human-readable label for order status
 * @param status - Order status enum
 * @returns Status label
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUSES[status]?.label || status;
}

/**
 * Get human-readable label for payment status
 * @param status - Payment status enum
 * @returns Status label
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUSES[status]?.label || status;
}

/**
 * Get human-readable label for shipment status
 * @param status - Shipment status enum
 * @returns Status label
 */
export function getShipmentStatusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUSES[status]?.label || status;
}

/**
 * Get customer display name
 * @param order - Order object with user and guestEmail fields
 * @returns Customer name or guest label
 */
export function getCustomerName(order: {
  user?: { firstName: string; lastName: string } | null;
  guestEmail?: string | null;
}): string {
  if (order.user) {
    return `${order.user.firstName} ${order.user.lastName}`;
  }
  if (order.guestEmail) {
    return `Guest (${order.guestEmail})`;
  }
  return 'Unknown Customer';
}

/**
 * Calculate total items count
 * @param orderItems - Array of order items
 * @returns Total quantity of all items
 */
export function getTotalItemsCount(orderItems: { quantity: number }[]): number {
  return orderItems.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Check if order can be fulfilled
 * @param order - Order object
 * @returns True if order is paid and has no shipment
 */
export function canFulfillOrder(order: {
  paymentStatus: PaymentStatus;
  shipment?: { id: string } | null;
}): boolean {
  return order.paymentStatus === 'PAID' && !order.shipment;
}

/**
 * Check if order has tracking
 * @param order - Order object
 * @returns True if order has tracking number
 */
export function hasTracking(order: {
  shipment?: { trackingNumber: string | null } | null;
}): boolean {
  return Boolean(order.shipment?.trackingNumber);
}
