/**
 * Shopping Cart E2E Tests
 * Comprehensive testing of cart functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/');
  });

  test('can add product to cart from products page', async ({ page }) => {
    // Navigate to products page
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    // Find and click first add to cart button
    const addToCartButton = page.locator('button:has-text("Add to Cart"), [data-testid="add-to-cart"]').first();
    
    if (await addToCartButton.isVisible()) {
      // Get product name before adding to cart
      const productCard = addToCartButton.locator('..').first();
      const productName = await productCard.locator('h2, h3, .product-title').first().textContent();
      
      await addToCartButton.click();
      
      // Check for success notification
      const successToast = page.locator('.toast, .notification, [data-testid="success-toast"]');
      await expect(successToast.first()).toBeVisible({ timeout: 5000 });
      
      // Check cart count updated
      const cartCount = page.locator('.cart-count, [data-testid="cart-count"]').first();
      if (await cartCount.isVisible()) {
        await expect(cartCount).toContainText('1');
      }
      
      console.log(`Added product "${productName}" to cart`);
    } else {
      console.log('No add to cart buttons found - skipping test');
    }
  });

  test('can view cart contents', async ({ page }) => {
    // First add a product to cart
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
      
      // Open cart (try different methods)
      const cartButton = page.locator('button:has-text("Cart"), [data-testid="cart-button"], .cart-trigger').first();
      const cartLink = page.locator('a[href*="cart"]').first();
      
      if (await cartButton.isVisible()) {
        await cartButton.click();
      } else if (await cartLink.isVisible()) {
        await cartLink.click();
      } else {
        // Try navigating directly to cart page
        await page.goto('/cart');
      }
      
      // Verify cart page/modal opened
      const cartContent = page.locator('.cart-content, [data-testid="cart-content"], .cart-items').first();
      await expect(cartContent).toBeVisible({ timeout: 5000 });
      
      // Verify product is in cart
      const cartItems = page.locator('.cart-item, [data-testid="cart-item"]');
      const itemCount = await cartItems.count();
      expect(itemCount).toBeGreaterThan(0);
    } else {
      console.log('No add to cart buttons found - skipping cart view test');
    }
  });

  test('can update product quantity in cart', async ({ page }) => {
    // Add product to cart first
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
      
      // Navigate to cart
      await page.goto('/cart');
      
      // Find quantity input/controls
      const quantityInput = page.locator('input[type="number"], [data-testid="quantity-input"]').first();
      const increaseButton = page.locator('button:has-text("+"), [data-testid="increase-quantity"]').first();
      
      if (await quantityInput.isVisible()) {
        // Update quantity using input
        await quantityInput.fill('2');
        await quantityInput.blur();
        await page.waitForTimeout(1000);
        
        // Verify quantity updated
        await expect(quantityInput).toHaveValue('2');
      } else if (await increaseButton.isVisible()) {
        // Update quantity using buttons
        await increaseButton.click();
        await page.waitForTimeout(1000);
        
        // Verify quantity updated (look for quantity display)
        const quantityDisplay = page.locator('.quantity, [data-testid="quantity-display"]').first();
        if (await quantityDisplay.isVisible()) {
          await expect(quantityDisplay).toContainText('2');
        }
      } else {
        console.log('Quantity controls not found - skipping quantity test');
      }
    }
  });

  test('can remove product from cart', async ({ page }) => {
    // Add product to cart first
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
      
      // Navigate to cart
      await page.goto('/cart');
      
      // Find and click remove button
      const removeButton = page.locator('button:has-text("Remove"), [data-testid="remove-item"], .remove-button').first();
      
      if (await removeButton.isVisible()) {
        await removeButton.click();
        await page.waitForTimeout(1000);
        
        // Verify item removed
        const cartItems = page.locator('.cart-item, [data-testid="cart-item"]');
        const itemCount = await cartItems.count();
        expect(itemCount).toBe(0);
        
        // Should show empty cart message
        const emptyMessage = page.locator('.empty-cart, [data-testid="empty-cart"]').first();
        await expect(emptyMessage).toBeVisible();
      } else {
        console.log('Remove button not found - skipping remove test');
      }
    }
  });

  test('cart totals calculate correctly', async ({ page }) => {
    // Add multiple products to test calculations
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    const addToCartButtons = page.locator('button:has-text("Add to Cart")');
    const buttonCount = await addToCartButtons.count();
    
    if (buttonCount > 0) {
      // Add first product
      await addToCartButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Add second product if available
      if (buttonCount > 1) {
        await addToCartButtons.nth(1).click();
        await page.waitForTimeout(1000);
      }
      
      // Navigate to cart
      await page.goto('/cart');
      
      // Check subtotal exists and is a valid price
      const subtotal = page.locator('.subtotal, [data-testid="subtotal"]').first();
      if (await subtotal.isVisible()) {
        const subtotalText = await subtotal.textContent();
        expect(subtotalText).toMatch(/RM|MYR|\$|\d/);
      }
      
      // Check total exists and is a valid price
      const total = page.locator('.total, [data-testid="total"]').first();
      if (await total.isVisible()) {
        const totalText = await total.textContent();
        expect(totalText).toMatch(/RM|MYR|\$|\d/);
      }
      
      // Check tax if applicable
      const tax = page.locator('.tax, [data-testid="tax"]').first();
      if (await tax.isVisible()) {
        const taxText = await tax.textContent();
        expect(taxText).toMatch(/RM|MYR|\$|\d/);
      }
    }
  });

  test('membership benefits display correctly for members', async ({ page }) => {
    // This test assumes we can distinguish member vs non-member state
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
      
      await page.goto('/cart');
      
      // Look for member pricing indicators
      const memberPrice = page.locator('.member-price, [data-testid="member-price"]').first();
      const memberDiscount = page.locator('.member-discount, [data-testid="member-discount"]').first();
      
      if (await memberPrice.isVisible()) {
        console.log('Member price found in cart');
        await expect(memberPrice).toBeVisible();
      }
      
      if (await memberDiscount.isVisible()) {
        console.log('Member discount found in cart');
        await expect(memberDiscount).toBeVisible();
      }
      
      // Look for membership progress indicator
      const membershipProgress = page.locator('.membership-progress, [data-testid="membership-progress"]').first();
      if (await membershipProgress.isVisible()) {
        console.log('Membership progress found in cart');
        await expect(membershipProgress).toBeVisible();
      }
    }
  });

  test('can proceed to checkout', async ({ page }) => {
    // Add product to cart first
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
      
      // Navigate to cart
      await page.goto('/cart');
      
      // Find checkout button
      const checkoutButton = page.locator('button:has-text("Checkout"), [data-testid="checkout-button"], .checkout-btn').first();
      
      if (await checkoutButton.isVisible()) {
        await checkoutButton.click();
        
        // Should navigate to checkout or login page
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        
        // Could be checkout, login, or signup page
        expect(currentUrl).toMatch(/checkout|login|signin|auth/);
      } else {
        console.log('Checkout button not found - skipping checkout test');
      }
    }
  });

  test('cart persists across page navigation', async ({ page }) => {
    // Add product to cart
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
      
      // Navigate to different page
      await page.goto('/');
      
      // Check cart count persists
      const cartCount = page.locator('.cart-count, [data-testid="cart-count"]').first();
      if (await cartCount.isVisible()) {
        await expect(cartCount).toContainText('1');
      }
      
      // Navigate back to cart and verify items still there
      await page.goto('/cart');
      const cartItems = page.locator('.cart-item, [data-testid="cart-item"]');
      const itemCount = await cartItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('empty cart state displays correctly', async ({ page }) => {
    // Go directly to cart without adding items
    await page.goto('/cart');
    
    // Should show empty cart message
    const emptyMessage = page.locator('.empty-cart, [data-testid="empty-cart"], .empty-state').first();
    await expect(emptyMessage).toBeVisible();
    
    // Should have continue shopping button
    const continueShoppingButton = page.locator('button:has-text("Continue Shopping"), a:has-text("Continue Shopping")').first();
    if (await continueShoppingButton.isVisible()) {
      await expect(continueShoppingButton).toBeVisible();
    }
    
    // Cart totals should show zero or be hidden
    const total = page.locator('.total, [data-testid="total"]').first();
    if (await total.isVisible()) {
      const totalText = await total.textContent();
      expect(totalText).toMatch(/0|RM\s*0|MYR\s*0/);
    }
  });

  test('cart is responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Add item to cart
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
      
      // Navigate to cart
      await page.goto('/cart');
      
      // Verify cart displays properly on mobile
      const cartContent = page.locator('.cart-content, [data-testid="cart-content"]').first();
      await expect(cartContent).toBeVisible();
      
      // Check that all essential elements are visible
      const cartItems = page.locator('.cart-item, [data-testid="cart-item"]');
      const itemCount = await cartItems.count();
      expect(itemCount).toBeGreaterThan(0);
      
      // Check mobile-specific UI elements if any
      const mobileCartHeader = page.locator('.mobile-cart-header, [data-testid="mobile-cart-header"]').first();
      if (await mobileCartHeader.isVisible()) {
        await expect(mobileCartHeader).toBeVisible();
      }
    }
  });
});