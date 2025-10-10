import { describe, it, expect } from '@jest/globals';
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SHIPMENT_STATUSES,
  ORDER_STATUS_TABS,
  ORDER_DATE_FILTERS,
} from '../order';

describe('Order Constants', () => {
  describe('ORDER_STATUSES', () => {
    it('should have all required order statuses', () => {
      const requiredStatuses = [
        'PENDING',
        'PAID',
        'READY_TO_SHIP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'REFUNDED',
      ];

      requiredStatuses.forEach(status => {
        expect(ORDER_STATUSES).toHaveProperty(status);
      });
    });

    it('should have complete configuration for each status', () => {
      Object.values(ORDER_STATUSES).forEach(status => {
        expect(status).toHaveProperty('value');
        expect(status).toHaveProperty('label');
        expect(status).toHaveProperty('color');
        expect(status).toHaveProperty('icon');
        expect(status).toHaveProperty('description');
        expect(typeof status.label).toBe('string');
        expect(typeof status.icon).toBe('string');
        expect(typeof status.description).toBe('string');
      });
    });

    it('should use valid colors', () => {
      const validColors = [
        'gray',
        'green',
        'blue',
        'purple',
        'indigo',
        'yellow',
        'red',
        'orange',
      ];

      Object.values(ORDER_STATUSES).forEach(status => {
        expect(validColors).toContain(status.color);
      });
    });
  });

  describe('PAYMENT_STATUSES', () => {
    it('should have all required payment statuses', () => {
      const requiredStatuses = [
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED',
        'PARTIALLY_REFUNDED',
      ];

      requiredStatuses.forEach(status => {
        expect(PAYMENT_STATUSES).toHaveProperty(status);
      });
    });

    it('should have complete configuration for each status', () => {
      Object.values(PAYMENT_STATUSES).forEach(status => {
        expect(status).toHaveProperty('value');
        expect(status).toHaveProperty('label');
        expect(status).toHaveProperty('color');
        expect(status).toHaveProperty('icon');
        expect(status).toHaveProperty('description');
      });
    });
  });

  describe('SHIPMENT_STATUSES', () => {
    it('should have all required shipment statuses', () => {
      const requiredStatuses = [
        'DRAFT',
        'RATE_CALCULATED',
        'BOOKED',
        'LABEL_GENERATED',
        'PICKUP_SCHEDULED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'FAILED',
        'CANCELLED',
      ];

      requiredStatuses.forEach(status => {
        expect(SHIPMENT_STATUSES).toHaveProperty(status);
      });
    });

    it('should have complete configuration for each status', () => {
      Object.values(SHIPMENT_STATUSES).forEach(status => {
        expect(status).toHaveProperty('value');
        expect(status).toHaveProperty('label');
        expect(status).toHaveProperty('color');
        expect(status).toHaveProperty('icon');
        expect(status).toHaveProperty('description');
      });
    });
  });

  describe('ORDER_STATUS_TABS', () => {
    it('should have 6 tabs', () => {
      expect(ORDER_STATUS_TABS).toHaveLength(6);
    });

    it('should have required tabs', () => {
      const tabIds = ORDER_STATUS_TABS.map(tab => tab.id);
      expect(tabIds).toContain('all');
      expect(tabIds).toContain('awaiting-payment');
      expect(tabIds).toContain('processing');
      expect(tabIds).toContain('shipped');
      expect(tabIds).toContain('delivered');
      expect(tabIds).toContain('cancelled');
    });

    it('should have complete configuration for each tab', () => {
      ORDER_STATUS_TABS.forEach(tab => {
        expect(tab).toHaveProperty('id');
        expect(tab).toHaveProperty('label');
        expect(tab).toHaveProperty('filter');
        expect(tab).toHaveProperty('icon');
        expect(tab).toHaveProperty('description');
        expect(typeof tab.id).toBe('string');
        expect(typeof tab.label).toBe('string');
        expect(typeof tab.icon).toBe('string');
        expect(typeof tab.description).toBe('string');
      });
    });

    it('should have null filter for "all" tab', () => {
      const allTab = ORDER_STATUS_TABS.find(tab => tab.id === 'all');
      expect(allTab?.filter).toBeNull();
    });

    it('should have filter objects for other tabs', () => {
      const otherTabs = ORDER_STATUS_TABS.filter(tab => tab.id !== 'all');
      otherTabs.forEach(tab => {
        expect(tab.filter).toBeTruthy();
        expect(typeof tab.filter).toBe('object');
      });
    });
  });

  describe('ORDER_DATE_FILTERS', () => {
    it('should have 5 filter presets', () => {
      expect(ORDER_DATE_FILTERS).toHaveLength(5);
    });

    it('should have required filter presets', () => {
      const filterIds = ORDER_DATE_FILTERS.map(filter => filter.id);
      expect(filterIds).toContain('today');
      expect(filterIds).toContain('last-7-days');
      expect(filterIds).toContain('last-30-days');
      expect(filterIds).toContain('last-90-days');
      expect(filterIds).toContain('custom');
    });

    it('should have complete configuration for each filter', () => {
      ORDER_DATE_FILTERS.forEach(filter => {
        expect(filter).toHaveProperty('id');
        expect(filter).toHaveProperty('label');
        expect(filter).toHaveProperty('days');
        expect(filter).toHaveProperty('getValue');
        expect(typeof filter.id).toBe('string');
        expect(typeof filter.label).toBe('string');
        expect(typeof filter.getValue).toBe('function');
      });
    });

    it('should return valid date ranges for non-custom filters', () => {
      const nonCustomFilters = ORDER_DATE_FILTERS.filter(
        f => f.id !== 'custom'
      );

      nonCustomFilters.forEach(filter => {
        const dateRange = filter.getValue();
        expect(dateRange).toBeTruthy();
        expect(dateRange).toHaveProperty('from');
        expect(dateRange).toHaveProperty('to');
        expect(dateRange!.from).toBeInstanceOf(Date);
        expect(dateRange!.to).toBeInstanceOf(Date);
      });
    });

    it('should return null for custom filter', () => {
      const customFilter = ORDER_DATE_FILTERS.find(f => f.id === 'custom');
      expect(customFilter?.getValue()).toBeNull();
    });

    it('should calculate correct date ranges', () => {
      const todayFilter = ORDER_DATE_FILTERS.find(f => f.id === 'today');
      const last7DaysFilter = ORDER_DATE_FILTERS.find(
        f => f.id === 'last-7-days'
      );

      const todayRange = todayFilter!.getValue();
      const last7DaysRange = last7DaysFilter!.getValue();

      // Today filter should have from date at start of day
      expect(todayRange!.from.getHours()).toBe(0);
      expect(todayRange!.from.getMinutes()).toBe(0);

      // Last 7 days should have 7 day difference
      const daysDiff = Math.floor(
        (last7DaysRange!.to.getTime() - last7DaysRange!.from.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(7);
    });
  });
});
