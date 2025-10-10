import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Decimal } from '@prisma/client/runtime/library';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

import {
  formatCurrency,
  formatOrderDate,
  formatOrderDateTime,
  getStatusBadge,
  getStatusColor,
  formatOrderNumber,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getShipmentStatusLabel,
  getCustomerName,
  getTotalItemsCount,
  canFulfillOrder,
  hasTracking,
} from '../order';

describe('Order Utils', () => {
  describe('formatCurrency', () => {
    it('should format number amounts', () => {
      expect(formatCurrency(150.5)).toContain('RM');
      expect(formatCurrency(150.5)).toContain('150.50');
      expect(formatCurrency(0)).toContain('0.00');
      expect(formatCurrency(1000)).toContain('1,000.00');
    });

    it('should format Decimal amounts', () => {
      const decimal = new Decimal('150.50');
      const result = formatCurrency(decimal);
      expect(result).toContain('RM');
      expect(result).toContain('150.50');
    });
  });

  describe('formatOrderDate', () => {
    it('should format date objects', () => {
      const date = new Date('2025-10-09T10:30:00Z');
      const result = formatOrderDate(date);
      expect(result).toMatch(
        /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/
      );
    });

    it('should format ISO date strings', () => {
      const result = formatOrderDate('2025-10-09T10:30:00Z');
      expect(result).toMatch(
        /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/
      );
    });
  });

  describe('formatOrderDateTime', () => {
    it('should format date objects with time', () => {
      const date = new Date('2025-10-09T10:30:00Z');
      const result = formatOrderDateTime(date);
      // Should contain date and time components
      expect(result).toMatch(
        /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/
      );
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should format ISO date strings with time', () => {
      const result = formatOrderDateTime('2025-10-09T10:30:00Z');
      expect(result).toMatch(
        /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/
      );
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('getStatusBadge', () => {
    it('should return correct config for order statuses', () => {
      const paidBadge = getStatusBadge('PAID', 'order');
      expect(paidBadge.label).toBe('Paid');
      expect(paidBadge.color).toBe('green');
      expect(paidBadge.icon).toBe('CheckCircle');
    });

    it('should return correct config for payment statuses', () => {
      const pendingBadge = getStatusBadge('PENDING', 'payment');
      expect(pendingBadge.label).toBe('Awaiting Payment');
      expect(pendingBadge.color).toBe('yellow');
    });

    it('should return correct config for shipment statuses', () => {
      const inTransitBadge = getStatusBadge('IN_TRANSIT', 'shipment');
      expect(inTransitBadge.label).toBe('In Transit');
      expect(inTransitBadge.color).toBe('blue');
    });

    it('should return default config for unknown statuses', () => {
      const unknownBadge = getStatusBadge('UNKNOWN', 'order');
      expect(unknownBadge.label).toBe('UNKNOWN');
      expect(unknownBadge.color).toBe('gray');
      expect(unknownBadge.icon).toBe('HelpCircle');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct Tailwind classes for statuses', () => {
      const greenClasses = getStatusColor('PAID', 'order');
      expect(greenClasses).toContain('bg-green-100');
      expect(greenClasses).toContain('text-green-800');

      const yellowClasses = getStatusColor('PENDING', 'payment');
      expect(yellowClasses).toContain('bg-yellow-100');
      expect(yellowClasses).toContain('text-yellow-800');
    });

    it('should return gray classes for unknown statuses', () => {
      const unknownClasses = getStatusColor('UNKNOWN', 'order');
      expect(unknownClasses).toContain('bg-gray-100');
      expect(unknownClasses).toContain('text-gray-800');
    });
  });

  describe('formatOrderNumber', () => {
    it('should return order number as-is', () => {
      expect(formatOrderNumber('ORD-20251009-ABCD')).toBe('ORD-20251009-ABCD');
      expect(formatOrderNumber('123')).toBe('123');
    });
  });

  describe('Status Label Functions', () => {
    it('should return correct label for order statuses', () => {
      expect(getOrderStatusLabel('PAID' as OrderStatus)).toBe('Paid');
      expect(getOrderStatusLabel('DELIVERED' as OrderStatus)).toBe('Delivered');
    });

    it('should return correct label for payment statuses', () => {
      expect(getPaymentStatusLabel('PENDING' as PaymentStatus)).toBe(
        'Awaiting Payment'
      );
      expect(getPaymentStatusLabel('PAID' as PaymentStatus)).toBe('Paid');
    });

    it('should return correct label for shipment statuses', () => {
      expect(getShipmentStatusLabel('IN_TRANSIT' as ShipmentStatus)).toBe(
        'In Transit'
      );
      expect(getShipmentStatusLabel('DELIVERED' as ShipmentStatus)).toBe(
        'Delivered'
      );
    });
  });

  describe('getCustomerName', () => {
    it('should return full name for registered users', () => {
      const order = {
        user: { firstName: 'John', lastName: 'Tan' },
      };
      expect(getCustomerName(order)).toBe('John Tan');
    });

    it('should return guest label for guest orders', () => {
      const order = {
        user: null,
        guestEmail: 'guest@example.com',
      };
      expect(getCustomerName(order)).toBe('Guest (guest@example.com)');
    });

    it('should return "Unknown Customer" when no user or email', () => {
      const order = {
        user: null,
        guestEmail: null,
      };
      expect(getCustomerName(order)).toBe('Unknown Customer');
    });

    it('should prioritize user over guestEmail', () => {
      const order = {
        user: { firstName: 'John', lastName: 'Tan' },
        guestEmail: 'guest@example.com',
      };
      expect(getCustomerName(order)).toBe('John Tan');
    });
  });

  describe('getTotalItemsCount', () => {
    it('should sum all item quantities', () => {
      const items = [{ quantity: 2 }, { quantity: 3 }, { quantity: 1 }];
      expect(getTotalItemsCount(items)).toBe(6);
    });

    it('should return 0 for empty array', () => {
      expect(getTotalItemsCount([])).toBe(0);
    });

    it('should handle single item', () => {
      expect(getTotalItemsCount([{ quantity: 5 }])).toBe(5);
    });
  });

  describe('canFulfillOrder', () => {
    it('should return true for paid orders without shipment', () => {
      const order = {
        paymentStatus: 'PAID' as PaymentStatus,
        shipment: null,
      };
      expect(canFulfillOrder(order)).toBe(true);
    });

    it('should return false for unpaid orders', () => {
      const order = {
        paymentStatus: 'PENDING' as PaymentStatus,
        shipment: null,
      };
      expect(canFulfillOrder(order)).toBe(false);
    });

    it('should return false for orders with existing shipment', () => {
      const order = {
        paymentStatus: 'PAID' as PaymentStatus,
        shipment: { id: 'ship_123' },
      };
      expect(canFulfillOrder(order)).toBe(false);
    });

    it('should return false for unpaid orders with shipment', () => {
      const order = {
        paymentStatus: 'PENDING' as PaymentStatus,
        shipment: { id: 'ship_123' },
      };
      expect(canFulfillOrder(order)).toBe(false);
    });
  });

  describe('hasTracking', () => {
    it('should return true when shipment has tracking number', () => {
      const order = {
        shipment: { trackingNumber: 'TRACK123' },
      };
      expect(hasTracking(order)).toBe(true);
    });

    it('should return false when shipment has no tracking number', () => {
      const order = {
        shipment: { trackingNumber: null },
      };
      expect(hasTracking(order)).toBe(false);
    });

    it('should return false when no shipment exists', () => {
      const order = {
        shipment: null,
      };
      expect(hasTracking(order)).toBe(false);
    });

    it('should return false when shipment is undefined', () => {
      const order = {};
      expect(hasTracking(order)).toBe(false);
    });
  });
});
