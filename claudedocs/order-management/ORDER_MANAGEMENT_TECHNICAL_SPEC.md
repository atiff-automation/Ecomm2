# Order Management Technical Specification
**Complete Implementation Guide for Developers**

## Document Purpose

This document provides **complete technical specifications** for implementing the Order Management Redesign. It includes:
- Complete TypeScript interfaces (copy-paste ready)
- Full code examples for reference
- Exact API request/response formats
- UI design system specifications
- Error handling patterns
- Loading & empty state requirements
- Dependencies and setup instructions

**Related Documents:**
- `ORDER_MANAGEMENT_REDESIGN_PLAN.md` - High-level design and UX patterns
- `ORDER_MANAGEMENT_INTEGRATION_PLAN.md` - Integration with existing codebase
- `ORDER_MANAGEMENT_QA_SPEC.md` - Testing and quality assurance
- `ORDER_MANAGEMENT_DEV_GUIDE.md` - Development workflow and setup

---

## Table of Contents

1. [Dependencies & Setup](#dependencies--setup)
2. [TypeScript Interfaces](#typescript-interfaces)
3. [Complete Code Examples](#complete-code-examples)
4. [API Specifications](#api-specifications)
5. [UI Design System](#ui-design-system)
6. [Error Handling](#error-handling)
7. [Loading & Empty States](#loading--empty-states)
8. [Responsive Design](#responsive-design)

---

## Dependencies & Setup

### Required npm Packages

```bash
# UI Icons
npm install lucide-react@^0.263.1

# Date Utilities (already installed)
# date-fns or use existing date utils

# Table Management (optional - for advanced sorting/filtering)
npm install @tanstack/react-table@^8.10.0

# Toast Notifications (if not already installed)
npm install react-hot-toast@^2.4.1
# OR use existing toast system

# PDF Generation (already installed for invoices)
# puppeteer (for server-side PDF generation)
```

### Environment Variables

```bash
# .env.local (if needed)
ORDER_WEBHOOK_SECRET=your-webhook-secret-here
```

### Prisma Schema Verification

Ensure your Prisma schema includes (already verified in integration plan):
- `Order` model with all required fields
- `OrderItem` model
- `Shipment` model
- `ShipmentTracking` model
- Enums: `OrderStatus`, `PaymentStatus`, `ShipmentStatus`

---

## TypeScript Interfaces

### Phase 1: Constants & Utils Types

#### src/lib/constants/order.ts

```typescript
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

/**
 * Status configuration type
 */
export interface StatusConfig {
  value: string;
  label: string;
  color: 'gray' | 'green' | 'blue' | 'purple' | 'indigo' | 'yellow' | 'red' | 'orange';
  icon: string; // Lucide icon name
  description?: string;
}

/**
 * Order status configurations
 */
export type OrderStatusMap = {
  [K in OrderStatus]: StatusConfig;
};

/**
 * Payment status configurations
 */
export type PaymentStatusMap = {
  [K in PaymentStatus]: StatusConfig;
};

/**
 * Shipment status configurations
 */
export type ShipmentStatusMap = {
  [K in ShipmentStatus]: StatusConfig;
};

/**
 * Status tab configuration
 */
export interface StatusTab {
  id: string;
  label: string;
  filter: Record<string, any> | null;
  icon: string;
  badge?: 'urgent' | 'warning' | 'info';
  description?: string;
}

/**
 * Date filter preset
 */
export interface DateFilterPreset {
  id: string;
  label: string;
  days: number | null; // null for custom range
  getValue: () => { from: Date; to: Date } | null;
}
```

#### src/lib/utils/order.ts

```typescript
import { Decimal } from '@prisma/client/runtime/library';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

/**
 * Status badge return type
 */
export interface StatusBadgeConfig {
  label: string;
  color: string;
  icon: string;
  description?: string;
}

/**
 * Utility function signatures
 */
export function formatCurrency(amount: number | Decimal): string;
export function formatOrderDate(date: Date | string): string;
export function formatOrderDateTime(date: Date | string): string;
export function getStatusBadge(
  status: string,
  type: 'order' | 'payment' | 'shipment'
): StatusBadgeConfig;
export function getStatusColor(
  status: string,
  type: 'order' | 'payment' | 'shipment'
): string;
export function formatOrderNumber(orderNumber: string): string;
export function getOrderStatusLabel(status: OrderStatus): string;
export function getPaymentStatusLabel(status: PaymentStatus): string;
export function getShipmentStatusLabel(status: ShipmentStatus): string;
```

---

### Phase 2: Component Interfaces

#### OrderTable Component

```typescript
import { Order, OrderItem, User, Shipment } from '@prisma/client';

/**
 * Order with relations for table display
 */
export interface OrderTableData extends Order {
  user?: Pick<User, 'firstName' | 'lastName' | 'email'> | null;
  orderItems: Array<
    Pick<OrderItem, 'id' | 'quantity' | 'productName' | 'appliedPrice'>
  >;
  shipment?: Pick<Shipment, 'trackingNumber' | 'status'> | null;
}

/**
 * Table column definition
 */
export type OrderTableColumn =
  | 'orderNumber'
  | 'createdAt'
  | 'customer'
  | 'items'
  | 'total'
  | 'status'
  | 'paymentStatus';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Bulk action type
 */
export type BulkAction =
  | 'update-status'
  | 'export'
  | 'print-invoices'
  | 'mark-as-paid'
  | 'mark-as-shipped';

/**
 * OrderTable component props
 */
export interface OrderTableProps {
  orders: OrderTableData[];
  selectedOrderIds?: string[];
  onSelectOrder?: (orderId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onSort?: (column: OrderTableColumn, direction: SortDirection) => void;
  sortColumn?: OrderTableColumn;
  sortDirection?: SortDirection;
  isLoading?: boolean;
}
```

#### OrderFilters Component

```typescript
/**
 * Filter values
 */
export interface OrderFilterValues {
  search?: string;
  status?: string; // Tab ID or status value
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * OrderFilters component props
 */
export interface OrderFiltersProps {
  currentFilters: OrderFilterValues;
  onFilterChange: (filters: OrderFilterValues) => void;
  onExport?: () => void;
  isLoading?: boolean;
  orderCount?: number;
}
```

#### OrderStatusBadge Component

```typescript
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

/**
 * Badge size variants
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Status type
 */
export type StatusType = 'order' | 'payment' | 'shipment';

/**
 * OrderStatusBadge component props
 */
export interface OrderStatusBadgeProps {
  status: OrderStatus | PaymentStatus | ShipmentStatus | string;
  type: StatusType;
  size?: BadgeSize;
  showIcon?: boolean;
  className?: string;
}
```

#### ExportDialog Component

```typescript
/**
 * Export format
 */
export type ExportFormat = 'csv' | 'excel' | 'pdf';

/**
 * Export options
 */
export interface ExportOptions {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  format: ExportFormat;
  includeCustomerDetails: boolean;
  includeShippingAddress: boolean;
  includeItemsBreakdown: boolean;
}

/**
 * ExportDialog component props
 */
export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  currentFilters?: OrderFilterValues;
  isExporting?: boolean;
}
```

#### TrackingCard Component

```typescript
import { Shipment, ShipmentTracking } from '@prisma/client';

/**
 * Shipment with tracking events
 */
export interface ShipmentWithTracking extends Shipment {
  trackingEvents: ShipmentTracking[];
}

/**
 * TrackingCard component props
 */
export interface TrackingCardProps {
  shipment?: ShipmentWithTracking | null;
  onRefreshTracking?: () => Promise<void>;
  isRefreshing?: boolean;
  showFullHistory?: boolean;
}
```

#### OrderInlineActions Component

```typescript
import { OrderStatus, PaymentStatus } from '@prisma/client';

/**
 * Order data for inline actions
 */
export interface OrderActionData {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shipment?: {
    trackingNumber: string;
  } | null;
}

/**
 * Action handler return type
 */
export type ActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

/**
 * OrderInlineActions component props
 */
export interface OrderInlineActionsProps {
  order: OrderActionData;
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<ActionResult>;
  onFulfill: (orderId: string) => Promise<ActionResult>;
  isUpdating?: boolean;
  compact?: boolean; // For mobile view
}
```

---

### Phase 3 & 4: Page Interfaces

#### Main Order List Page

```typescript
/**
 * Search params type
 */
export interface OrdersPageSearchParams {
  page?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

/**
 * Page props
 */
export interface OrdersPageProps {
  searchParams: OrdersPageSearchParams;
}
```

#### Order Details Page

```typescript
import { Order, OrderItem, User, Address, Shipment, ShipmentTracking } from '@prisma/client';

/**
 * Complete order data with all relations
 */
export interface OrderDetailsData extends Order {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'isMember'> | null;
  orderItems: Array<
    OrderItem & {
      product: Pick<Product, 'id' | 'name' | 'slug' | 'sku'>;
    }
  >;
  shipment?: (Shipment & {
    trackingEvents: ShipmentTracking[];
  }) | null;
  shippingAddress: Address;
  billingAddress: Address;
}

/**
 * Page params
 */
export interface OrderDetailsPageParams {
  orderId: string;
}

/**
 * Page props
 */
export interface OrderDetailsPageProps {
  params: OrderDetailsPageParams;
}
```

---

## Complete Code Examples

### Example 1: OrderStatusBadge Component (Complete)

```typescript
// src/components/admin/orders/OrderStatusBadge.tsx
'use client';

import { ORDER_STATUSES, PAYMENT_STATUSES, SHIPMENT_STATUSES } from '@/lib/constants/order';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { OrderStatusBadgeProps, StatusType } from './types';

/**
 * Status badge component with icon and color coding
 */
export function OrderStatusBadge({
  status,
  type,
  size = 'md',
  showIcon = true,
  className,
}: OrderStatusBadgeProps) {
  // Get status configuration
  const statusMap = {
    order: ORDER_STATUSES,
    payment: PAYMENT_STATUSES,
    shipment: SHIPMENT_STATUSES,
  }[type];

  const config = statusMap[status as keyof typeof statusMap];

  if (!config) {
    return (
      <Badge variant="secondary" className={className}>
        {status}
      </Badge>
    );
  }

  // Get icon component dynamically
  const IconComponent = showIcon
    ? LucideIcons[config.icon as keyof typeof LucideIcons]
    : null;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  // Color classes
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-medium border',
        sizeClasses[size],
        colorClasses[config.color],
        className
      )}
      title={config.description}
    >
      {IconComponent && (
        <IconComponent className={cn('flex-shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}
```

---

### Example 2: Constants File (Complete)

```typescript
// src/lib/constants/order.ts
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  RefreshCw,
  AlertCircle,
  FileText,
  Calculator,
  CheckSquare,
  Tag,
  Calendar,
} from 'lucide-react';

/**
 * Order Status Configurations
 * Single source of truth for all order statuses
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
 * For main order list page filtering
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
```

---

### Example 3: Order Utils (Complete)

```typescript
// src/lib/utils/order.ts
import { Decimal } from '@prisma/client/runtime/library';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';
import { formatPrice } from '@/lib/utils/currency';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { ORDER_STATUSES, PAYMENT_STATUSES, SHIPMENT_STATUSES } from '@/lib/constants/order';

/**
 * Format currency using existing utility
 */
export function formatCurrency(amount: number | Decimal): string {
  return formatPrice(Number(amount));
}

/**
 * Format order date
 */
export function formatOrderDate(date: Date | string): string {
  return formatDate(date, { format: 'medium' });
}

/**
 * Format order date and time
 */
export function formatOrderDateTime(date: Date | string): string {
  return formatDateTime(date, {
    dateFormat: 'medium',
    timeFormat: 'short',
  });
}

/**
 * Get status badge configuration
 */
export function getStatusBadge(
  status: string,
  type: 'order' | 'payment' | 'shipment'
) {
  const statusMap = {
    order: ORDER_STATUSES,
    payment: PAYMENT_STATUSES,
    shipment: SHIPMENT_STATUSES,
  }[type];

  const config = statusMap[status as keyof typeof statusMap];

  return (
    config || {
      label: status,
      color: 'gray',
      icon: 'HelpCircle',
      description: 'Unknown status',
    }
  );
}

/**
 * Get Tailwind color classes for status
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
 */
export function formatOrderNumber(orderNumber: string): string {
  return orderNumber;
}

/**
 * Get human-readable label for order status
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUSES[status]?.label || status;
}

/**
 * Get human-readable label for payment status
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUSES[status]?.label || status;
}

/**
 * Get human-readable label for shipment status
 */
export function getShipmentStatusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUSES[status]?.label || status;
}

/**
 * Get customer display name
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
 */
export function getTotalItemsCount(orderItems: { quantity: number }[]): number {
  return orderItems.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Check if order can be fulfilled
 */
export function canFulfillOrder(order: {
  paymentStatus: PaymentStatus;
  shipment?: { id: string } | null;
}): boolean {
  return order.paymentStatus === 'PAID' && !order.shipment;
}

/**
 * Check if order has tracking
 */
export function hasTracking(order: {
  shipment?: { trackingNumber: string | null } | null;
}): boolean {
  return Boolean(order.shipment?.trackingNumber);
}
```

---

## API Specifications

### 1. Order List API

**Endpoint:** `GET /api/orders`

**Query Parameters:**
```typescript
{
  page?: number;          // Page number (default: 1)
  limit?: number;         // Items per page (default: 20, max: 100)
  status?: OrderStatus;   // Filter by order status
  search?: string;        // Search order#, customer name, email
  dateFrom?: string;      // ISO date string
  dateTo?: string;        // ISO date string
  sort?: string;          // Column to sort by
  direction?: 'asc' | 'desc';
}
```

**Response (Success 200):**
```json
{
  "orders": [
    {
      "id": "ord_clxyz123",
      "orderNumber": "ORD-20251009-ABCD",
      "userId": "user_123",
      "guestEmail": null,
      "status": "PAID",
      "paymentStatus": "PAID",
      "subtotal": 150.00,
      "taxAmount": 0.00,
      "shippingCost": 15.00,
      "discountAmount": 0.00,
      "total": 165.00,
      "createdAt": "2025-10-09T10:30:00.000Z",
      "updatedAt": "2025-10-09T10:35:00.000Z",
      "user": {
        "firstName": "John",
        "lastName": "Tan",
        "email": "john@example.com"
      },
      "orderItems": [
        {
          "id": "item_1",
          "quantity": 2,
          "productName": "Product A",
          "appliedPrice": 75.00
        }
      ],
      "shipment": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 47,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Response (Error 400):**
```json
{
  "message": "Invalid pagination parameters",
  "errors": {
    "page": "Page must be a positive integer",
    "limit": "Limit must be between 1 and 100"
  }
}
```

**Response (Error 401):**
```json
{
  "message": "Authentication required"
}
```

---

### 2. Order Status Update API

**Endpoint:** `PATCH /api/orders/[orderId]/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "PAID",
  "paymentStatus": "PAID",
  "triggeredBy": "admin",
  "metadata": {
    "adminId": "user_123",
    "reason": "Manual verification",
    "notes": "Payment confirmed via bank"
  }
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order": {
    "id": "ord_clxyz123",
    "orderNumber": "ORD-20251009-ABCD",
    "status": "PAID",
    "paymentStatus": "PAID",
    "updatedAt": "2025-10-09T11:00:00.000Z"
  }
}
```

**Response (Error 400):**
```json
{
  "error": "Invalid request data",
  "details": [
    {
      "path": ["status"],
      "message": "Invalid status value"
    }
  ]
}
```

**Response (Error 401):**
```json
{
  "error": "Unauthorized"
}
```

**Response (Error 404):**
```json
{
  "error": "Order not found"
}
```

---

### 3. Invoice Generation API

**Endpoint:** `GET /api/orders/[orderId]/invoice`

**Query Parameters:**
```
format=pdf          // 'html' or 'pdf' (default: html)
download=true       // Force download (default: false)
```

**Response (Success 200 - PDF):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Receipt_ORD-20251009-ABCD.pdf"

<binary PDF data>
```

**Response (Success 200 - HTML):**
```html
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html>
  <!-- Receipt HTML -->
</html>
```

**Response (Error 400):**
```json
{
  "message": "Receipt can only be generated for paid orders"
}
```

**Response (Error 404):**
```json
{
  "message": "Order not found or access denied"
}
```

---

### 4. Order Fulfillment API

**Endpoint:** `POST /api/admin/orders/[orderId]/fulfill`

**Request Body:**
```json
{
  "courierId": "pos-laju",
  "courierServiceId": "service_123",
  "pickupDate": "2025-10-10",
  "specialInstructions": "Handle with care"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Order fulfilled successfully",
  "shipment": {
    "id": "ship_123",
    "trackingNumber": "TRACK123456",
    "courierName": "Pos Laju",
    "labelUrl": "https://cdn.example.com/labels/ship_123.pdf",
    "pickupDate": "2025-10-10T00:00:00.000Z"
  }
}
```

**Response (Error 400):**
```json
{
  "error": "Order cannot be fulfilled",
  "message": "Order must be paid before fulfillment"
}
```

---

## UI Design System

### Color Palette

```css
/* Status Colors */
--status-gray: #9CA3AF;      /* gray-400 - Pending, Draft */
--status-green: #10B981;     /* green-500 - Paid, Delivered */
--status-blue: #3B82F6;      /* blue-500 - Processing, In Transit */
--status-purple: #8B5CF6;    /* purple-500 - Picked Up */
--status-indigo: #6366F1;    /* indigo-500 - Out for Delivery */
--status-yellow: #F59E0B;    /* yellow-500 - Awaiting Payment */
--status-red: #EF4444;       /* red-500 - Cancelled, Failed */
--status-orange: #F97316;    /* orange-500 - Refunded */

/* Background Colors */
--bg-gray-100: #F3F4F6;
--bg-green-100: #D1FAE5;
--bg-blue-100: #DBEAFE;
--bg-purple-100: #EDE9FE;
--bg-indigo-100: #E0E7FF;
--bg-yellow-100: #FEF3C7;
--bg-red-100: #FEE2E2;
--bg-orange-100: #FFEDD5;

/* Text Colors */
--text-gray-800: #1F2937;
--text-green-800: #065F46;
--text-blue-800: #1E40AF;
--text-purple-800: #5B21B6;
--text-indigo-800: #3730A3;
--text-yellow-800: #92400E;
--text-red-800: #991B1B;
--text-orange-800: #9A3412;
```

### Typography

```css
/* Font Sizes */
--text-xs: 0.75rem;      /* 12px - Small badges, helper text */
--text-sm: 0.875rem;     /* 14px - Table body, labels */
--text-base: 1rem;       /* 16px - Regular text */
--text-lg: 1.125rem;     /* 18px - Section headers */
--text-xl: 1.25rem;      /* 20px - Page titles */
--text-2xl: 1.5rem;      /* 24px - Main headings */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Spacing System

```css
/* Padding */
--p-1: 0.25rem;    /* 4px */
--p-2: 0.5rem;     /* 8px */
--p-3: 0.75rem;    /* 12px */
--p-4: 1rem;       /* 16px */
--p-6: 1.5rem;     /* 24px */
--p-8: 2rem;       /* 32px */

/* Margins */
--m-1: 0.25rem;
--m-2: 0.5rem;
--m-3: 0.75rem;
--m-4: 1rem;
--m-6: 1.5rem;
--m-8: 2rem;

/* Gap (for flexbox/grid) */
--gap-1: 0.25rem;
--gap-2: 0.5rem;
--gap-3: 0.75rem;
--gap-4: 1rem;
--gap-6: 1.5rem;
```

### Component Sizing

```css
/* Table Cells */
--table-cell-padding-x: 1rem;        /* px-4 */
--table-cell-padding-y: 0.75rem;     /* py-3 */

/* Cards */
--card-padding: 1.5rem;              /* p-6 */
--card-radius: 0.5rem;               /* rounded-lg */

/* Buttons */
--button-padding-sm: 0.5rem 0.75rem; /* px-3 py-2 */
--button-padding-md: 0.625rem 1rem;  /* px-4 py-2.5 */
--button-padding-lg: 0.75rem 1.5rem; /* px-6 py-3 */
--button-radius: 0.375rem;           /* rounded-md */

/* Badges */
--badge-padding-sm: 0.125rem 0.5rem; /* px-2 py-0.5 */
--badge-padding-md: 0.25rem 0.625rem;/* px-2.5 py-1 */
--badge-padding-lg: 0.375rem 0.75rem;/* px-3 py-1.5 */
--badge-radius: 9999px;              /* rounded-full */
```

### Shadow System

```css
/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

---

## Error Handling

### Error Types & Patterns

```typescript
/**
 * Network Error Handling
 */
try {
  const response = await fetch('/api/orders');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    // Network error (no internet, CORS, etc.)
    toast.error('Connection error. Please check your internet connection.');
  } else {
    // Other errors
    toast.error('Failed to load orders. Please try again.');
  }
  console.error('Orders fetch error:', error);
}

/**
 * Validation Error Handling
 */
try {
  const response = await fetch('/api/orders/123/status', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'INVALID' }),
  });

  if (response.status === 400) {
    const error = await response.json();
    if (error.details) {
      // Show field-specific errors
      error.details.forEach((detail: any) => {
        toast.error(`${detail.path.join('.')}: ${detail.message}`);
      });
    } else {
      toast.error(error.message || 'Invalid request');
    }
  }
} catch (error) {
  toast.error('Failed to update order status');
}

/**
 * Authorization Error Handling
 */
if (response.status === 401) {
  // Redirect to login
  toast.error('Your session has expired. Please login again.');
  router.push('/auth/login');
}

if (response.status === 403) {
  // Permission denied
  toast.error('You do not have permission to perform this action.');
}

/**
 * Server Error Handling
 */
if (response.status >= 500) {
  // Server error
  toast.error('Server error. Our team has been notified. Please try again later.');

  // Log to error tracking service (Sentry, etc.)
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(new Error(`API Error: ${response.status}`));
  }
}

/**
 * Not Found Error Handling
 */
if (response.status === 404) {
  // Resource not found
  toast.error('Order not found or has been deleted.');
  router.push('/admin/orders');
}
```

### Error Display Components

```typescript
/**
 * Error State Component
 */
interface ErrorStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 text-center mb-4">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Usage Example
 */
{error && (
  <ErrorState
    title="Failed to Load Orders"
    message="We couldn't load your orders. Please check your connection and try again."
    action={{
      label: 'Retry',
      onClick: () => refetch(),
    }}
  />
)}
```

---

## Loading & Empty States

### Loading States

```typescript
/**
 * Table Loading Skeleton
 */
export function OrderTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-4 w-4" /> {/* Checkbox */}
          <Skeleton className="h-4 w-32" /> {/* Order Number */}
          <Skeleton className="h-4 w-24" /> {/* Date */}
          <Skeleton className="h-4 w-40" /> {/* Customer */}
          <Skeleton className="h-4 w-16" /> {/* Items */}
          <Skeleton className="h-4 w-24" /> {/* Total */}
          <Skeleton className="h-6 w-20" /> {/* Status Badge */}
          <Skeleton className="h-6 w-20" /> {/* Payment Badge */}
          <Skeleton className="h-8 w-32" /> {/* Actions */}
        </div>
      ))}
    </div>
  );
}

/**
 * Button Loading State
 */
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Updating...' : 'Update Status'}
</Button>

/**
 * Page Loading State
 */
export function OrdersPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table Skeleton */}
      <OrderTableSkeleton />
    </div>
  );
}
```

### Empty States

```typescript
/**
 * No Orders Empty State
 */
<EmptyState
  icon={Package}
  title="No orders yet"
  description="Orders will appear here once customers make purchases."
  action={{
    label: 'View Products',
    onClick: () => router.push('/admin/products'),
  }}
/>

/**
 * No Search Results Empty State
 */
<EmptyState
  icon={Search}
  title="No orders found"
  description={`No orders match "${searchQuery}". Try adjusting your search criteria.`}
  action={{
    label: 'Clear Search',
    onClick: () => clearFilters(),
  }}
/>

/**
 * No Results for Filter Empty State
 */
<EmptyState
  icon={Filter}
  title="No orders match this filter"
  description="Try selecting a different status or date range."
  action={{
    label: 'Clear Filters',
    onClick: () => clearFilters(),
  }}
/>

/**
 * Generic Empty State Component
 */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

---

## Responsive Design

### Breakpoints

```typescript
/**
 * Tailwind Breakpoints
 */
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
};

/**
 * Order Management Breakpoints
 */
// Mobile: < 640px
//   - Stack columns vertically
//   - Show: Order#, Customer, Total, Status
//   - Hide: Items, Date, Payment Status
//   - Actions in dropdown menu

// Tablet: 640px - 1024px
//   - Show: Order#, Date, Customer, Total, Status
//   - Hide: Items count, Payment status
//   - Actions: Compact buttons

// Desktop: > 1024px
//   - Show all columns
//   - Full inline actions
//   - 3-column order details layout
```

### Responsive Table Example

```typescript
/**
 * Responsive Order Table
 */
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead>
      <tr>
        {/* Checkbox - Always visible */}
        <th className="w-12 px-4 py-3">
          <Checkbox />
        </th>

        {/* Order# - Always visible */}
        <th className="px-4 py-3 text-left">
          Order #
        </th>

        {/* Date - Hidden on mobile */}
        <th className="hidden md:table-cell px-4 py-3 text-left">
          Date
        </th>

        {/* Customer - Always visible */}
        <th className="px-4 py-3 text-left">
          Customer
        </th>

        {/* Items - Hidden on mobile and tablet */}
        <th className="hidden lg:table-cell px-4 py-3 text-center">
          Items
        </th>

        {/* Total - Always visible */}
        <th className="px-4 py-3 text-right">
          Total
        </th>

        {/* Status - Always visible */}
        <th className="px-4 py-3 text-left">
          Status
        </th>

        {/* Payment - Hidden on mobile */}
        <th className="hidden md:table-cell px-4 py-3 text-left">
          Payment
        </th>

        {/* Actions - Always visible */}
        <th className="px-4 py-3 text-right">
          Actions
        </th>
      </tr>
    </thead>
    <tbody>
      {/* Table rows */}
    </tbody>
  </table>
</div>

/**
 * Mobile Card View (Alternative to Table)
 */
<div className="sm:hidden space-y-4">
  {orders.map((order) => (
    <Card key={order.id} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-sm">{order.orderNumber}</p>
          <p className="text-xs text-gray-600">
            {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} type="order" size="sm" />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Customer</span>
          <span className="font-medium">{getCustomerName(order)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total</span>
          <span className="font-semibold">{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          View
        </Button>
        <Button size="sm" variant="outline">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  ))}
</div>
```

### Responsive Order Details Layout

```typescript
/**
 * Order Details Page - Responsive Grid
 */
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Left Column: Order Details (2/3 width on desktop) */}
  <div className="lg:col-span-2 space-y-6">
    {/* Order items, customer info, addresses */}
  </div>

  {/* Right Sidebar: Actions & Status (1/3 width on desktop) */}
  <div className="space-y-6">
    {/* Status card, quick actions, tracking */}
  </div>
</div>

/**
 * On Mobile: Stack vertically
 * On Tablet: Stack vertically
 * On Desktop (lg+): 2-column grid (2/3 + 1/3)
 */
```

---

## Summary

This technical specification provides:

✅ **Complete TypeScript interfaces** for all components and pages
✅ **Full code examples** for constants, utilities, and 1 complete component
✅ **Exact API request/response formats** with error cases
✅ **UI design system** with colors, typography, spacing
✅ **Error handling patterns** for all scenarios
✅ **Loading & empty states** specifications
✅ **Responsive design** breakpoints and examples

**Next Documents:**
- `ORDER_MANAGEMENT_QA_SPEC.md` - Testing requirements
- `ORDER_MANAGEMENT_DEV_GUIDE.md` - Development workflow

---

**Document Version:** 1.0
**Last Updated:** 2025-10-09
**Status:** Complete ✅
