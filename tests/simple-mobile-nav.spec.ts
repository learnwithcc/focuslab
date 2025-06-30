import { test, expect } from '@playwright/test';

test.describe('Simple Mobile Navigation Test', () => {
  test('mobile navigation basic functionality', async ({ page }) => {
    await page.goto('/');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Take a screenshot to see the actual layout
    await page.screenshot({ path: 'tests/debug-mobile-layout.png', fullPage: true });
    
    // Look for any button with hamburger-like text/aria-label
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on the page`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      console.log(`Button ${i}: aria-label="${ariaLabel}", text="${text}"`);
    }
    
    // Check for mobile menu container
    const mobileMenu = page.locator('#mobile-menu');
    const exists = await mobileMenu.count();
    console.log(`Mobile menu element count: ${exists}`);
    
    if (exists > 0) {
      const classes = await mobileMenu.getAttribute('class');
      console.log(`Mobile menu classes: ${classes}`);
    }
    
    // Look for any hamburger-style button
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-controls="mobile-menu"]');
    const hamburgerExists = await hamburgerButton.count();
    console.log(`Hamburger button count: ${hamburgerExists}`);
    
    if (hamburgerExists > 0) {
      const classes = await hamburgerButton.getAttribute('class');
      const ariaLabel = await hamburgerButton.getAttribute('aria-label');
      console.log(`Hamburger button classes: ${classes}`);
      console.log(`Hamburger button aria-label: ${ariaLabel}`);
    }
  });
});