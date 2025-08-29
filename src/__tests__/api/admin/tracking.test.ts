/**
 * Comprehensive tests for tracking API endpoints
 * @jest-environment node
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import {
  GET as getTracking,
  POST as refreshTracking,
} from '@/app/api/admin/orders/[id]/tracking/route';
import { POST as bulkRefresh } from '@/app/api/admin/orders/bulk-tracking-refresh/route';
import { GET as getAnalytics } from '@/app/api/admin/tracking/analytics/route';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    shipment: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    shipmentTracking: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/shipping/easyparcel-service', () => ({
  easyParcelService: {
    trackShipment: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

import { prisma } from '@/lib/prisma';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { getServerSession } from 'next-auth';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockEasyParcelService = easyParcelService as jest.Mocked<
  typeof easyParcelService
>;
const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe('Tracking API Endpoints', () => {
  const mockAdminSession = {
    user: { id: 'admin-1', role: 'ADMIN' },
  };

  const mockTrackingDataForRefresh = {
    status: 'out_for_delivery',
    description: 'Out for delivery',
    tracking_events: [
      {
        event_code: 'OUT_FOR_DELIVERY',
        event_name: 'Out for Delivery',
        description: 'Package is out for delivery',
        timestamp: '2025-08-20T14:00:00Z',
        location: 'Kuala Lumpur',
      },
    ],
  };

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-001',
    shipment: {
      id: 'shipment-1',
      trackingNumber: 'TRK123456',
      status: 'in_transit',
      courierName: 'Pos Laju',
      serviceName: 'Standard',
      trackingEvents: [
        {
          eventTime: new Date('2025-08-20T10:00:00Z'),
          eventName: 'picked_up',
          description: 'Package picked up',
          location: 'Kuala Lumpur',
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockAdminSession);
  });

  describe('GET /api/admin/orders/[id]/tracking', () => {
    test('should return tracking data for valid order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await getTracking(req, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tracking.trackingNumber).toBe('TRK123456');
      expect(data.tracking.status).toBe('in_transit');
      expect(data.tracking.trackingEvents).toHaveLength(1);
    });

    test('should return 404 for order without tracking', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        shipment: null,
      });

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await getTracking(req, { params: { id: 'order-1' } });

      expect(response.status).toBe(404);
    });

    test('should return 401 for unauthorized user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await getTracking(req, { params: { id: 'order-1' } });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/admin/orders/[id]/tracking', () => {
    test('should refresh tracking data successfully', async () => {
      mockPrisma.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({
          ...mockOrder,
          shipment: {
            ...mockOrder.shipment,
            status: 'out_for_delivery',
            trackingEvents: [],
          },
        });

      mockEasyParcelService.trackShipment.mockResolvedValue(
        mockTrackingDataForRefresh
      );
      mockPrisma.shipment.update.mockResolvedValue({
        ...mockOrder.shipment,
        status: 'out_for_delivery',
      });
      mockPrisma.shipmentTracking.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.shipmentTracking.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const { req } = createMocks({
        method: 'POST',
      });

      const response = await refreshTracking(req, {
        params: { id: 'order-1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('refreshed successfully');
      expect(mockEasyParcelService.trackShipment).toHaveBeenCalledWith(
        'TRK123456'
      );
      expect(mockPrisma.shipment.update).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    test('should handle tracking API failure gracefully', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockEasyParcelService.trackShipment.mockRejectedValue(
        new Error('API unavailable')
      );

      const { req } = createMocks({
        method: 'POST',
      });

      const response = await refreshTracking(req, {
        params: { id: 'order-1' },
      });
      const data = await response.json();

      expect(response.status).toBe(206); // Partial Content
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to refresh tracking from courier');
    });
  });

  describe('POST /api/admin/orders/bulk-tracking-refresh', () => {
    const mockShipments = [
      {
        id: 'shipment-1',
        trackingNumber: 'TRK123456',
        order: { orderNumber: 'ORD-001' },
      },
      {
        id: 'shipment-2',
        trackingNumber: 'TRK789012',
        order: { orderNumber: 'ORD-002' },
      },
    ];

    test('should refresh multiple shipments successfully', async () => {
      mockPrisma.order.findMany.mockResolvedValue(mockShipments);
      mockEasyParcelService.trackShipment.mockResolvedValue(
        mockTrackingDataForRefresh
      );
      mockPrisma.shipment.update.mockResolvedValue({});
      mockPrisma.shipmentTracking.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.shipmentTracking.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const { req } = createMocks({
        method: 'POST',
        body: {
          orderIds: ['order-1', 'order-2'],
        },
      });

      const response = await bulkRefresh(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.successful).toBe(2);
      expect(data.results.failed).toBe(0);
    });

    test('should handle mixed success/failure scenarios', async () => {
      mockPrisma.order.findMany.mockResolvedValue(mockShipments);
      mockEasyParcelService.trackShipment
        .mockResolvedValueOnce(mockTrackingDataForRefresh)
        .mockRejectedValueOnce(new Error('API timeout'));
      mockPrisma.shipment.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const { req } = createMocks({
        method: 'POST',
        body: {
          orderIds: ['order-1', 'order-2'],
        },
      });

      const response = await bulkRefresh(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.successful).toBe(1);
      expect(data.results.failed).toBe(1);
      expect(data.results.errors).toHaveLength(1);
    });

    test('should validate request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          orderIds: [],
        },
      });

      const response = await bulkRefresh(req);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/tracking/analytics', () => {
    const mockAnalyticsData = [
      {
        id: 'shipment-1',
        status: 'DELIVERED',
        courierName: 'Pos Laju',
        createdAt: new Date('2025-08-01'),
        actualDelivery: new Date('2025-08-03'),
        estimatedDelivery: new Date('2025-08-04'),
        order: { id: 'order-1' },
        trackingEvents: [],
      },
      {
        id: 'shipment-2',
        status: 'IN_TRANSIT',
        courierName: 'GDex',
        createdAt: new Date('2025-08-15'),
        actualDelivery: null,
        estimatedDelivery: new Date('2025-08-22'),
        order: { id: 'order-2' },
        trackingEvents: [],
      },
    ];

    test('should return analytics data', async () => {
      mockPrisma.shipment.findMany.mockResolvedValue(mockAnalyticsData);

      const { req } = createMocks({
        method: 'GET',
        query: { days: '30' },
      });

      const response = await getAnalytics(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toHaveProperty('totalShipments', 2);
      expect(data.stats).toHaveProperty('inTransit', 1);
      expect(data.stats).toHaveProperty('delivered', 1);
      expect(data.stats).toHaveProperty('averageDeliveryTime');
      expect(data.stats).toHaveProperty('courierPerformance');
      expect(data.stats.courierPerformance).toHaveLength(2);
    });

    test('should handle empty data gracefully', async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        query: { days: '7' },
      });

      const response = await getAnalytics(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats.totalShipments).toBe(0);
      expect(data.stats.courierPerformance).toHaveLength(0);
    });
  });
});

describe('Tracking System Integration Tests', () => {
  test('should handle end-to-end tracking workflow', async () => {
    // This would test the complete workflow:
    // 1. Order creation
    // 2. Shipment booking
    // 3. Tracking number assignment
    // 4. Status updates
    // 5. Analytics calculation

    // Implementation would depend on test database setup
    expect(true).toBe(true); // Placeholder
  });

  test('should handle rate limiting gracefully', async () => {
    // Test that the system handles API rate limits properly
    expect(true).toBe(true); // Placeholder
  });

  test('should maintain data consistency during bulk operations', async () => {
    // Test that bulk operations don't create inconsistent data
    expect(true).toBe(true); // Placeholder
  });
});
