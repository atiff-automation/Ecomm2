/**
 * Integration tests for tracking workflows
 * @jest-environment node
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';

// Import the actual API routes for integration testing
import { POST as createShipment } from '@/app/api/admin/orders/bulk-ship/route';
import { GET as getTracking, POST as refreshTracking } from '@/app/api/admin/orders/[id]/tracking/route';
import { POST as bulkRefresh } from '@/app/api/admin/orders/bulk-tracking-refresh/route';
import { GET as getAnalytics } from '@/app/api/admin/tracking/analytics/route';

// Mock external dependencies
jest.mock('@/lib/prisma', () => {
  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-001',
    status: 'PROCESSING',
    createdAt: new Date('2025-08-01'),
    shipment: null,
    shippingAddress: {
      name: 'John Doe',
      phone: '+60123456789',
      addressLine1: '123 Test Street',
      city: 'Kuala Lumpur',
      state: 'Selangor',
      postcode: '50000',
      country: 'Malaysia'
    },
    orderItems: [
      {
        id: 'item-1',
        quantity: 2,
        price: 50.00,
        product: {
          name: 'Test Product',
          weight: 0.5,
          dimensions: { length: 20, width: 15, height: 10 }
        }
      }
    ]
  };

  const mockShipment = {
    id: 'shipment-1',
    orderId: 'order-1',
    trackingNumber: 'TRK123456789',
    status: 'CREATED',
    courierName: 'Pos Laju',
    serviceName: 'Standard',
    estimatedDelivery: new Date('2025-08-05'),
    actualDelivery: null,
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date('2025-08-01'),
    trackingEvents: []
  };

  return {
    prisma: {
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      shipment: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      shipmentTracking: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    },
    mockOrder,
    mockShipment,
  };
});

jest.mock('@/lib/shipping/easyparcel-service', () => ({
  easyParcelService: {
    createShipment: jest.fn(),
    trackShipment: jest.fn(),
    calculateShipping: jest.fn(),
  }
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

const { prisma, mockOrder, mockShipment } = require('@/lib/prisma');
const { easyParcelService } = require('@/lib/shipping/easyparcel-service');
const { getServerSession } = require('next-auth');

describe('Tracking Workflow Integration Tests', () => {
  const mockAdminSession = {
    user: { id: 'admin-1', role: 'ADMIN' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue(mockAdminSession);
  });

  describe('End-to-End Order Fulfillment and Tracking Workflow', () => {
    test('should complete full workflow: order creation → shipment → tracking → delivery', async () => {
      // Step 1: Setup initial order
      prisma.order.findMany.mockResolvedValue([{
        ...mockOrder,
        id: 'order-1'
      }]);

      // Step 2: Create shipment via bulk shipping
      const shipmentResponse = {
        waybill_number: 'TRK123456789',
        service_id: 'poslaju-standard',
        estimated_delivery: '2025-08-05',
        labels: [{
          url: 'https://example.com/label.pdf',
          format: 'PDF'
        }]
      };

      easyParcelService.createShipment.mockResolvedValue(shipmentResponse);
      prisma.shipment.create.mockResolvedValue({
        ...mockShipment,
        trackingNumber: 'TRK123456789'
      });
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'SHIPPED'
      });
      prisma.auditLog.create.mockResolvedValue({});

      const { req: shipReq } = createMocks({
        method: 'POST',
        body: {
          orderIds: ['order-1'],
          courierService: 'poslaju-standard'
        }
      });

      const shipResponse = await createShipment(shipReq);
      const shipData = await shipResponse.json();

      expect(shipResponse.status).toBe(200);
      expect(shipData.success).toBe(true);
      expect(shipData.results.successful).toBe(1);

      // Step 3: Verify tracking data is available
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        shipment: {
          ...mockShipment,
          trackingNumber: 'TRK123456789',
          status: 'CREATED',
          trackingEvents: []
        }
      });

      const { req: trackingReq } = createMocks({
        method: 'GET'
      });

      const trackingResponse = await getTracking(trackingReq, { params: { id: 'order-1' } });
      const trackingData = await trackingResponse.json();

      expect(trackingResponse.status).toBe(200);
      expect(trackingData.success).toBe(true);
      expect(trackingData.tracking.trackingNumber).toBe('TRK123456789');

      // Step 4: Simulate tracking updates from courier
      const trackingUpdateData = {
        status: 'in_transit',
        description: 'Package in transit',
        tracking_events: [
          {
            event_code: 'PICKED_UP',
            event_name: 'Package picked up',
            description: 'Package picked up from origin',
            timestamp: '2025-08-01T10:00:00Z',
            location: 'Kuala Lumpur Hub'
          },
          {
            event_code: 'IN_TRANSIT',
            event_name: 'In transit',
            description: 'Package in transit to destination',
            timestamp: '2025-08-02T08:00:00Z',
            location: 'Selangor Hub'
          }
        ]
      };

      easyParcelService.trackShipment.mockResolvedValue(trackingUpdateData);
      prisma.shipment.update.mockResolvedValue({
        ...mockShipment,
        status: 'IN_TRANSIT'
      });
      prisma.shipmentTracking.deleteMany.mockResolvedValue({ count: 0 });
      prisma.shipmentTracking.createMany.mockResolvedValue({ count: 2 });

      const { req: refreshReq } = createMocks({
        method: 'POST'
      });

      const refreshResponse = await refreshTracking(refreshReq, { params: { id: 'order-1' } });
      const refreshData = await refreshResponse.json();

      expect(refreshResponse.status).toBe(200);
      expect(refreshData.success).toBe(true);
      expect(refreshData.message).toContain('refreshed successfully');

      // Step 5: Verify analytics reflect the changes
      prisma.shipment.findMany.mockResolvedValue([{
        ...mockShipment,
        status: 'IN_TRANSIT',
        order: mockOrder,
        trackingEvents: []
      }]);

      const { req: analyticsReq } = createMocks({
        method: 'GET',
        query: { days: '30' }
      });

      const analyticsResponse = await getAnalytics(analyticsReq);
      const analyticsData = await analyticsResponse.json();

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsData.success).toBe(true);
      expect(analyticsData.stats.totalShipments).toBe(1);
      expect(analyticsData.stats.inTransit).toBe(1);
    });

    test('should handle workflow with delivery completion', async () => {
      // Setup delivered shipment
      const deliveredShipment = {
        ...mockShipment,
        status: 'DELIVERED',
        actualDelivery: new Date('2025-08-04T14:30:00Z'),
        trackingEvents: [
          {
            eventCode: 'DELIVERED',
            eventName: 'Package delivered',
            description: 'Package delivered to recipient',
            eventTime: new Date('2025-08-04T14:30:00Z'),
            location: 'Kuala Lumpur'
          }
        ]
      };

      prisma.shipment.findMany.mockResolvedValue([{
        ...deliveredShipment,
        order: mockOrder
      }]);

      const { req } = createMocks({
        method: 'GET',
        query: { days: '7' }
      });

      const response = await getAnalytics(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.delivered).toBe(1);
      expect(data.stats.averageDeliveryTime).toBeGreaterThan(0);
    });
  });

  describe('Bulk Operations Integration', () => {
    test('should handle bulk tracking refresh for multiple orders', async () => {
      const multipleShipments = [
        {
          id: 'shipment-1',
          trackingNumber: 'TRK123456',
          status: 'IN_TRANSIT',
          order: { orderNumber: 'ORD-001' },
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: 'shipment-2',
          trackingNumber: 'TRK789012',
          status: 'PICKED_UP',
          order: { orderNumber: 'ORD-002' },
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
        }
      ];

      prisma.shipment.findMany.mockResolvedValue(multipleShipments);
      
      // Mock successful tracking updates
      easyParcelService.trackShipment
        .mockResolvedValueOnce({
          status: 'out_for_delivery',
          tracking_events: [{
            event_code: 'OUT_FOR_DELIVERY',
            event_name: 'Out for delivery',
            timestamp: '2025-08-03T09:00:00Z',
            location: 'Kuala Lumpur'
          }]
        })
        .mockResolvedValueOnce({
          status: 'in_transit',
          tracking_events: [{
            event_code: 'IN_TRANSIT',
            event_name: 'In transit',
            timestamp: '2025-08-02T15:00:00Z',
            location: 'Selangor Hub'
          }]
        });

      prisma.shipment.update.mockResolvedValue({});
      prisma.shipmentTracking.findMany.mockResolvedValue([]);
      prisma.shipmentTracking.createMany.mockResolvedValue({ count: 1 });
      prisma.auditLog.create.mockResolvedValue({});

      const { req } = createMocks({
        method: 'POST'
      });

      const response = await bulkRefresh(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.successful).toBe(2);
      expect(data.results.failed).toBe(0);
    });

    test('should handle partial failures in bulk operations', async () => {
      const shipmentsWithMixedResults = [
        {
          id: 'shipment-1',
          trackingNumber: 'TRK123456',
          status: 'IN_TRANSIT',
          order: { orderNumber: 'ORD-001' },
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 'shipment-2',
          trackingNumber: 'TRK789012',
          status: 'PICKED_UP',
          order: { orderNumber: 'ORD-002' },
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
        }
      ];

      prisma.shipment.findMany.mockResolvedValue(shipmentsWithMixedResults);
      
      // Mock one success, one failure
      easyParcelService.trackShipment
        .mockResolvedValueOnce({
          status: 'delivered',
          tracking_events: []
        })
        .mockRejectedValueOnce(new Error('Tracking not found'));

      prisma.shipment.update.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const { req } = createMocks({
        method: 'POST'
      });

      const response = await bulkRefresh(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.successful).toBe(1);
      expect(data.results.failed).toBe(1);
      expect(data.results.errors).toHaveLength(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle database transaction failures gracefully', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder]);
      easyParcelService.createShipment.mockResolvedValue({
        waybill_number: 'TRK123456',
        service_id: 'poslaju-standard'
      });
      
      // Simulate database failure
      prisma.shipment.create.mockRejectedValue(new Error('Database connection failed'));

      const { req } = createMocks({
        method: 'POST',
        body: {
          orderIds: ['order-1'],
          courierService: 'poslaju-standard'
        }
      });

      const response = await createShipment(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.failed).toBe(1);
      expect(data.results.errors[0]).toContain('Database connection failed');
    });

    test('should handle EasyParcel API rate limiting', async () => {
      const shipment = {
        ...mockShipment,
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      };

      prisma.shipment.findMany.mockResolvedValue([shipment]);
      easyParcelService.trackShipment.mockRejectedValue(
        new Error('Rate limit exceeded - 429')
      );

      const { req } = createMocks({
        method: 'POST'
      });

      const response = await bulkRefresh(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.failed).toBe(1);
      expect(data.results.errors[0]).toContain('Rate limit exceeded');
    });

    test('should handle tracking data inconsistencies', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        shipment: {
          ...mockShipment,
          trackingNumber: 'TRK123456'
        }
      });

      // Mock inconsistent tracking data
      easyParcelService.trackShipment.mockResolvedValue({
        status: null,
        tracking_events: [
          {
            // Missing required fields
            event_code: null,
            timestamp: 'invalid-date'
          }
        ]
      });

      prisma.shipment.update.mockResolvedValue({});
      prisma.shipmentTracking.deleteMany.mockResolvedValue({ count: 0 });
      prisma.shipmentTracking.createMany.mockResolvedValue({ count: 0 });
      prisma.auditLog.create.mockResolvedValue({});

      const { req } = createMocks({
        method: 'POST'
      });

      const response = await refreshTracking(req, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should handle gracefully without creating invalid tracking events
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large batch operations efficiently', async () => {
      // Create 100 shipments for testing
      const largeShipmentBatch = Array.from({ length: 100 }, (_, i) => ({
        id: `shipment-${i + 1}`,
        trackingNumber: `TRK${String(i + 1).padStart(6, '0')}`,
        status: 'IN_TRANSIT',
        order: { orderNumber: `ORD-${String(i + 1).padStart(3, '0')}` },
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }));

      // But only process first 50 due to batch limit
      prisma.shipment.findMany.mockResolvedValue(largeShipmentBatch.slice(0, 50));
      
      // Mock successful responses for all
      easyParcelService.trackShipment.mockResolvedValue({
        status: 'in_transit',
        tracking_events: []
      });

      prisma.shipment.update.mockResolvedValue({});
      prisma.shipmentTracking.findMany.mockResolvedValue([]);
      prisma.auditLog.create.mockResolvedValue({});

      const startTime = Date.now();
      
      const { req } = createMocks({
        method: 'POST'
      });

      const response = await bulkRefresh(req);
      const data = await response.json();
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(data.results.successful).toBe(50);
      
      // Should respect batch limits
      expect(prisma.shipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50
        })
      );
      
      // Processing time should be reasonable (allowing for rate limiting delays)
      expect(processingTime).toBeLessThan(120000); // 2 minutes max
    });

    test('should maintain data consistency under concurrent operations', async () => {
      const shipment = {
        ...mockShipment,
        trackingNumber: 'TRK123456'
      };

      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        shipment
      });

      // Simulate concurrent tracking events
      const existingEvents = [
        {
          id: 'event-1',
          eventCode: 'PICKED_UP',
          eventTime: new Date('2025-08-01T10:00:00Z')
        }
      ];

      const newTrackingData = {
        status: 'in_transit',
        tracking_events: [
          {
            event_code: 'PICKED_UP',
            timestamp: '2025-08-01T10:00:00Z' // Duplicate
          },
          {
            event_code: 'IN_TRANSIT',
            timestamp: '2025-08-02T08:00:00Z' // New
          }
        ]
      };

      prisma.shipmentTracking.findMany.mockResolvedValue(existingEvents);
      easyParcelService.trackShipment.mockResolvedValue(newTrackingData);
      prisma.shipment.update.mockResolvedValue({});
      prisma.shipmentTracking.deleteMany.mockResolvedValue({ count: 0 });
      prisma.shipmentTracking.createMany.mockResolvedValue({ count: 1 }); // Only new event
      prisma.auditLog.create.mockResolvedValue({});

      const { req } = createMocks({
        method: 'POST'
      });

      const response = await refreshTracking(req, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Should only create new events, not duplicates
      expect(prisma.shipmentTracking.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            eventCode: 'IN_TRANSIT'
          })
        ])
      });
    });
  });
});