/**
 * Agent Application Admin Workflow E2E Tests
 * End-to-end testing of admin operations for agent applications
 * Following CLAUDE.md principles: Systematic testing, comprehensive validation
 */

import { test, expect } from '@playwright/test';

// Test application data
const mockApplication = {
  id: 'app-test-123',
  fullName: 'Ahmad bin Abdullah',
  email: 'ahmad.test@example.com',
  phoneNumber: '+60123456789',
  icNumber: '901020-01-1234',
  status: 'SUBMITTED',
  submittedAt: new Date().toISOString()
};

test.describe('Agent Application Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      // Mock session storage for admin user
      window.localStorage.setItem('next-auth.session-token', 'mock-admin-token');
    });

    // Mock API responses for admin operations
    await page.route('/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin-123',
            email: 'admin@jrm.com',
            name: 'Admin User',
            role: 'ADMIN'
          }
        })
      });
    });

    // Navigate to admin applications page
    await page.goto('/admin/agents/applications');
  });

  test('should display applications list with proper filtering', async ({ page }) => {
    // Mock applications API response
    await page.route('/api/admin/agent-applications*', route => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');

      let applications = [mockApplication];

      // Apply filters
      if (status && status !== mockApplication.status) {
        applications = [];
      }
      if (search && !mockApplication.fullName.toLowerCase().includes(search.toLowerCase())) {
        applications = [];
      }

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applications,
          pagination: {
            page: 1,
            limit: 10,
            total: applications.length,
            totalPages: 1
          }
        })
      });
    });

    await test.step('Should load applications list', async () => {
      await expect(page.locator('h1')).toContainText('Agent Applications');
      await expect(page.locator('[data-testid="applications-table"]')).toBeVisible();

      // Should show at least one application
      await expect(page.locator('[data-testid="application-row"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="application-name"]').first()).toContainText(mockApplication.fullName);
    });

    await test.step('Should filter by status', async () => {
      // Change status filter
      await page.selectOption('[data-testid="status-filter"]', 'APPROVED');

      // Should show no results since mock application is SUBMITTED
      await expect(page.locator('[data-testid="application-row"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="no-results"]')).toContainText('No applications found');

      // Reset filter
      await page.selectOption('[data-testid="status-filter"]', 'ALL');
      await expect(page.locator('[data-testid="application-row"]')).toHaveCount(1);
    });

    await test.step('Should search by name', async () => {
      // Search for application
      await page.fill('[data-testid="search-input"]', 'Ahmad');
      await page.keyboard.press('Enter');

      // Should show matching result
      await expect(page.locator('[data-testid="application-row"]')).toHaveCount(1);

      // Search for non-existent name
      await page.fill('[data-testid="search-input"]', 'Nonexistent');
      await page.keyboard.press('Enter');

      // Should show no results
      await expect(page.locator('[data-testid="application-row"]')).toHaveCount(0);
    });
  });

  test('should allow viewing application details', async ({ page }) => {
    // Mock applications list API
    await page.route('/api/admin/agent-applications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applications: [mockApplication],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        })
      });
    });

    // Mock individual application API
    await page.route(`/api/admin/agent-applications/${mockApplication.id}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockApplication,
          address: 'No. 123, Jalan Utama, Taman Indah, 50100 Kuala Lumpur',
          age: 35,
          hasBusinessExp: true,
          businessLocation: 'Kuala Lumpur',
          instagramHandle: 'ahmad_entrepreneur',
          reasonToJoin: 'Ingin mengembangkan perniagaan',
          expectations: 'Mencapai tahap agent platinum',
          reviews: []
        })
      });
    });

    await test.step('Should navigate to application detail', async () => {
      // Click on application row
      await page.click('[data-testid="application-row"]');

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/admin\/agents\/applications\/app-test-123/);
      await expect(page.locator('h1')).toContainText(`Application: ${mockApplication.fullName}`);
    });

    await test.step('Should display application details', async () => {
      // Check that all sections are visible
      await expect(page.locator('[data-testid="basic-info-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-info-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="social-media-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="additional-info-section"]')).toBeVisible();

      // Verify specific details
      await expect(page.locator('[data-testid="detail-full-name"]')).toContainText(mockApplication.fullName);
      await expect(page.locator('[data-testid="detail-email"]')).toContainText(mockApplication.email);
      await expect(page.locator('[data-testid="detail-phone"]')).toContainText(mockApplication.phoneNumber);
      await expect(page.locator('[data-testid="detail-ic-number"]')).toContainText(mockApplication.icNumber);
    });
  });

  test('should allow approving an application', async ({ page }) => {
    // Mock applications list and detail APIs
    await page.route('/api/admin/agent-applications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applications: [mockApplication],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        })
      });
    });

    await page.route(`/api/admin/agent-applications/${mockApplication.id}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApplication)
      });
    });

    // Mock status update API
    await page.route(`/api/admin/agent-applications/${mockApplication.id}/status`, route => {
      expect(route.request().method()).toBe('PUT');
      const postData = route.request().postDataJSON();
      expect(postData.status).toBe('APPROVED');

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Application approved successfully'
        })
      });
    });

    await test.step('Should approve application', async () => {
      // Navigate to application detail
      await page.click('[data-testid="application-row"]');

      // Click approve button
      await page.click('[data-testid="approve-button"]');

      // Fill approval dialog
      await expect(page.locator('[data-testid="status-update-dialog"]')).toBeVisible();
      await page.fill('[data-testid="admin-notes"]', 'Application approved based on excellent credentials');
      await page.click('[data-testid="confirm-approve"]');

      // Should show success message
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Application approved successfully');
    });
  });

  test('should allow rejecting an application', async ({ page }) => {
    // Similar setup as approve test
    await page.route('/api/admin/agent-applications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applications: [mockApplication],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        })
      });
    });

    await page.route(`/api/admin/agent-applications/${mockApplication.id}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApplication)
      });
    });

    // Mock rejection API
    await page.route(`/api/admin/agent-applications/${mockApplication.id}/status`, route => {
      const postData = route.request().postDataJSON();
      expect(postData.status).toBe('REJECTED');

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Application rejected'
        })
      });
    });

    await test.step('Should reject application', async () => {
      // Navigate to application detail
      await page.click('[data-testid="application-row"]');

      // Click reject button
      await page.click('[data-testid="reject-button"]');

      // Fill rejection dialog
      await expect(page.locator('[data-testid="status-update-dialog"]')).toBeVisible();
      await page.fill('[data-testid="admin-notes"]', 'Application rejected due to insufficient experience');
      await page.click('[data-testid="confirm-reject"]');

      // Should show success message
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Application rejected');
    });
  });

  test('should validate admin notes are required for status changes', async ({ page }) => {
    // Setup mocks
    await page.route('/api/admin/agent-applications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applications: [mockApplication],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        })
      });
    });

    await page.route(`/api/admin/agent-applications/${mockApplication.id}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApplication)
      });
    });

    await test.step('Should require admin notes for approval', async () => {
      // Navigate to application detail
      await page.click('[data-testid="application-row"]');

      // Try to approve without notes
      await page.click('[data-testid="approve-button"]');
      await page.click('[data-testid="confirm-approve"]');

      // Should show validation error
      await expect(page.locator('[data-testid="notes-error"]')).toContainText('Admin notes are required');
    });
  });

  test('should support bulk operations', async ({ page }) => {
    // Mock multiple applications
    const multipleApplications = [
      { ...mockApplication, id: 'app-1', fullName: 'Ahmad bin Abdullah' },
      { ...mockApplication, id: 'app-2', fullName: 'Siti Nurhaliza' },
      { ...mockApplication, id: 'app-3', fullName: 'Tan Wei Ming' }
    ];

    await page.route('/api/admin/agent-applications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applications: multipleApplications,
          pagination: { page: 1, limit: 10, total: 3, totalPages: 1 }
        })
      });
    });

    // Mock bulk action API
    await page.route('/api/admin/agent-applications/bulk-action', route => {
      const postData = route.request().postDataJSON();
      expect(postData.action).toBe('approve');
      expect(postData.applicationIds).toHaveLength(2);

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Bulk operation completed: 2 successful, 0 failed',
          successes: 2,
          failures: 0
        })
      });
    });

    await test.step('Should perform bulk approval', async () => {
      // Select multiple applications
      await page.check('[data-testid="select-app-1"]');
      await page.check('[data-testid="select-app-2"]');

      // Click bulk approve
      await page.click('[data-testid="bulk-approve-button"]');

      // Fill bulk action dialog
      await expect(page.locator('[data-testid="bulk-action-dialog"]')).toBeVisible();
      await page.fill('[data-testid="bulk-notes"]', 'Bulk approval for qualified candidates');
      await page.click('[data-testid="confirm-bulk-action"]');

      // Should show success message
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Bulk operation completed: 2 successful, 0 failed');
    });
  });

  test('should handle pagination correctly', async ({ page }) => {
    // Mock paginated response
    await page.route('/api/admin/agent-applications*', route => {
      const url = new URL(route.request().url());
      const page_param = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      // Simulate 25 total applications
      const totalApplications = 25;
      const totalPages = Math.ceil(totalApplications / limit);
      const startIndex = (page_param - 1) * limit;
      const endIndex = Math.min(startIndex + limit, totalApplications);

      const applications = Array.from({ length: endIndex - startIndex }, (_, i) => ({
        ...mockApplication,
        id: `app-${startIndex + i + 1}`,
        fullName: `Applicant ${startIndex + i + 1}`
      }));

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applications,
          pagination: {
            page: page_param,
            limit,
            total: totalApplications,
            totalPages
          }
        })
      });
    });

    await test.step('Should display pagination controls', async () => {
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-page"]')).toContainText('1');
      await expect(page.locator('[data-testid="total-pages"]')).toContainText('3');
    });

    await test.step('Should navigate to next page', async () => {
      await page.click('[data-testid="next-page"]');
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2');

      // Should show different applications
      await expect(page.locator('[data-testid="application-name"]').first()).toContainText('Applicant 11');
    });

    await test.step('Should navigate to previous page', async () => {
      await page.click('[data-testid="prev-page"]');
      await expect(page.locator('[data-testid="current-page"]')).toContainText('1');

      // Should show first page applications
      await expect(page.locator('[data-testid="application-name"]').first()).toContainText('Applicant 1');
    });
  });

  test('should export applications data', async ({ page }) => {
    // Mock applications list
    await page.route('/api/admin/agent-applications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applications: [mockApplication],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        })
      });
    });

    // Mock export API
    await page.route('/api/admin/agent-applications/export', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers: {
          'Content-Disposition': 'attachment; filename=agent-applications.xlsx'
        },
        body: Buffer.from('mock excel data')
      });
    });

    await test.step('Should export applications', async () => {
      // Start download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-button"]');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('agent-applications.xlsx');
    });
  });

  test('should display application statistics', async ({ page }) => {
    // Mock statistics API
    await page.route('/api/admin/agent-applications/stats', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total: 150,
          submitted: 45,
          underReview: 12,
          approved: 78,
          rejected: 15,
          thisMonth: 23,
          lastMonth: 31,
          growthRate: -25.8
        })
      });
    });

    await test.step('Should display statistics dashboard', async () => {
      await expect(page.locator('[data-testid="stats-total"]')).toContainText('150');
      await expect(page.locator('[data-testid="stats-submitted"]')).toContainText('45');
      await expect(page.locator('[data-testid="stats-approved"]')).toContainText('78');
      await expect(page.locator('[data-testid="stats-rejected"]')).toContainText('15');

      // Growth rate (negative should be red)
      await expect(page.locator('[data-testid="stats-growth"]')).toContainText('-25.8%');
      await expect(page.locator('[data-testid="stats-growth"]')).toHaveClass(/text-red/);
    });
  });

  test('should require appropriate admin permissions', async ({ page }) => {
    // Test unauthorized access
    await page.route('/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Regular User',
            role: 'USER' // Not admin
          }
        })
      });
    });

    await test.step('Should redirect non-admin users', async () => {
      await page.goto('/admin/agents/applications');

      // Should redirect to unauthorized page or login
      await expect(page).toHaveURL(/\/auth\/signin|\/unauthorized/);
    });
  });
});