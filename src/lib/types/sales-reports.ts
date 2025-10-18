/**
 * Sales Reports Type Definitions
 * Centralized type system for sales analytics
 */

export interface SalesOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  memberRevenue: number;
  nonMemberRevenue: number;
  taxCollected: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
  profitMargin: number;
  memberSales: number;
  nonMemberSales: number;
}

export interface CustomerInsight {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  memberConversionRate: number;
  avgCustomerLifetimeValue: number;
  topStates: StateAnalytics[];
}

export interface StateAnalytics {
  state: string;
  stateName: string;
  totalOrders: number;
  totalRevenue: number;
}

export interface RevenueAnalytics {
  daily: RevenuePoint[];
  weekly: RevenuePoint[];
  monthly: RevenuePoint[];
  paymentMethods: PaymentMethodAnalytics[];
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
  memberRevenue: number;
  nonMemberRevenue: number;
}

export interface PaymentMethodAnalytics {
  method: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  reportType: 'overview' | 'revenue' | 'products' | 'customers';
  startDate: Date;
  endDate: Date;
}

// Malaysian States Mapping (centralized)
export const MALAYSIAN_STATES = {
  JHR: 'Johor',
  KDH: 'Kedah',
  KTN: 'Kelantan',
  MLK: 'Malacca',
  NSN: 'Negeri Sembilan',
  PHG: 'Pahang',
  PNG: 'Penang',
  PRK: 'Perak',
  PLS: 'Perlis',
  SEL: 'Selangor',
  TRG: 'Terengganu',
  SBH: 'Sabah',
  SWK: 'Sarawak',
  KUL: 'Kuala Lumpur',
  LBN: 'Labuan',
  PJY: 'Putrajaya',
} as const;

export type MalaysianStateCode = keyof typeof MALAYSIAN_STATES;
