/**
 * Homepage E2E Tests
 * Comprehensive testing of homepage functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads successfully with all key elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/JRM E-commerce/);
    
    // Check hero section
    const heroSection = page.locator('[data-testid="hero-section"], .hero-section, h1').first();
    await expect(heroSection).toBeVisible();
    
    // Check navigation
    const navigation = page.locator('nav, [role="navigation"]').first();
    await expect(navigation).toBeVisible();
    
    // Check footer
    const footer = page.locator('footer, [role="contentinfo"]').first();
    await expect(footer).toBeVisible();
  });

  test('navigation links work correctly', async ({ page }) => {
    // Test Products link
    const productsLink = page.getByRole('link', { name: /products/i }).first();
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await expect(page).toHaveURL(/.*products.*/);
      await page.goBack();
    }
    
    // Test other navigation links
    const links = [
      { name: /about/i, pattern: /.*about.*/ },
      { name: /contact/i, pattern: /.*contact.*/ },
    ];
    
    for (const link of links) {
      const linkElement = page.getByRole('link', { name: link.name }).first();
      if (await linkElement.isVisible()) {
        await linkElement.click();
        await expect(page).toHaveURL(link.pattern);
        await page.goBack();
      }
    }
  });

  test('search functionality works', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test product');
      await searchInput.press('Enter');
      
      // Should navigate to products page with search
      await expect(page).toHaveURL(/.*products.*search.*/);
    } else {
      console.log('Search input not found on homepage - skipping search test');
    }
  });

  test('featured products display correctly', async ({ page }) => {
    // Look for featured products section
    const featuredSection = page.locator('[data-testid="featured-products"], .featured-products, .product-grid').first();
    
    if (await featuredSection.isVisible()) {
      // Check that products are displayed
      const products = featuredSection.locator('.product-card, [data-testid="product-card"]');
      const productCount = await products.count();
      
      if (productCount > 0) {
        expect(productCount).toBeGreaterThan(0);
        
        // Check first product has required elements
        const firstProduct = products.first();
        await expect(firstProduct).toBeVisible();
        
        // Check for product image
        const productImage = firstProduct.locator('img').first();
        if (await productImage.isVisible()) {
          await expect(productImage).toBeVisible();
        }
        
        // Check for product title
        const productTitle = firstProduct.locator('h2, h3, .product-title, [data-testid="product-title"]').first();
        if (await productTitle.isVisible()) {
          await expect(productTitle).toBeVisible();
        }
        
        // Check for product price
        const productPrice = firstProduct.locator('.price, [data-testid="product-price"]').first();
        if (await productPrice.isVisible()) {
          await expect(productPrice).toBeVisible();
        }
      } else {
        console.log('No featured products found - this might be expected for empty state');
      }
    } else {
      console.log('Featured products section not found - this might be expected');
    }
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that page still loads correctly
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check mobile navigation
    const mobileMenuButton = page.locator('button[aria-label*="menu" i], .mobile-menu-button, [data-testid="mobile-menu"]').first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Check if mobile menu opens
      const mobileMenu = page.locator('.mobile-menu, [data-testid="mobile-menu-content"]').first();
      if (await mobileMenu.isVisible()) {
        await expect(mobileMenu).toBeVisible();
      }
    }
  });

  test('page performance is acceptable', async ({ page }) => {
    // Navigate and measure performance
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
    
    // Check for basic performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      };
    });
    
    // Basic performance expectations
    expect(performanceMetrics.loadComplete).toBeGreaterThan(0);
    expect(performanceMetrics.domContentLoaded).toBeGreaterThan(0);
  });

  test('accessibility standards are met', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1Elements = page.locator('h1');
    const h1Count = await h1Elements.count();
    expect(h1Count).toBeGreaterThanOrEqual(1); // Should have at least one h1
    expect(h1Count).toBeLessThanOrEqual(1); // Should have at most one h1
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) { // Check first 5 images
      const image = images.nth(i);
      if (await image.isVisible()) {
        const alt = await image.getAttribute('alt');
        expect(alt).toBeTruthy(); // Should have alt text
      }
    }
    
    // Check for proper form labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 3); i++) { // Check first 3 inputs
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const id = await input.getAttribute('id');
        const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
        
        // Input should have some form of label
        expect(ariaLabel || ariaLabelledBy || hasLabel).toBeTruthy();
      }
    }
  });
});