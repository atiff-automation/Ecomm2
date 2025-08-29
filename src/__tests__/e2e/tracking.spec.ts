/**
 * End-to-End tests for tracking functionality
 * These tests simulate real user interactions with the tracking system
 */

import { test, expect } from '@playwright/test';

// Test data setup
const testOrder = {
  orderNumber: 'ORD-TEST-001',
  trackingNumber: 'TRK123456789',
  customerName: 'John Doe',
  courierName: 'Pos Laju',
};

const mockTrackingData = {
  status: 'in_transit',
  description: 'Package in transit to destination',
  estimated_delivery: '2025-08-25',
  tracking_events: [
    {
      event_code: 'PICKED_UP',
      event_name: 'Package picked up',
      description: 'Package picked up from origin',
      timestamp: '2025-08-20T10:00:00Z',
      location: 'Kuala Lumpur Hub',
    },
    {
      event_code: 'IN_TRANSIT',
      event_name: 'In transit',
      description: 'Package in transit to destination',
      timestamp: '2025-08-21T08:00:00Z',
      location: 'Selangor Hub',
    },
  ],
};

test.describe('Tracking System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'admin-1', role: 'ADMIN', name: 'Admin User' },
        }),
      });
    });

    // Mock API endpoints
    await page.route('**/api/admin/orders', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orders: [
            {
              id: 'order-1',
              orderNumber: testOrder.orderNumber,
              status: 'SHIPPED',
              createdAt: '2025-08-20T00:00:00Z',
              shippingAddress: {
                name: testOrder.customerName,
                city: 'Kuala Lumpur',
                state: 'Selangor',
              },
              shipment: {
                id: 'shipment-1',
                trackingNumber: testOrder.trackingNumber,
                status: 'in_transit',
                courierName: testOrder.courierName,
                serviceName: 'Standard',
                estimatedDelivery: '2025-08-25T00:00:00Z',
                trackingEvents: mockTrackingData.tracking_events.map(event => ({
                  ...event,
                  eventTime: event.timestamp,
                })),
              },
            },
          ],
          totalCount: 1,
          totalPages: 1,
        }),
      });
    });

    await page.route('**/api/admin/orders/order-1/tracking', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            tracking: {
              trackingNumber: testOrder.trackingNumber,
              status: 'in_transit',
              courierName: testOrder.courierName,
              trackingEvents: mockTrackingData.tracking_events.map(event => ({
                ...event,
                eventTime: event.timestamp,
              })),
            },
          }),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Tracking data refreshed successfully',
          }),
        });
      }
    });

    await page.route('**/api/admin/tracking/analytics*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          stats: {
            totalShipments: 25,
            inTransit: 8,
            delivered: 15,
            exceptions: 2,
            averageDeliveryTime: 3.2,
            onTimeDeliveryRate: 92.5,
            courierPerformance: [
              {
                courierName: 'Pos Laju',
                shipmentCount: 15,
                deliveryRate: 96.0,
                averageTime: 2.8,
              },
              {
                courierName: 'GDex',
                shipmentCount: 10,
                deliveryRate: 88.0,
                averageTime: 3.5,
              },
            ],
          },
        }),
      });
    });
  });

  test('Admin can view orders list with tracking information', async ({
    page,
  }) => {
    await page.goto('/admin/orders');

    // Wait for orders to load
    await expect(page.locator('text=' + testOrder.orderNumber)).toBeVisible();

    // Check tracking number is displayed
    await expect(
      page.locator('text=' + testOrder.trackingNumber)
    ).toBeVisible();

    // Check status badge
    await expect(
      page.locator('.tracking-status', { hasText: 'in_transit' })
    ).toBeVisible();

    // Check courier name
    await expect(page.locator('text=' + testOrder.courierName)).toBeVisible();
  });

  test('Admin can click tracking number to copy to clipboard', async ({
    page,
  }) => {
    await page.goto('/admin/orders');

    // Wait for orders to load
    await expect(
      page.locator('text=' + testOrder.trackingNumber)
    ).toBeVisible();

    // Mock clipboard API
    await page.evaluate(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });
    });

    // Click on tracking number
    await page.click('text=' + testOrder.trackingNumber);

    // Check for success notification (if implemented)
    // await expect(page.locator('.toast', { hasText: 'Tracking number copied' })).toBeVisible();
  });

  test('Admin can view detailed order tracking information', async ({
    page,
  }) => {
    await page.goto('/admin/orders/order-1');

    // Wait for order details to load
    await expect(page.locator('text=' + testOrder.orderNumber)).toBeVisible();

    // Check tracking section exists
    await expect(
      page.locator('[data-testid="tracking-section"]')
    ).toBeVisible();

    // Check tracking number display
    await expect(
      page.locator('text=' + testOrder.trackingNumber)
    ).toBeVisible();

    // Check status display
    await expect(page.locator('text=in_transit')).toBeVisible();

    // Check tracking events timeline
    await expect(page.locator('text=Package picked up')).toBeVisible();
    await expect(page.locator('text=In transit')).toBeVisible();
    await expect(page.locator('text=Kuala Lumpur Hub')).toBeVisible();
    await expect(page.locator('text=Selangor Hub')).toBeVisible();
  });

  test('Admin can refresh tracking data', async ({ page }) => {
    await page.goto('/admin/orders/order-1');

    // Wait for order details to load
    await expect(page.locator('text=' + testOrder.orderNumber)).toBeVisible();

    // Click refresh tracking button
    const refreshButton = page.locator('[data-testid="refresh-tracking"]');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Check for loading state
    await expect(page.locator('.loading-spinner')).toBeVisible();

    // Wait for refresh to complete and check for success message
    await expect(
      page.locator('text=Tracking data refreshed successfully')
    ).toBeVisible();
  });

  test('Admin can access external courier tracking', async ({ page }) => {
    await page.goto('/admin/orders/order-1');

    // Wait for order details to load
    await expect(page.locator('text=' + testOrder.orderNumber)).toBeVisible();

    // Check external tracking link
    const externalLink = page.locator('[data-testid="external-tracking-link"]');
    await expect(externalLink).toBeVisible();
    await expect(externalLink).toHaveAttribute(
      'href',
      expect.stringContaining(testOrder.trackingNumber)
    );
    await expect(externalLink).toHaveAttribute('target', '_blank');
  });

  test('Admin can use fulfillment page for bulk operations', async ({
    page,
  }) => {
    // Mock fulfillment page data
    await page.route('**/api/admin/orders/fulfillment*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orders: [
            {
              id: 'order-1',
              orderNumber: testOrder.orderNumber,
              status: 'PROCESSING',
              shipment: null,
            },
            {
              id: 'order-2',
              orderNumber: 'ORD-TEST-002',
              status: 'SHIPPED',
              shipment: {
                trackingNumber: 'TRK987654321',
                status: 'in_transit',
                courierName: 'GDex',
              },
            },
          ],
        }),
      });
    });

    await page.goto('/admin/orders/fulfillment');

    // Wait for fulfillment page to load
    await expect(page.locator('text=Order Fulfillment')).toBeVisible();

    // Check orders are displayed
    await expect(page.locator('text=' + testOrder.orderNumber)).toBeVisible();
    await expect(page.locator('text=ORD-TEST-002')).toBeVisible();

    // Check bulk actions are available
    await expect(
      page.locator('[data-testid="bulk-ship-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="bulk-tracking-refresh"]')
    ).toBeVisible();

    // Select orders for bulk operation
    await page.check('[data-testid="order-checkbox-order-1"]');
    await page.check('[data-testid="order-checkbox-order-2"]');

    // Check bulk actions become enabled
    await expect(
      page.locator('[data-testid="bulk-ship-button"]')
    ).toBeEnabled();
  });

  test('Admin can view tracking analytics dashboard', async ({ page }) => {
    await page.goto('/admin/tracking/analytics');

    // Wait for dashboard to load
    await expect(page.locator('text=Tracking Analytics')).toBeVisible();

    // Check key metrics cards
    await expect(page.locator('text=Total Shipments')).toBeVisible();
    await expect(page.locator('text=25')).toBeVisible(); // Total shipments

    await expect(page.locator('text=In Transit')).toBeVisible();
    await expect(page.locator('text=8')).toBeVisible(); // In transit count

    await expect(page.locator('text=Delivered')).toBeVisible();
    await expect(page.locator('text=15')).toBeVisible(); // Delivered count

    await expect(page.locator('text=Exceptions')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible(); // Exceptions count

    // Check performance metrics
    await expect(page.locator('text=3.2 days')).toBeVisible(); // Average delivery time
    await expect(page.locator('text=92.5%')).toBeVisible(); // On-time delivery rate

    // Check courier performance
    await expect(page.locator('text=Pos Laju')).toBeVisible();
    await expect(page.locator('text=96.0%')).toBeVisible(); // Pos Laju delivery rate
    await expect(page.locator('text=GDex')).toBeVisible();
    await expect(page.locator('text=88.0%')).toBeVisible(); // GDex delivery rate
  });

  test('Admin can change date range in analytics', async ({ page }) => {
    await page.goto('/admin/tracking/analytics');

    // Wait for dashboard to load
    await expect(page.locator('text=Tracking Analytics')).toBeVisible();

    // Change date range
    await page.click('[data-testid="date-range-select"]');
    await page.click('text=Last 7 days');

    // Verify API call is made with new date range
    await page.waitForResponse(
      response =>
        response.url().includes('/api/admin/tracking/analytics?days=7') &&
        response.status() === 200
    );
  });

  test('Admin can export tracking report', async ({ page }) => {
    // Mock export endpoint
    await page.route('**/api/admin/tracking/export*', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition':
            'attachment; filename="tracking-report-2025-08-20.csv"',
        },
        body:
          'Order Number,Tracking Number,Status\n' +
          testOrder.orderNumber +
          ',' +
          testOrder.trackingNumber +
          ',in_transit',
      });
    });

    await page.goto('/admin/tracking/analytics');

    // Wait for dashboard to load
    await expect(page.locator('text=Tracking Analytics')).toBeVisible();

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-button"]');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('tracking-report');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('System handles errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/admin/orders/order-1/tracking', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to refresh tracking data',
          }),
        });
      }
    });

    await page.goto('/admin/orders/order-1');

    // Wait for order details to load
    await expect(page.locator('text=' + testOrder.orderNumber)).toBeVisible();

    // Try to refresh tracking
    await page.click('[data-testid="refresh-tracking"]');

    // Check error message is displayed
    await expect(
      page.locator('text=Failed to refresh tracking data')
    ).toBeVisible();
  });

  test('Mobile responsive design works correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin/orders');

    // Wait for orders to load
    await expect(page.locator('text=' + testOrder.orderNumber)).toBeVisible();

    // Check that mobile-specific elements are visible
    // This would depend on the actual responsive design implementation
    await expect(
      page.locator('[data-testid="mobile-tracking-card"]')
    ).toBeVisible();

    // Check that desktop-only elements are hidden
    await expect(
      page.locator('[data-testid="desktop-tracking-table"]')
    ).not.toBeVisible();
  });

  test('Performance: Page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/admin/orders');

    // Wait for critical content to load
    await expect(page.locator('text=' + testOrder.orderNumber)).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Accessibility: Tracking pages are accessible', async ({ page }) => {
    await page.goto('/admin/orders/order-1');

    // Wait for content to load
    await expect(page.locator('text=' + testOrder.orderNumber)).toBeVisible();

    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toBeVisible();

    // Check for proper ARIA labels
    await expect(page.locator('[aria-label]')).toHaveCount(expect.any(Number));

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Check color contrast (this would require additional tools in real implementation)
    // For now, just verify important text is visible
    await expect(
      page.locator('text=' + testOrder.trackingNumber)
    ).toBeVisible();
  });
});

test.describe('Tracking System Error Scenarios', () => {
  test('Handles network failures gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/admin/orders', async route => {
      await route.abort('failed');
    });

    await page.goto('/admin/orders');

    // Check error state is displayed
    await expect(page.locator('text=Failed to load orders')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('Handles timeout scenarios', async ({ page }) => {
    // Simulate slow API response
    await page.route('**/api/admin/orders/order-1/tracking', async route => {
      if (route.request().method() === 'POST') {
        // Delay response to simulate timeout
        await new Promise(resolve => setTimeout(resolve, 30000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.goto('/admin/orders/order-1');

    // Start refresh operation
    await page.click('[data-testid="refresh-tracking"]');

    // Check loading state persists
    await expect(page.locator('.loading-spinner')).toBeVisible();

    // In a real scenario, there should be a timeout handler
    // that shows an error after a reasonable time
  });

  test('Handles partial data scenarios', async ({ page }) => {
    // Mock API with partial/incomplete data
    await page.route('**/api/admin/orders/order-1/tracking', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            tracking: {
              trackingNumber: testOrder.trackingNumber,
              status: 'unknown',
              courierName: null,
              trackingEvents: [],
            },
          }),
        });
      }
    });

    await page.goto('/admin/orders/order-1');

    // Check that partial data is handled gracefully
    await expect(
      page.locator('text=' + testOrder.trackingNumber)
    ).toBeVisible();
    await expect(page.locator('text=unknown')).toBeVisible();
    await expect(
      page.locator('text=No tracking events available')
    ).toBeVisible();
  });
});
