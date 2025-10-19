/**
 * Admin Navigation Constants
 * Single source of truth for admin section navigation
 * Following CLAUDE.md: DRY principle - no duplication
 */

import { TabConfig } from '@/components/admin/layout';

/**
 * Customer & Membership section tabs
 * Used across: /admin/customers, /admin/membership
 */
export const CUSTOMER_MEMBERSHIP_TABS: TabConfig[] = [
  {
    id: 'customers',
    label: 'Customers',
    href: '/admin/customers',
  },
  {
    id: 'membership',
    label: 'Membership',
    href: '/admin/membership',
  },
];

/**
 * Helper to get active tab from current pathname
 */
export function getActiveTab(pathname: string): string {
  if (pathname.startsWith('/admin/membership')) {
    return 'membership';
  }
  if (pathname.startsWith('/admin/customers')) {
    return 'customers';
  }
  return '';
}
