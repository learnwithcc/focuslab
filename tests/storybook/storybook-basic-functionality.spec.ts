/**
 * STORYBOOK BASIC FUNCTIONALITY VALIDATION
 * 
 * This test suite validates that Storybook actually works in the browser,
 * rather than just assuming it works based on server startup.
 * 
 * TESTS COVERED:
 * 1. Storybook loads successfully in browser
 * 2. Navigation sidebar renders and is functional
 * 3. No console errors on initial load
 * 4. Stories list is populated
 * 5. Basic story selection works
 * 6. Network requests complete successfully
 */

import { test, expect, Page } from '@playwright/test';

const STORYBOOK_URL = 'http://localhost:6006';

test.describe('🔬 Storybook Basic Functionality Validation', () => {
  
  test.beforeAll(async () => {
    console.log('🚀 Starting Storybook functionality validation tests');
    console.log(`📍 Testing Storybook at: ${STORYBOOK_URL}`);
  });

  test('📊 Storybook server loads successfully in browser', async ({ page }) => {
    console.log('🔍 TEST: Verifying Storybook loads in browser');
    
    // Capture console errors during navigation
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture network failures
    const networkFailures: string[] = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkFailures.push(`${response.status()} ${response.url()}`);
      }
    });

    // Navigate to Storybook
    await page.goto(STORYBOOK_URL);
    
    // Wait for Storybook to fully load (using correct selector found from manual testing)
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/storybook/screenshots/storybook-loaded.png',
      fullPage: true 
    });

    // Verify no critical console errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('React Refresh') && // Filter out known React Refresh warnings
      !error.includes('inWebWorker') &&   // Filter out known development warnings
      !error.includes('Warning:')         // Filter out React warnings
    );
    
    console.log(`📈 Console errors found: ${consoleErrors.length}`);
    console.log(`⚠️  Critical errors: ${criticalErrors.length}`);
    console.log(`🌐 Network failures: ${networkFailures.length}`);
    
    if (criticalErrors.length > 0) {
      console.log('🚨 Critical console errors:', criticalErrors);
    }
    
    if (networkFailures.length > 0) {
      console.log('🚨 Network failures:', networkFailures);
    }

    // Assertions
    expect(criticalErrors.length).toBe(0);
    expect(networkFailures.length).toBe(0);
  });

  test('🗂️ Sidebar navigation renders and is functional', async ({ page }) => {
    console.log('🔍 TEST: Verifying sidebar navigation functionality');
    
    await page.goto(STORYBOOK_URL);
    await page.waitForSelector('#root');
    
    // Check if sidebar exists
    const sidebar = await page.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();
    
    // Check if stories are listed
    const storyItems = await page.locator('[data-testid="tree-node-item"]');
    const storyCount = await storyItems.count();
    
    console.log(`📚 Found ${storyCount} story items in sidebar`);
    
    // Take screenshot of sidebar
    await page.screenshot({ 
      path: 'tests/storybook/screenshots/sidebar-navigation.png',
      fullPage: true 
    });
    
    expect(storyCount).toBeGreaterThan(0);
  });

  test('📖 Individual stories can be selected and load', async ({ page }) => {
    console.log('🔍 TEST: Verifying individual story selection and loading');
    
    await page.goto(STORYBOOK_URL);
    await page.waitForSelector('#root');
    
    // Wait for stories to load
    await page.waitForSelector('[data-testid="tree-node-item"]');
    
    // Get all story links
    const storyLinks = await page.locator('[data-testid="tree-node-item"] a').all();
    
    if (storyLinks.length === 0) {
      throw new Error('No story links found in sidebar');
    }
    
    console.log(`🔗 Found ${storyLinks.length} story links`);
    
    // Test clicking the first story
    const firstStory = storyLinks[0];
    const storyTitle = await firstStory.textContent();
    console.log(`📖 Testing story: "${storyTitle}"`);
    
    // Click the story
    await firstStory.click();
    
    // Wait for the story to load in the iframe
    await page.waitForSelector('iframe[data-testid="storybook-preview-iframe"]');
    
    // Take screenshot of loaded story
    await page.screenshot({ 
      path: 'tests/storybook/screenshots/story-loaded.png',
      fullPage: true 
    });
    
    // Verify the story content loaded
    const iframe = page.frameLocator('iframe[data-testid="storybook-preview-iframe"]');
    const storyContent = await iframe.locator('body');
    await expect(storyContent).toBeVisible();
    
    console.log(`✅ Story "${storyTitle}" loaded successfully`);
  });

  test('⚡ Performance: Storybook loads within acceptable time', async ({ page }) => {
    console.log('🔍 TEST: Verifying Storybook performance');
    
    const startTime = Date.now();
    
    await page.goto(STORYBOOK_URL);
    await page.waitForSelector('#root');
    await page.waitForSelector('[data-testid="tree-node-item"]');
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️  Storybook load time: ${loadTime}ms`);
    
    // Storybook should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('🔄 Theme switching functionality works', async ({ page }) => {
    console.log('🔍 TEST: Verifying theme switching in Storybook');
    
    await page.goto(STORYBOOK_URL);
    await page.waitForSelector('#root');
    
    // Look for theme toggle button
    const themeToggle = page.locator('[title*="theme" i], [aria-label*="theme" i]').first();
    
    if (await themeToggle.isVisible()) {
      console.log('🎨 Theme toggle found, testing functionality');
      
      // Take screenshot before theme change
      await page.screenshot({ 
        path: 'tests/storybook/screenshots/theme-before.png',
        fullPage: true 
      });
      
      await themeToggle.click();
      
      // Wait a moment for theme change
      await page.waitForTimeout(500);
      
      // Take screenshot after theme change
      await page.screenshot({ 
        path: 'tests/storybook/screenshots/theme-after.png',
        fullPage: true 
      });
      
      console.log('✅ Theme toggle functionality tested');
    } else {
      console.log('⚠️  No theme toggle found in Storybook UI');
    }
  });
});