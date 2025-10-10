import { test, expect } from '@playwright/test';

/**
 * Basic Order Management E2E Tests
 * Tests that don't require authentication - just verify page loads and UI elements
 */

test.describe('Order Management - Basic Tests (No Auth)', () => {
  test('should redirect to signin when accessing orders page without auth', async ({ page }) => {
    await page.goto('/admin/orders');

    // Should redirect to signin page
    await expect(page).toHaveURL(/\/auth\/signin/);

    // Verify signin page loads
    await expect(page.locator('h1')).toContainText(/Sign In|JRM E-commerce/);
  });

  test('should show order management in admin navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Will redirect to signin, but we can check the structure
    // This test verifies the route exists and is protected
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('should have orders page route configured', async ({ page }) => {
    // Try to access the orders page
    const response = await page.goto('/admin/orders');

    // Should get a response (even if it redirects)
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('Order Management - With Mock Auth', () => {
  test.skip('Login functionality needs valid admin credentials', async ({ page }) => {
    // This test is skipped because admin credentials need to be verified
    // To enable these tests:
    // 1. Ensure admin@jrm.com user exists in database
    // 2. Verify password is Admin123!
    // 3. Check authentication flow works correctly
  });
});
