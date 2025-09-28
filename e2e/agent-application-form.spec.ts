/**
 * Agent Application Form E2E Tests
 * End-to-end testing of the complete agent application form submission flow
 * Following CLAUDE.md principles: Systematic testing, comprehensive validation
 */

import { test, expect } from '@playwright/test';

// Test data following Malaysian patterns
const validTestData = {
  fullName: 'Ahmad bin Abdullah',
  icNumber: '901020-01-1234',
  phoneNumber: '+60123456789',
  email: 'ahmad.test@example.com',
  address: 'No. 123, Jalan Utama, Taman Indah, 50100 Kuala Lumpur',
  age: '35',
  businessLocation: 'Kuala Lumpur',
  instagramHandle: 'ahmad_entrepreneur',
  facebookHandle: 'Ahmad Abdullah Business',
  tiktokHandle: 'ahmad_biz',
  jrmProducts: 'JRM Premium Skincare, JRM Supplements',
  reasonToJoin: 'Ingin mengembangkan perniagaan dan membantu lebih ramai orang mendapat produk berkualiti JRM',
  expectations: 'Mencapai tahap agent platinum dalam tempoh 2 tahun dan membina pasukan yang kuat'
};

test.describe('Agent Application Form Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to agent application form
    await page.goto('/apply/agent');
    await expect(page).toHaveTitle(/Agent Application/);
  });

  test('should complete entire form submission flow successfully', async ({ page }) => {
    // Step 1: Terms & Conditions
    await test.step('Step 1: Accept terms and conditions', async () => {
      await expect(page.locator('h1')).toContainText('Agent Application');
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('1 of 5');

      // Check terms checkbox
      await page.check('[data-testid="accept-terms"]');

      // Proceed to next step
      await page.click('[data-testid="next-button"]');
    });

    // Step 2: Basic Information
    await test.step('Step 2: Fill basic information', async () => {
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('2 of 5');

      // Fill personal details
      await page.fill('[data-testid="full-name"]', validTestData.fullName);
      await page.fill('[data-testid="ic-number"]', validTestData.icNumber);
      await page.fill('[data-testid="phone-number"]', validTestData.phoneNumber);
      await page.fill('[data-testid="email"]', validTestData.email);
      await page.fill('[data-testid="address"]', validTestData.address);
      await page.fill('[data-testid="age"]', validTestData.age);

      // Business experience section
      await page.check('[data-testid="has-business-exp"]');
      await page.fill('[data-testid="business-location"]', validTestData.businessLocation);
      await page.check('[data-testid="has-team-lead-exp"]');
      await page.check('[data-testid="is-registered"]');

      // Proceed to next step
      await page.click('[data-testid="next-button"]');
    });

    // Step 3: Social Media Information
    await test.step('Step 3: Fill social media information', async () => {
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('3 of 5');

      // Fill social media handles
      await page.fill('[data-testid="instagram-handle"]', validTestData.instagramHandle);
      await page.fill('[data-testid="facebook-handle"]', validTestData.facebookHandle);
      await page.fill('[data-testid="tiktok-handle"]', validTestData.tiktokHandle);

      // Select skill levels
      await page.selectOption('[data-testid="instagram-level"]', 'MAHIR');
      await page.selectOption('[data-testid="facebook-level"]', 'SANGAT_MAHIR');
      await page.selectOption('[data-testid="tiktok-level"]', 'TIDAK_MAHIR');

      // Proceed to next step
      await page.click('[data-testid="next-button"]');
    });

    // Step 4: Additional Information
    await test.step('Step 4: Fill additional information', async () => {
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('4 of 5');

      // JRM experience
      await page.check('[data-testid="has-jrm-exp"]');
      await page.fill('[data-testid="jrm-products"]', validTestData.jrmProducts);

      // Motivation and expectations
      await page.fill('[data-testid="reason-to-join"]', validTestData.reasonToJoin);
      await page.fill('[data-testid="expectations"]', validTestData.expectations);

      // Proceed to next step
      await page.click('[data-testid="next-button"]');
    });

    // Step 5: Review and Submit
    await test.step('Step 5: Review and submit application', async () => {
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('5 of 5');

      // Verify data appears in review
      await expect(page.locator('[data-testid="review-full-name"]')).toContainText(validTestData.fullName);
      await expect(page.locator('[data-testid="review-email"]')).toContainText(validTestData.email);
      await expect(page.locator('[data-testid="review-phone"]')).toContainText(validTestData.phoneNumber);

      // Accept final agreement
      await page.check('[data-testid="final-agreement"]');

      // Submit application
      await page.click('[data-testid="submit-button"]');

      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Application submitted successfully');

      // Verify application ID is shown
      await expect(page.locator('[data-testid="application-id"]')).toBeVisible();
    });
  });

  test('should validate required fields on each step', async ({ page }) => {
    // Step 1: Try to proceed without accepting terms
    await test.step('Validate terms acceptance is required', async () => {
      await page.click('[data-testid="next-button"]');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Terms must be accepted');
    });

    // Accept terms and proceed
    await page.check('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-button"]');

    // Step 2: Try to proceed with missing required fields
    await test.step('Validate basic information required fields', async () => {
      await page.click('[data-testid="next-button"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="full-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="ic-number-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="phone-number-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    });
  });

  test('should validate Malaysian IC number format', async ({ page }) => {
    // Navigate to step 2
    await page.check('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-button"]');

    // Test invalid IC number formats
    const invalidICNumbers = [
      '12345-67-890',    // Wrong format
      '901020011234',    // Missing dashes
      'ABC123-01-1234',  // Contains letters
      '90102-01-1234'    // Wrong year format
    ];

    for (const invalidIC of invalidICNumbers) {
      await page.fill('[data-testid="ic-number"]', invalidIC);
      await page.blur('[data-testid="ic-number"]');
      await expect(page.locator('[data-testid="ic-number-error"]')).toContainText('Invalid IC number format');
    }

    // Test valid IC number
    await page.fill('[data-testid="ic-number"]', validTestData.icNumber);
    await page.blur('[data-testid="ic-number"]');
    await expect(page.locator('[data-testid="ic-number-error"]')).not.toBeVisible();
  });

  test('should validate Malaysian phone number format', async ({ page }) => {
    // Navigate to step 2
    await page.check('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-button"]');

    // Test invalid phone number formats
    const invalidPhones = [
      '123456789',        // Too short
      '+60223456789',     // Invalid prefix
      'abc123456789',     // Contains letters
      '012345678901'      // Too long
    ];

    for (const invalidPhone of invalidPhones) {
      await page.fill('[data-testid="phone-number"]', invalidPhone);
      await page.blur('[data-testid="phone-number"]');
      await expect(page.locator('[data-testid="phone-number-error"]')).toContainText('Invalid phone number format');
    }

    // Test valid phone numbers
    const validPhones = ['+60123456789', '0123456789', '+60134567890'];
    for (const validPhone of validPhones) {
      await page.fill('[data-testid="phone-number"]', validPhone);
      await page.blur('[data-testid="phone-number"]');
      await expect(page.locator('[data-testid="phone-number-error"]')).not.toBeVisible();
    }
  });

  test('should validate age requirements', async ({ page }) => {
    // Navigate to step 2
    await page.check('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-button"]');

    // Test underage
    await page.fill('[data-testid="age"]', '17');
    await page.blur('[data-testid="age"]');
    await expect(page.locator('[data-testid="age-error"]')).toContainText('Must be at least 18 years old');

    // Test overage
    await page.fill('[data-testid="age"]', '81');
    await page.blur('[data-testid="age"]');
    await expect(page.locator('[data-testid="age-error"]')).toContainText('Must be 80 years old or younger');

    // Test valid age
    await page.fill('[data-testid="age"]', '25');
    await page.blur('[data-testid="age"]');
    await expect(page.locator('[data-testid="age-error"]')).not.toBeVisible();
  });

  test('should handle form persistence across page refreshes', async ({ page }) => {
    // Fill step 1 and proceed
    await page.check('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-button"]');

    // Fill some data in step 2
    await page.fill('[data-testid="full-name"]', validTestData.fullName);
    await page.fill('[data-testid="email"]', validTestData.email);

    // Refresh page
    await page.reload();

    // Should return to step 2 with data preserved
    await expect(page.locator('[data-testid="step-indicator"]')).toContainText('2 of 5');
    await expect(page.locator('[data-testid="full-name"]')).toHaveValue(validTestData.fullName);
    await expect(page.locator('[data-testid="email"]')).toHaveValue(validTestData.email);
  });

  test('should allow navigation between steps', async ({ page }) => {
    // Complete step 1
    await page.check('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-button"]');

    // Fill minimal required data in step 2
    await page.fill('[data-testid="full-name"]', validTestData.fullName);
    await page.fill('[data-testid="ic-number"]', validTestData.icNumber);
    await page.fill('[data-testid="phone-number"]', validTestData.phoneNumber);
    await page.fill('[data-testid="email"]', validTestData.email);
    await page.fill('[data-testid="address"]', validTestData.address);
    await page.fill('[data-testid="age"]', validTestData.age);
    await page.click('[data-testid="next-button"]');

    // Should be on step 3
    await expect(page.locator('[data-testid="step-indicator"]')).toContainText('3 of 5');

    // Go back to step 2
    await page.click('[data-testid="back-button"]');
    await expect(page.locator('[data-testid="step-indicator"]')).toContainText('2 of 5');

    // Data should be preserved
    await expect(page.locator('[data-testid="full-name"]')).toHaveValue(validTestData.fullName);
    await expect(page.locator('[data-testid="email"]')).toHaveValue(validTestData.email);
  });

  test('should handle business experience conditional fields', async ({ page }) => {
    // Navigate to step 2
    await page.check('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-button"]');

    // Initially business location should not be required
    await expect(page.locator('[data-testid="business-location"]')).not.toBeVisible();

    // Check business experience
    await page.check('[data-testid="has-business-exp"]');

    // Business location field should now be visible and required
    await expect(page.locator('[data-testid="business-location"]')).toBeVisible();

    // Try to proceed without filling business location
    await page.fill('[data-testid="full-name"]', validTestData.fullName);
    await page.fill('[data-testid="ic-number"]', validTestData.icNumber);
    await page.fill('[data-testid="phone-number"]', validTestData.phoneNumber);
    await page.fill('[data-testid="email"]', validTestData.email);
    await page.fill('[data-testid="address"]', validTestData.address);
    await page.fill('[data-testid="age"]', validTestData.age);
    await page.click('[data-testid="next-button"]');

    // Should show error for business location
    await expect(page.locator('[data-testid="business-location-error"]')).toContainText('Business location is required');
  });

  test('should handle JRM experience conditional fields', async ({ page }) => {
    // Navigate through steps to step 4
    await page.check('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-button"]');

    // Fill minimal step 2
    await page.fill('[data-testid="full-name"]', validTestData.fullName);
    await page.fill('[data-testid="ic-number"]', validTestData.icNumber);
    await page.fill('[data-testid="phone-number"]', validTestData.phoneNumber);
    await page.fill('[data-testid="email"]', validTestData.email);
    await page.fill('[data-testid="address"]', validTestData.address);
    await page.fill('[data-testid="age"]', validTestData.age);
    await page.click('[data-testid="next-button"]');

    // Fill minimal step 3
    await page.selectOption('[data-testid="instagram-level"]', 'TIDAK_MAHIR');
    await page.selectOption('[data-testid="facebook-level"]', 'TIDAK_MAHIR');
    await page.selectOption('[data-testid="tiktok-level"]', 'TIDAK_MAHIR');
    await page.click('[data-testid="next-button"]');

    // Step 4: Test JRM experience conditional field
    await expect(page.locator('[data-testid="jrm-products"]')).not.toBeVisible();

    // Check JRM experience
    await page.check('[data-testid="has-jrm-exp"]');

    // JRM products field should now be visible and required
    await expect(page.locator('[data-testid="jrm-products"]')).toBeVisible();
  });

  test('should display appropriate error messages for network failures', async ({ page }) => {
    // Mock network failure
    await page.route('/api/agent-application', route => {
      route.abort();
    });

    // Fill and submit complete form
    await page.check('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-button"]');

    // Fill all required fields quickly
    await page.fill('[data-testid="full-name"]', validTestData.fullName);
    await page.fill('[data-testid="ic-number"]', validTestData.icNumber);
    await page.fill('[data-testid="phone-number"]', validTestData.phoneNumber);
    await page.fill('[data-testid="email"]', validTestData.email);
    await page.fill('[data-testid="address"]', validTestData.address);
    await page.fill('[data-testid="age"]', validTestData.age);
    await page.click('[data-testid="next-button"]');

    await page.selectOption('[data-testid="instagram-level"]', 'TIDAK_MAHIR');
    await page.selectOption('[data-testid="facebook-level"]', 'TIDAK_MAHIR');
    await page.selectOption('[data-testid="tiktok-level"]', 'TIDAK_MAHIR');
    await page.click('[data-testid="next-button"]');

    await page.fill('[data-testid="reason-to-join"]', validTestData.reasonToJoin);
    await page.fill('[data-testid="expectations"]', validTestData.expectations);
    await page.click('[data-testid="next-button"]');

    await page.check('[data-testid="final-agreement"]');
    await page.click('[data-testid="submit-button"]');

    // Should show network error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    // Test keyboard navigation through form
    await page.keyboard.press('Tab'); // Focus terms checkbox
    await page.keyboard.press('Space'); // Check terms
    await page.keyboard.press('Tab'); // Focus next button
    await page.keyboard.press('Enter'); // Click next

    // Should be on step 2
    await expect(page.locator('[data-testid="step-indicator"]')).toContainText('2 of 5');

    // Test field navigation with Tab
    await page.keyboard.press('Tab'); // Focus first field
    await page.keyboard.type(validTestData.fullName);
    await page.keyboard.press('Tab'); // Next field
    await page.keyboard.type(validTestData.icNumber);
  });

  test('should validate social media handle formats', async ({ page }) => {
    // Navigate to step 3
    await page.check('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-button"]');

    // Fill minimal step 2 to proceed
    await page.fill('[data-testid="full-name"]', validTestData.fullName);
    await page.fill('[data-testid="ic-number"]', validTestData.icNumber);
    await page.fill('[data-testid="phone-number"]', validTestData.phoneNumber);
    await page.fill('[data-testid="email"]', validTestData.email);
    await page.fill('[data-testid="address"]', validTestData.address);
    await page.fill('[data-testid="age"]', validTestData.age);
    await page.click('[data-testid="next-button"]');

    // Test invalid Instagram handle
    await page.fill('[data-testid="instagram-handle"]', 'invalid handle with spaces');
    await page.blur('[data-testid="instagram-handle"]');
    await expect(page.locator('[data-testid="instagram-handle-error"]')).toContainText('Invalid format');

    // Test valid Instagram handle
    await page.fill('[data-testid="instagram-handle"]', 'valid_handle123');
    await page.blur('[data-testid="instagram-handle"]');
    await expect(page.locator('[data-testid="instagram-handle-error"]')).not.toBeVisible();
  });
});