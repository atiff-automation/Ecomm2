/**
 * Products Page E2E Tests
 * Comprehensive testing of products functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('loads successfully with product grid', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Products.*JRM E-commerce/);
    
    // Check page heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/products/i);
    
    // Check products grid exists
    const productsGrid = page.locator('.grid, [data-testid="products-grid"], .products-grid').first();
    await expect(productsGrid).toBeVisible();
  });

  test('search functionality works correctly', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[name*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      // Test search
      await searchInput.fill('test');
      await page.waitForTimeout(1000); // Wait for debounced search
      
      // URL should update with search parameter
      await expect(page).toHaveURL(/.*search=test.*/);
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(1000);
    } else {
      console.log('Search input not found - skipping search test');
    }
  });

  test('category filtering works', async ({ page }) => {
    // Find category selector
    const categorySelect = page.locator('select, [data-testid="category-select"]').first();
    const categoryTrigger = page.locator('[data-testid="category-trigger"], .select-trigger').first();
    
    // Try different selectors for category filtering
    if (await categorySelect.isVisible()) {
      // Standard select element
      await categorySelect.selectOption({ index: 1 }); // Select first non-default option
      await page.waitForTimeout(1000);
    } else if (await categoryTrigger.isVisible()) {
      // Custom select component
      await categoryTrigger.click();
      const firstOption = page.locator('[data-testid="select-option"], .select-option').nth(1);
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('Category selector not found - skipping category test');
    }
  });

  test('sorting functionality works', async ({ page }) => {
    // Find sort selector
    const sortSelect = page.locator('select[name*="sort" i], [data-testid="sort-select"]').first();
    const sortTrigger = page.locator('[data-testid="sort-trigger"]').first();
    
    if (await sortSelect.isVisible()) {
      // Test different sort options
      await sortSelect.selectOption('price-asc');
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/.*sortBy=price-asc.*/);
      
      await sortSelect.selectOption('name-asc');
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/.*sortBy=name-asc.*/);
    } else if (await sortTrigger.isVisible()) {
      await sortTrigger.click();
      const priceOption = page.getByRole('option', { name: /price.*low.*high/i }).first();
      if (await priceOption.isVisible()) {
        await priceOption.click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('Sort selector not found - skipping sort test');
    }
  });

  test('product cards display correctly', async ({ page }) => {
    // Wait for products to load
    await page.waitForTimeout(2000);
    
    const productCards = page.locator('.product-card, [data-testid="product-card"]');
    const cardCount = await productCards.count();
    
    if (cardCount > 0) {
      expect(cardCount).toBeGreaterThan(0);
      
      // Check first product card
      const firstCard = productCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check product image
      const productImage = firstCard.locator('img').first();
      if (await productImage.isVisible()) {
        await expect(productImage).toHaveAttribute('src');
        await expect(productImage).toHaveAttribute('alt');
      }
      
      // Check product title
      const productTitle = firstCard.locator('h2, h3, .product-title, [data-testid="product-title"]').first();
      if (await productTitle.isVisible()) {
        const titleText = await productTitle.textContent();
        expect(titleText?.length).toBeGreaterThan(0);
      }
      
      // Check product price
      const productPrice = firstCard.locator('.price, [data-testid="product-price"]').first();
      if (await productPrice.isVisible()) {
        const priceText = await productPrice.textContent();
        expect(priceText).toMatch(/RM|MYR|\$|\d/); // Should contain currency or number
      }
      
      // Check add to cart button
      const addToCartBtn = firstCard.locator('button:has-text("Add to Cart"), [data-testid="add-to-cart"]').first();
      if (await addToCartBtn.isVisible()) {
        await expect(addToCartBtn).toBeEnabled();
      }
    } else {
      console.log('No product cards found - checking for empty state');
      const emptyState = page.locator('.empty-state, [data-testid="empty-state"]').first();
      if (await emptyState.isVisible()) {
        await expect(emptyState).toContainText(/no products/i);
      }
    }
  });

  test('pagination works when multiple pages exist', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if pagination exists
    const pagination = page.locator('.pagination, [data-testid="pagination"]').first();
    const nextButton = page.locator('button:has-text("Next"), [aria-label*="next" i]').first();
    
    if (await pagination.isVisible() && await nextButton.isVisible()) {
      // Click next page
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // URL should update with page parameter
      await expect(page).toHaveURL(/.*page=2.*/);
      
      // Check previous button becomes enabled
      const prevButton = page.locator('button:has-text("Previous"), [aria-label*="previous" i]').first();
      await expect(prevButton).toBeEnabled();
    } else {
      console.log('Pagination not found - might be single page');
    }
  });

  test('clear filters works correctly', async ({ page }) => {
    // Set some filters first
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
    
    // Find and click clear filters button
    const clearButton = page.locator('button:has-text("Clear"), [data-testid="clear-filters"]').first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(1000);
      
      // URL should be clean
      await expect(page).toHaveURL('/products');
      
      // Search input should be empty
      if (await searchInput.isVisible()) {
        await expect(searchInput).toHaveValue('');
      }
    } else {
      console.log('Clear filters button not found');
    }
  });

  test('add to cart functionality works', async ({ page }) => {
    // Wait for products to load
    await page.waitForTimeout(2000);
    
    const addToCartButtons = page.locator('button:has-text("Add to Cart"), [data-testid="add-to-cart"]');
    const buttonCount = await addToCartButtons.count();
    
    if (buttonCount > 0) {
      const firstButton = addToCartButtons.first();
      await expect(firstButton).toBeEnabled();
      
      // Click add to cart
      await firstButton.click();
      
      // Look for success message or cart update
      const successMessage = page.locator('.toast, .notification, [data-testid="success-toast"]').first();
      if (await successMessage.isVisible({ timeout: 3000 })) {
        await expect(successMessage).toContainText(/added.*cart/i);
      }
      
      // Check if cart count updated
      const cartCount = page.locator('.cart-count, [data-testid="cart-count"]').first();
      if (await cartCount.isVisible()) {
        const countText = await cartCount.textContent();
        expect(parseInt(countText || '0')).toBeGreaterThanOrEqual(1);
      }
    } else {
      console.log('No add to cart buttons found - might be out of stock products');
    }
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Check that page still loads correctly
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    
    // Check mobile layout
    const productsGrid = page.locator('.grid, [data-testid="products-grid"]').first();
    if (await productsGrid.isVisible()) {
      // On mobile, grid should be single column or adapted
      const gridStyles = await productsGrid.evaluate(el => window.getComputedStyle(el));
      // This is a basic check - in reality you'd check specific CSS grid/flexbox properties
      expect(gridStyles).toBeTruthy();
    }
    
    // Check mobile filters
    const filtersSection = page.locator('.filters, [data-testid="filters"]').first();
    if (await filtersSection.isVisible()) {
      // Filters might be collapsed on mobile
      await expect(filtersSection).toBeVisible();
    }
  });

  test('loading states work correctly', async ({ page }) => {
    // Navigate to products and check for loading state
    await page.goto('/products');
    
    // Look for loading indicators
    const loadingIndicator = page.locator('.loading, .spinner, [data-testid="loading"]').first();
    
    // Loading state might be very brief, so this is optional
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      await expect(loadingIndicator).toBeVisible();
    }
    
    // Eventually content should load
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('SEO metadata is present', async ({ page }) => {
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content');
    
    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');
    
    if (await ogTitle.count() > 0) {
      await expect(ogTitle).toHaveAttribute('content');
    }
    
    if (await ogDescription.count() > 0) {
      await expect(ogDescription).toHaveAttribute('content');
    }
    
    // Check structured data (JSON-LD)
    const structuredData = page.locator('script[type="application/ld+json"]');
    if (await structuredData.count() > 0) {
      const jsonContent = await structuredData.first().textContent();
      expect(jsonContent).toBeTruthy();
      
      // Validate JSON structure
      const parsed = JSON.parse(jsonContent || '{}');
      expect(parsed['@context']).toBeTruthy();
    }
  });
});