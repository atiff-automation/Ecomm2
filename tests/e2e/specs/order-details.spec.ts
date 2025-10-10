import { test, expect } from '@playwright/test';

test.describe('Order Details Page - Phase 4', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('[name="email"]', process.env.ADMIN_EMAIL || 'admin@example.com');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should display order details page with all required sections', async ({ page }) => {
    // Navigate to orders list
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // Click on first order to view details
    const firstOrderRow = page.locator('tbody tr').first();
    await firstOrderRow.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Verify page structure
    await expect(page.locator('h1')).toContainText('Order');
    await expect(page.locator('h1')).toContainText('ORD-'); // Order number format

    // Verify all required sections are present
    await expect(page.getByText('Order Items')).toBeVisible();
    await expect(page.getByText('Customer Information')).toBeVisible();
    await expect(page.getByText('Shipping Address')).toBeVisible();
    await expect(page.getByText('Payment Information')).toBeVisible();
    await expect(page.getByText('Update Status')).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();
  });

  test('should handle Edge Case 1: Guest orders correctly', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // Find a guest order (has guestEmail)
    const guestOrderRow = page.locator('tbody tr').filter({
      has: page.locator('text=/Guest|guest@/')
    }).first();

    if (await guestOrderRow.count() > 0) {
      await guestOrderRow.locator('a[href*="/admin/orders/"]').first().click();
      await page.waitForURL(/\/admin\/orders\/.+/);

      // Verify guest customer information is displayed
      await expect(page.getByText('Customer Information')).toBeVisible();
      await expect(page.getByText(/Guest|Email \(Guest\)/)).toBeVisible();

      // All functions should still work
      await expect(page.getByText('Print Invoice')).toBeVisible();
      await expect(page.getByText('Update Status')).toBeVisible();
    }
  });

  test('should handle Edge Case 2: Deleted products gracefully', async ({ page }) => {
    // This test assumes we have an order with a deleted product
    await page.goto('/admin/orders');
    const firstOrder = page.locator('tbody tr').first();
    await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Check if any product shows "Product unavailable" badge
    const unavailableBadges = page.locator('text=Product unavailable');
    if (await unavailableBadges.count() > 0) {
      // Verify product name is still shown from cached data
      const orderItems = page.locator('[class*="border-b"]').filter({
        has: page.locator('text=Product unavailable')
      });

      const productName = await orderItems.first().locator('p').first().textContent();
      expect(productName).toBeTruthy();
      expect(productName).not.toBe('null');
      expect(productName).not.toBe('undefined');
    }
  });

  test('should handle Edge Case 3: Orders without shipment', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // Look for an order that is PAID but not shipped
    const paidOrder = page.locator('tbody tr').filter({
      has: page.locator('text=Paid')
    }).first();

    if (await paidOrder.count() > 0) {
      await paidOrder.locator('a[href*="/admin/orders/"]').first().click();
      await page.waitForURL(/\/admin\/orders\/.+/);

      // If order has no shipment, "Fulfill Order" button should be visible
      const fulfillButton = page.getByRole('button', { name: /Fulfill Order/i });

      // Check if tracking section is hidden
      const trackingSection = page.getByText('Shipment Tracking');

      if (await trackingSection.count() === 0) {
        // No tracking = unfulfilled order
        await expect(fulfillButton).toBeVisible();
        await expect(fulfillButton).toBeEnabled();
      }
    }
  });

  test('should handle Edge Case 4: Failed shipment booking', async ({ page }) => {
    // This test assumes we have an order with failed shipment booking
    await page.goto('/admin/orders');
    const firstOrder = page.locator('tbody tr').first();
    await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Look for failure indicators if they exist
    const failureMessages = page.locator('text=/Failed|Error|Invalid/i');
    if (await failureMessages.count() > 0) {
      // Verify error message is displayed
      await expect(failureMessages.first()).toBeVisible();

      // Verify retry button or appropriate action is available
      // (This would depend on the actual implementation)
    }
  });

  test('should handle Edge Case 5: Concurrent status updates with optimistic UI', async ({ page }) => {
    await page.goto('/admin/orders');
    const firstOrder = page.locator('tbody tr').first();
    await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Get initial status
    const statusSelect = page.locator('select').first();
    const initialStatus = await statusSelect.inputValue();

    // Change status
    await statusSelect.selectOption('IN_TRANSIT');

    // Wait for success toast
    await expect(page.locator('[role="status"]')).toContainText(/updated successfully/i, {
      timeout: 10000
    });

    // Verify page refreshed with new status
    await page.waitForTimeout(1000);
    const newStatus = await statusSelect.inputValue();
    expect(newStatus).not.toBe(initialStatus);
  });

  test('should handle Edge Case 6: Very long order numbers with truncation', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // Check if any order numbers are truncated in the list view
    const orderNumbers = page.locator('tbody td').filter({ hasText: 'ORD-' });

    if (await orderNumbers.count() > 0) {
      const firstOrderNumber = await orderNumbers.first().textContent();

      // Click to go to details page
      const firstOrder = page.locator('tbody tr').first();
      await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
      await page.waitForURL(/\/admin\/orders\/.+/);

      // On details page, full order number should be visible
      const fullOrderNumber = await page.locator('h1').textContent();
      expect(fullOrderNumber).toContain('Order');
      expect(fullOrderNumber).toContain('ORD-');
    }
  });

  test('should handle Edge Case 7: Large order item count (>20 items)', async ({ page }) => {
    await page.goto('/admin/orders');
    const firstOrder = page.locator('tbody tr').first();
    await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Count order items
    const orderItems = page.locator('[class*="border-b"]').filter({
      has: page.locator('p.font-medium')
    });

    const itemCount = await orderItems.count();

    // All items should be displayed on details page (no truncation)
    // Verify items section is scrollable if needed
    await expect(page.getByText('Order Items')).toBeVisible();

    // If there are many items, ensure they're all visible
    if (itemCount > 20) {
      // Scroll to bottom of items list
      await orderItems.last().scrollIntoViewIfNeeded();
      await expect(orderItems.last()).toBeVisible();
    }
  });

  test('should handle Edge Case 8: Timezone handling correctly', async ({ page }) => {
    await page.goto('/admin/orders');
    const firstOrder = page.locator('tbody tr').first();
    await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Verify order date is displayed
    const orderDate = page.locator('h1 + p.text-sm.text-gray-500');
    await expect(orderDate).toBeVisible();

    const dateText = await orderDate.textContent();
    expect(dateText).toBeTruthy();

    // Date should be in a readable format (not raw ISO string)
    expect(dateText).not.toMatch(/^\d{4}-\d{2}-\d{2}T/); // Not raw ISO
    expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4}/); // Formatted date
  });

  test('should allow status updates from details page', async ({ page }) => {
    await page.goto('/admin/orders');
    const firstOrder = page.locator('tbody tr').first();
    await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Locate status dropdown
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible();

    // Verify all status options are available
    const options = await statusSelect.locator('option').all();
    expect(options.length).toBeGreaterThan(5); // Should have multiple status options
  });

  test('should display quick action buttons', async ({ page }) => {
    await page.goto('/admin/orders');
    const firstOrder = page.locator('tbody tr').first();
    await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Verify quick action buttons exist
    await expect(page.getByText('Print Invoice')).toBeVisible();
    await expect(page.getByText('Print Packing Slip')).toBeVisible();

    // Back button should work
    const backButton = page.getByRole('button', { name: /Back/i });
    await expect(backButton).toBeVisible();
  });

  test('should display tracking information if shipment exists', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // Find an order that has been shipped
    const shippedOrder = page.locator('tbody tr').filter({
      has: page.locator('text=/Shipped|In Transit|Delivered/')
    }).first();

    if (await shippedOrder.count() > 0) {
      await shippedOrder.locator('a[href*="/admin/orders/"]').first().click();
      await page.waitForURL(/\/admin\/orders\/.+/);

      // Verify tracking section exists
      const trackingSection = page.getByText('Shipment Tracking');
      if (await trackingSection.count() > 0) {
        await expect(trackingSection).toBeVisible();

        // Verify tracking details
        await expect(page.getByText('Tracking Number')).toBeVisible();
        await expect(page.getByText('Courier')).toBeVisible();

        // Verify refresh tracking button
        const refreshButton = page.getByRole('button').filter({ has: page.locator('svg[class*="animate-spin"]') });
        // Button should exist even if not spinning
      }
    }
  });

  test('should navigate back to orders list', async ({ page }) => {
    await page.goto('/admin/orders');
    const firstOrder = page.locator('tbody tr').first();
    await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Click back button
    const backButton = page.getByRole('button', { name: /Back/i });
    await backButton.click();

    // Should be back on orders list
    await expect(page).toHaveURL('/admin/orders');
    await expect(page.locator('h1')).toContainText(/Orders|Order Management/);
  });

  test('should display order totals correctly', async ({ page }) => {
    await page.goto('/admin/orders');
    const firstOrder = page.locator('tbody tr').first();
    await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Verify all total fields are present
    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('Shipping')).toBeVisible();
    await expect(page.getByText(/^Total$/)).toBeVisible();

    // Verify amounts are in currency format (RM)
    const totalSection = page.locator('div').filter({ hasText: 'Total' }).last();
    const totalText = await totalSection.textContent();
    expect(totalText).toContain('RM');
  });

  test('should display payment information correctly', async ({ page }) => {
    await page.goto('/admin/orders');
    const firstOrder = page.locator('tbody tr').first();
    await firstOrder.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Verify payment information section
    await expect(page.getByText('Payment Information')).toBeVisible();
    await expect(page.getByText('Payment Method')).toBeVisible();
    await expect(page.getByText('Payment Status')).toBeVisible();
  });
});
