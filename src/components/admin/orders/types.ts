import {
  Order,
  OrderItem,
  User,
  Shipment,
  ShipmentTracking,
} from '@prisma/client';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

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
  onStatusUpdate: (
    orderId: string,
    status: OrderStatus
  ) => Promise<ActionResult>;
  onFulfill: (orderId: string) => Promise<ActionResult>;
  isUpdating?: boolean;
  compact?: boolean; // For mobile view
}

/**
 * Order details data returned from API
 */
export interface OrderDetailsData {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  memberDiscount: number;
  paymentMethod: string | null;
  paymentId: string | null;
  trackingNumber: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;

  // AWB (Airway Bill) Information
  airwayBillGenerated: boolean;
  airwayBillGeneratedAt: string | null;
  airwayBillNumber: string | null;
  airwayBillUrl: string | null;
  trackingUrl: string | null;

  // EasyParcel Fields
  easyparcelOrderNumber: string | null;
  easyparcelPaymentStatus: string | null;
  easyparcelParcelNumber: string | null;
  shippingCostCharged: number | null;

  // Courier/shipping information
  selectedCourierServiceId: string | null;
  courierName: string | null;
  courierServiceType: string | null;
  courierServiceDetail: string | null;
  selectedDropoffPointId: string | null;
  estimatedDelivery: string | null;
  shippingWeight: number | null;
  scheduledPickupDate: string | null;

  // Relations
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    isMember: boolean;
    memberSince: string | null;
  } | null;
  guestEmail: string | null;
  orderItems: Array<{
    id: string;
    productId: string;
    quantity: number;
    regularPrice: number;
    memberPrice: number;
    appliedPrice: number;
    totalPrice: number;
    productName: string;
    productSku: string | null;
    product: {
      id: string;
      name: string;
      sku: string | null;
      images: Array<{
        url: string;
        altText: string | null;
      }>;
    } | null;
  }>;
  shippingAddress: {
    id: string;
    recipientName: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber: string | null;
    phone: string | null;
  } | null;
  billingAddress: {
    id: string;
    recipientName: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber: string | null;
    phone: string | null;
  } | null;
  shipment: {
    id: string;
    trackingNumber: string;
    status: ShipmentStatus;
    courierName: string;
    serviceName: string;
    estimatedDelivery: string | null;
    actualDelivery: string | null;
    trackingEvents: Array<{
      eventName: string;
      description: string | null;
      timestamp: string;
      location: string | null;
    }>;
  } | null;
}
