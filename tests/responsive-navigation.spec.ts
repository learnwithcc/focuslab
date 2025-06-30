import { test, expect } from '@playwright/test';

test.describe('Responsive Navigation Breakpoints', () => {
  const viewports = [
    { width: 320, height: 568, name: 'iPhone SE' },
    { width: 375, height: 667, name: 'iPhone 6/7/8' },
    { width: 414, height: 896, name: 'iPhone XR' },
    { width: 768, height: 1024, name: 'iPad Portrait' },
    { width: 1024, height: 768, name: 'iPad Landscape' },
    { width: 1280, height: 720, name: 'Desktop Small' },
  ];

  viewports.forEach(({ width, height, name }) => {
    test(`should show correct navigation at ${name} (${width}x${height})`, async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width, height });
      
      const hamburgerButton = page.locator('button[aria-label="Open navigation menu"]');
      const desktopNav = page.locator('nav[aria-label="Main navigation"]').first();
      
      if (width < 768) {
        // Mobile/tablet portrait - should show hamburger menu
        await expect(hamburgerButton).toBeVisible();
        await expect(desktopNav).toBeHidden();
        
        // Test mobile menu functionality
        await hamburgerButton.click();
        const mobileMenu = page.locator('#mobile-menu');
        await expect(mobileMenu).toHaveClass(/max-h-80/);
        await expect(mobileMenu).toHaveClass(/opacity-100/);
        
        // Test all navigation items are present
        const navItems = page.getByRole('menuitem');
        await expect(navItems).toHaveCount(5);
        
      } else {
        // Desktop/tablet landscape - should show desktop navigation
        await expect(hamburgerButton).toBeHidden();
        await expect(desktopNav).toBeVisible();
        
        // Test all desktop navigation items are present
        const desktopNavItems = desktopNav.locator('a');
        await expect(desktopNavItems).toHaveCount(5);
      }
    });
  });

  test('should maintain state during viewport changes', async ({ page }) => {
    await page.goto('/');
    
    // Start in mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburgerButton = page.locator('button[aria-label="Open navigation menu"]');
    await hamburgerButton.click();
    
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toHaveClass(/max-h-80/);
    
    // Switch to desktop view
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Hamburger should be hidden, desktop nav should be visible
    await expect(hamburgerButton).toBeHidden();
    
    const desktopNav = page.locator('nav[aria-label="Main navigation"]').first();
    await expect(desktopNav).toBeVisible();
    
    // Switch back to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile menu should be closed (state reset)
    await expect(mobileMenu).toHaveClass(/max-h-0/);
    await expect(mobileMenu).toHaveClass(/opacity-0/);
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburgerButton = page.locator('button[aria-label="Open navigation menu"]');
    
    // Tap to open menu
    await hamburgerButton.tap();
    
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toHaveClass(/max-h-80/);
    
    // Tap a menu item
    const aboutLink = page.getByRole('menuitem', { name: 'About' });
    await aboutLink.tap();
    
    // Should navigate to about page and close menu
    await expect(page).toHaveURL('/about');
    await expect(mobileMenu).toHaveClass(/max-h-0/);
  });
});