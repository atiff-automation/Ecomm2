# E2E Testing Guide - JRM E-commerce Platform

## Overview

This document provides comprehensive guidance for running and maintaining end-to-end tests for the JRM E-commerce platform using Playwright.

## Test Structure

```
tests/
├── e2e/
│   ├── specs/                 # Test specifications
│   │   ├── homepage.spec.ts   # Homepage functionality
│   │   ├── products.spec.ts   # Product browsing and filtering
│   │   ├── cart.spec.ts       # Shopping cart operations
│   │   └── authentication.spec.ts # User authentication
│   └── setup/                 # Test setup and configuration
│       ├── global-setup.ts    # Global test setup
│       └── global-teardown.ts # Global test cleanup
```

## Quick Start

### Installation

```bash
# Install Playwright and dependencies
npm install @playwright/test --save-dev

# Install browser binaries
npx playwright install

# Install system dependencies (Linux only)
npx playwright install-deps
```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Run specific test file
npx playwright test tests/e2e/specs/homepage.spec.ts

# Run specific test by name
npx playwright test --grep "loads successfully"

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests on specific device
npx playwright test --project="Mobile Chrome"
```

## Test Configuration

### Environment Setup

Create `.env.test` file for test-specific configuration:

```bash
# Test environment variables
PLAYWRIGHT_BASE_URL=http://localhost:3000
DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/test_db"
NEXTAUTH_SECRET="test-secret-key"
NODE_ENV=test
```

### Browser Configuration

Tests run on multiple browsers and devices:
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Mobile Chrome, Mobile Safari
- **Tablets**: iPad, Android tablets (configurable)

## Test Categories

### 1. Homepage Tests (`homepage.spec.ts`)

**Coverage:**
- Page loading and basic elements
- Navigation functionality
- Search functionality
- Featured products display
- Responsive design
- Performance metrics
- Accessibility standards

**Key Features Tested:**
- Hero section visibility
- Navigation menu functionality
- Search input and results
- Product grid display
- Mobile menu behavior

### 2. Products Tests (`products.spec.ts`)

**Coverage:**
- Product listing page
- Search and filtering
- Sorting functionality
- Product card display
- Pagination
- Cart interactions
- SEO metadata

**Key Features Tested:**
- Product grid rendering
- Filter controls (category, sort, search)
- Add to cart functionality
- Pagination controls
- Mobile responsive design
- Loading states

### 3. Shopping Cart Tests (`cart.spec.ts`)

**Coverage:**
- Adding products to cart
- Cart display and management
- Quantity updates
- Item removal
- Cart totals calculation
- Checkout process
- Cart persistence

**Key Features Tested:**
- Product addition from various pages
- Quantity increase/decrease
- Remove item functionality
- Subtotal and total calculations
- Member pricing benefits
- Empty cart states

### 4. Authentication Tests (`authentication.spec.ts`)

**Coverage:**
- Sign in/up forms
- Form validation
- Error handling
- Social authentication
- Password reset
- Account access
- Responsive forms

**Key Features Tested:**
- Form input validation
- Authentication flows
- Error message display
- Redirect behavior
- Accessibility compliance

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/page-url');
  });

  test('should do something specific', async ({ page }) => {
    // Test implementation
    await page.locator('selector').click();
    await expect(page.locator('result')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Data Test IDs**
   ```typescript
   // Prefer data-testid over CSS selectors
   await page.locator('[data-testid="add-to-cart"]').click();
   ```

2. **Wait for Elements**
   ```typescript
   // Wait for elements to be visible
   await expect(page.locator('selector')).toBeVisible();
   ```

3. **Handle Dynamic Content**
   ```typescript
   // Wait for network requests
   await page.waitForLoadState('networkidle');
   ```

4. **Use Page Object Pattern**
   ```typescript
   // Create reusable page objects for complex interactions
   class ProductsPage {
     constructor(private page: Page) {}
     
     async addToCart(productId: string) {
       await this.page.locator(`[data-product-id="${productId}"] button`).click();
     }
   }
   ```

## Debugging Tests

### Visual Debugging

```bash
# Run with browser visible
npx playwright test --headed

# Debug specific test
npx playwright test --debug tests/e2e/specs/homepage.spec.ts
```

### Screenshots and Videos

Tests automatically capture:
- **Screenshots**: On failure
- **Videos**: On failure (retained)
- **Traces**: On retry

### Accessing Debug Artifacts

```bash
# View test report with artifacts
npx playwright show-report

# Open specific trace
npx playwright show-trace test-results/path/to/trace.zip
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Data Management

### Test Database

For comprehensive testing, consider:

1. **Separate Test Database**
   ```sql
   CREATE DATABASE jrm_ecommerce_test;
   ```

2. **Test Data Seeds**
   ```typescript
   // Setup test products, users, categories
   await prisma.product.createMany({
     data: testProducts
   });
   ```

3. **Cleanup Strategy**
   ```typescript
   // Clean up after tests
   afterEach(async () => {
     await prisma.user.deleteMany({
       where: { email: { contains: 'test-' } }
     });
   });
   ```

## Performance Testing

### Metrics Collection

```typescript
test('page loads within acceptable time', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/products');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(5000); // 5 seconds max
});
```

### Performance Assertions

- **Page Load**: < 5 seconds
- **API Responses**: < 2 seconds
- **Interactive Elements**: < 500ms

## Accessibility Testing

### Basic A11y Checks

```typescript
test('meets accessibility standards', async ({ page }) => {
  // Check heading hierarchy
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);
  
  // Check image alt text
  const images = page.locator('img');
  for (let i = 0; i < await images.count(); i++) {
    await expect(images.nth(i)).toHaveAttribute('alt');
  }
});
```

## Troubleshooting

### Common Issues

1. **Timeouts**
   ```typescript
   // Increase timeout for slow operations
   await expect(page.locator('selector')).toBeVisible({ timeout: 10000 });
   ```

2. **Flaky Tests**
   ```typescript
   // Add retry logic
   await page.waitForLoadState('networkidle');
   await page.waitForTimeout(1000); // Last resort
   ```

3. **Element Not Found**
   ```typescript
   // Use more specific selectors
   await page.locator('text=Exact Text').click();
   ```

### Debug Commands

```bash
# Show browser console
npx playwright test --headed --debug

# Trace viewer
npx playwright show-trace trace.zip

# Inspector mode
await page.pause(); // Add in test code
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   npm update @playwright/test
   npx playwright install
   ```

2. **Review Test Coverage**
   - Add tests for new features
   - Update tests for changed functionality
   - Remove obsolete tests

3. **Performance Monitoring**
   - Review test execution times
   - Optimize slow tests
   - Update performance thresholds

### Test Health Indicators

- **Pass Rate**: > 95%
- **Execution Time**: < 10 minutes total
- **Flakiness**: < 2% retry rate

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci-intro)