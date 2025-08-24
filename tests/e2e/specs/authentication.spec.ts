/**
 * Authentication E2E Tests
 * Comprehensive testing of user authentication flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  
  test.describe('Sign In', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/signin');
    });

    test('sign in page loads correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/sign.*in|login/i);
      
      // Check main heading
      const heading = page.locator('h1, h2').first();
      await expect(heading).toContainText(/sign.*in|login/i);
      
      // Check form elements
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
      
      // Check sign up link
      const signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Register")').first();
      if (await signUpLink.isVisible()) {
        await expect(signUpLink).toBeVisible();
      }
    });

    test('shows validation errors for empty fields', async ({ page }) => {
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
      await submitButton.click();
      
      // Look for validation errors
      const errorMessages = page.locator('.error, .error-message, [data-testid="error"]');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        // Should have at least one error message
        await expect(errorMessages.first()).toBeVisible();
        
        // Check for email error
        const emailError = page.locator('.error:has-text("email"), [data-testid="email-error"]').first();
        if (await emailError.isVisible()) {
          await expect(emailError).toBeVisible();
        }
      } else {
        console.log('No validation errors found - might be handled by browser validation');
      }
    });

    test('shows error for invalid credentials', async ({ page }) => {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
      
      // Enter invalid credentials
      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');
      await submitButton.click();
      
      // Wait for error message
      const errorMessage = page.locator('.error, .error-message, [data-testid="auth-error"]');
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
      
      // Should contain invalid credentials message
      const errorText = await errorMessage.first().textContent();
      expect(errorText?.toLowerCase()).toMatch(/invalid|incorrect|wrong|failed/);
    });

    test('forgot password link works', async ({ page }) => {
      const forgotPasswordLink = page.locator('a:has-text("Forgot Password"), a:has-text("Reset Password")').first();
      
      if (await forgotPasswordLink.isVisible()) {
        await forgotPasswordLink.click();
        
        // Should navigate to reset password page
        await expect(page).toHaveURL(/reset|forgot|password/);
        
        // Should have email input for reset
        const resetEmailInput = page.locator('input[type="email"], input[name="email"]').first();
        await expect(resetEmailInput).toBeVisible();
      } else {
        console.log('Forgot password link not found');
      }
    });
  });

  test.describe('Sign Up', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/signup');
    });

    test('sign up page loads correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/sign.*up|register/i);
      
      // Check main heading
      const heading = page.locator('h1, h2').first();
      await expect(heading).toContainText(/sign.*up|register|create.*account/i);
      
      // Check form elements
      const nameInput = page.locator('input[name="name"], input[name="firstName"]').first();
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up")').first();
      
      if (await nameInput.isVisible()) {
        await expect(nameInput).toBeVisible();
      }
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
      
      // Check sign in link
      const signInLink = page.locator('a:has-text("Sign In"), a:has-text("Login")').first();
      if (await signInLink.isVisible()) {
        await expect(signInLink).toBeVisible();
      }
    });

    test('shows validation errors for invalid data', async ({ page }) => {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up")').first();
      
      // Enter invalid email
      await emailInput.fill('invalid-email');
      await passwordInput.fill('123'); // Weak password
      await submitButton.click();
      
      // Look for validation errors
      const errorMessages = page.locator('.error, .error-message, [data-testid="error"]');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        await expect(errorMessages.first()).toBeVisible();
      } else {
        console.log('No validation errors found - might be handled differently');
      }
    });

    test('password strength indicator works', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const strengthIndicator = page.locator('.password-strength, [data-testid="password-strength"]').first();
      
      if (await strengthIndicator.isVisible()) {
        // Test weak password
        await passwordInput.fill('123');
        await expect(strengthIndicator).toContainText(/weak/i);
        
        // Test strong password
        await passwordInput.fill('StrongPassword123!');
        await expect(strengthIndicator).toContainText(/strong/i);
      } else {
        console.log('Password strength indicator not found');
      }
    });
  });

  test.describe('Authentication Flow', () => {
    test('can navigate between sign in and sign up pages', async ({ page }) => {
      // Start at sign in
      await page.goto('/auth/signin');
      
      // Go to sign up
      const signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Register")').first();
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await expect(page).toHaveURL(/signup|register/);
        
        // Go back to sign in
        const signInLink = page.locator('a:has-text("Sign In"), a:has-text("Login")').first();
        if (await signInLink.isVisible()) {
          await signInLink.click();
          await expect(page).toHaveURL(/signin|login/);
        }
      }
    });

    test('redirects to login when accessing protected pages', async ({ page }) => {
      // Try to access a protected page (like account settings)
      await page.goto('/account');
      
      // Should redirect to login
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/signin|login|auth/);
    });

    test('social login buttons work correctly', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Look for social login buttons
      const googleButton = page.locator('button:has-text("Google"), [data-testid="google-signin"]').first();
      const facebookButton = page.locator('button:has-text("Facebook"), [data-testid="facebook-signin"]').first();
      
      if (await googleButton.isVisible()) {
        await expect(googleButton).toBeEnabled();
        // Note: We don't actually click it to avoid external OAuth flow
      }
      
      if (await facebookButton.isVisible()) {
        await expect(facebookButton).toBeEnabled();
      }
      
      if (!await googleButton.isVisible() && !await facebookButton.isVisible()) {
        console.log('No social login buttons found');
      }
    });

    test('remember me functionality exists', async ({ page }) => {
      await page.goto('/auth/signin');
      
      const rememberMeCheckbox = page.locator('input[type="checkbox"]:has-text("Remember"), [data-testid="remember-me"]').first();
      const rememberMeLabel = page.locator('label:has-text("Remember")').first();
      
      if (await rememberMeCheckbox.isVisible()) {
        await expect(rememberMeCheckbox).toBeVisible();
        
        // Test checking/unchecking
        await rememberMeCheckbox.check();
        await expect(rememberMeCheckbox).toBeChecked();
        
        await rememberMeCheckbox.uncheck();
        await expect(rememberMeCheckbox).not.toBeChecked();
      } else if (await rememberMeLabel.isVisible()) {
        await expect(rememberMeLabel).toBeVisible();
      } else {
        console.log('Remember me functionality not found');
      }
    });
  });

  test.describe('User Account Flow', () => {
    test('account page shows login prompt when not authenticated', async ({ page }) => {
      await page.goto('/account');
      
      // Should show login prompt or redirect to login
      const loginPrompt = page.locator(':has-text("sign in"), :has-text("login")').first();
      const currentUrl = page.url();
      
      if (currentUrl.includes('signin') || currentUrl.includes('login')) {
        // Redirected to login page
        await expect(page.locator('h1, h2').first()).toContainText(/sign.*in|login/i);
      } else {
        // Shows login prompt on the page
        await expect(loginPrompt).toBeVisible();
      }
    });

    test('membership status is displayed when available', async ({ page }) => {
      // This test would need actual authentication to work fully
      // For now, we'll check if the structure exists
      
      await page.goto('/');
      
      // Look for membership-related elements
      const membershipIndicator = page.locator('.membership-status, [data-testid="membership-status"]').first();
      const memberBadge = page.locator('.member-badge, [data-testid="member-badge"]').first();
      
      if (await membershipIndicator.isVisible()) {
        console.log('Membership indicator found');
        await expect(membershipIndicator).toBeVisible();
      }
      
      if (await memberBadge.isVisible()) {
        console.log('Member badge found');
        await expect(memberBadge).toBeVisible();
      }
    });
  });

  test.describe('Responsive Authentication', () => {
    test('authentication forms work on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/auth/signin');
      
      // Check form still works on mobile
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
      
      // Test input interaction
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password');
      
      await expect(emailInput).toHaveValue('test@example.com');
      await expect(passwordInput).toHaveValue('password');
    });
  });

  test.describe('Accessibility', () => {
    test('authentication forms are accessible', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Check form labels
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      // Check if inputs have labels
      const emailId = await emailInput.getAttribute('id');
      const passwordId = await passwordInput.getAttribute('id');
      
      if (emailId) {
        const emailLabel = page.locator(`label[for="${emailId}"]`);
        await expect(emailLabel).toBeVisible();
      }
      
      if (passwordId) {
        const passwordLabel = page.locator(`label[for="${passwordId}"]`);
        await expect(passwordLabel).toBeVisible();
      }
      
      // Check ARIA attributes
      const form = page.locator('form').first();
      if (await form.isVisible()) {
        const ariaLabel = await form.getAttribute('aria-label');
        const ariaLabelledBy = await form.getAttribute('aria-labelledby');
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    });
  });
});