/**
 * Global Playwright Setup
 * Configures test environment before all tests run
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');

  // Create a browser instance for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the application to be ready
    const baseURL = config.webServer?.url || config.use?.baseURL || 'http://localhost:3000';
    console.log(`🔗 Checking application readiness at ${baseURL}`);
    
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Verify homepage loads
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Application is ready for testing');

    // Set up test data if needed
    await setupTestData(page, baseURL);

    // Save authentication states for faster test execution
    await setupAuthStates(context, baseURL);

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('✅ Global E2E test setup completed');
}

async function setupTestData(page: any, baseURL: string) {
  console.log('📊 Setting up test data...');
  
  // TODO: Add test data setup if needed
  // This could include:
  // - Creating test users
  // - Adding test products
  // - Setting up test categories
  
  console.log('✅ Test data setup completed');
}

async function setupAuthStates(context: any, baseURL: string) {
  console.log('🔐 Setting up authentication states...');
  
  const page = await context.newPage();
  
  try {
    // Setup authenticated user state
    await page.goto(`${baseURL}/auth/signin`);
    
    // TODO: Add actual login if test credentials are available
    // For now, we'll skip this and handle auth per test
    
    // Save the signed-in state for reuse
    // await context.storageState({ path: path.join(__dirname, '../auth/user.json') });
    
  } catch (error) {
    console.warn('⚠️ Could not set up auth states (this is OK for now):', error.message);
  } finally {
    await page.close();
  }
  
  console.log('✅ Authentication states setup completed');
}

export default globalSetup;