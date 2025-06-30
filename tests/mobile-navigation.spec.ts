import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show hamburger menu button on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that hamburger button is visible
    const hamburgerButton = page.getByRole('button', { name: /open navigation menu/i });
    await expect(hamburgerButton).toBeVisible();
    
    // Check that desktop navigation is hidden
    const desktopNav = page.locator('nav[aria-label="Main navigation"]').first();
    await expect(desktopNav).toBeHidden();
  });

  test('should hide hamburger menu button on desktop viewports', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Check that hamburger button is hidden
    const hamburgerButton = page.getByRole('button', { name: /open navigation menu/i });
    await expect(hamburgerButton).toBeHidden();
    
    // Check that desktop navigation is visible
    const desktopNav = page.locator('nav[aria-label="Main navigation"]').first();
    await expect(desktopNav).toBeVisible();
  });

  test('should open and close mobile menu with hamburger button', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburgerButton = page.locator('button[aria-label="Open navigation menu"]');
    const mobileMenu = page.locator('#mobile-menu');
    
    // Initially, mobile menu should be hidden
    await expect(mobileMenu).toHaveClass(/max-h-0/);
    await expect(mobileMenu).toHaveClass(/opacity-0/);
    
    // Click hamburger button to open menu
    await hamburgerButton.click();
    
    // Menu should be visible
    await expect(mobileMenu).toHaveClass(/max-h-80/);
    await expect(mobileMenu).toHaveClass(/opacity-100/);
    
    // Button label should change to "Close navigation menu"
    const updatedButton = page.locator('button[aria-label="Close navigation menu"]');
    await expect(updatedButton).toBeVisible();
    await expect(updatedButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click hamburger button again to close menu
    await updatedButton.click();
    
    // Menu should be hidden again
    await expect(mobileMenu).toHaveClass(/max-h-0/);
    await expect(mobileMenu).toHaveClass(/opacity-0/);
    
    // Button label should change back to "Open navigation menu"
    await expect(hamburgerButton).toBeVisible();
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should display all navigation items in mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburgerButton = page.getByRole('button', { name: /open navigation menu/i });
    await hamburgerButton.click();
    
    // Check that all navigation items are present
    const expectedItems = ['Home', 'About', 'Projects', 'Blog', 'Contact'];
    
    for (const item of expectedItems) {
      const navItem = page.getByRole('menuitem', { name: item });
      await expect(navItem).toBeVisible();
    }
  });

  test('should navigate when clicking mobile menu items', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburgerButton = page.getByRole('button', { name: /open navigation menu/i });
    await hamburgerButton.click();
    
    // Click on About link
    const aboutLink = page.getByRole('menuitem', { name: 'About' });
    await aboutLink.click();
    
    // Should navigate to about page
    await expect(page).toHaveURL('/about');
    
    // Mobile menu should close after navigation
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toHaveClass(/max-h-0/);
    await expect(mobileMenu).toHaveClass(/opacity-0/);
  });

  test('should support keyboard navigation in mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburgerButton = page.getByRole('button', { name: /open navigation menu/i });
    await hamburgerButton.click();
    
    // Focus should be on the first menu item when menu opens
    const firstMenuItem = page.getByRole('menuitem', { name: 'Home' });
    await expect(firstMenuItem).toBeFocused();
    
    // Test arrow down navigation
    await page.keyboard.press('ArrowDown');
    const secondMenuItem = page.getByRole('menuitem', { name: 'About' });
    await expect(secondMenuItem).toBeFocused();
    
    // Test arrow up navigation
    await page.keyboard.press('ArrowUp');
    await expect(firstMenuItem).toBeFocused();
    
    // Test escape key closes menu
    await page.keyboard.press('Escape');
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toHaveClass(/max-h-0/);
    await expect(mobileMenu).toHaveClass(/opacity-0/);
    
    // Focus should return to hamburger button
    await expect(hamburgerButton).toBeFocused();
  });

  test('should show active state for current page in mobile menu', async ({ page }) => {
    // Navigate to About page
    await page.goto('/about');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburgerButton = page.getByRole('button', { name: /open navigation menu/i });
    await hamburgerButton.click();
    
    // About menu item should have active class
    const aboutMenuItem = page.getByRole('menuitem', { name: 'About' });
    await expect(aboutMenuItem).toHaveClass(/active/);
    await expect(aboutMenuItem).toHaveAttribute('aria-current', 'page');
    
    // Other menu items should not have active class
    const homeMenuItem = page.getByRole('menuitem', { name: 'Home' });
    await expect(homeMenuItem).not.toHaveClass(/active/);
  });

  test('should close mobile menu when clicking outside', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburgerButton = page.getByRole('button', { name: /open navigation menu/i });
    await hamburgerButton.click();
    
    // Menu should be open
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toHaveClass(/max-h-80/);
    await expect(mobileMenu).toHaveClass(/opacity-100/);
    
    // Click outside the menu (on the main content)
    const mainContent = page.locator('main').first();
    await mainContent.click();
    
    // Menu should close
    await expect(mobileMenu).toHaveClass(/max-h-0/);
    await expect(mobileMenu).toHaveClass(/opacity-0/);
  });

  test('should have proper ARIA attributes for accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburgerButton = page.getByRole('button', { name: /open navigation menu/i });
    
    // Check initial ARIA attributes
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
    await expect(hamburgerButton).toHaveAttribute('aria-controls', 'mobile-menu');
    await expect(hamburgerButton).toHaveAttribute('aria-haspopup', 'true');
    
    // Open menu
    await hamburgerButton.click();
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
    
    // Check mobile menu ARIA attributes
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toHaveAttribute('id', 'mobile-menu');
    
    const mobileNav = page.locator('#mobile-menu nav');
    await expect(mobileNav).toHaveAttribute('aria-label', 'Mobile navigation');
    await expect(mobileNav).toHaveAttribute('role', 'navigation');
    
    // Check menu items have proper roles
    const menuItems = page.getByRole('menuitem');
    await expect(menuItems).toHaveCount(5); // 5 navigation items
  });

  test('should animate hamburger icon transformation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const hamburgerButton = page.getByRole('button', { name: /open navigation menu/i });
    const hamburgerLines = page.locator('.hamburger-line');
    
    // Check initial hamburger state
    await expect(hamburgerLines).toHaveCount(3);
    
    // Click to open menu
    await hamburgerButton.click();
    
    // Wait for animation to complete
    await page.waitForTimeout(350); // Slightly longer than animation duration
    
    // Check that lines have transformed to X shape
    const firstLine = hamburgerLines.nth(0);
    const secondLine = hamburgerLines.nth(1);
    const thirdLine = hamburgerLines.nth(2);
    
    await expect(firstLine).toHaveClass(/rotate-45/);
    await expect(secondLine).toHaveClass(/opacity-0/);
    await expect(thirdLine).toHaveClass(/-rotate-45/);
    
    // Click to close menu
    await hamburgerButton.click();
    
    // Wait for animation to complete
    await page.waitForTimeout(350);
    
    // Check that lines have returned to hamburger state
    await expect(firstLine).toHaveClass(/-translate-y-1\.5/);
    await expect(secondLine).toHaveClass(/opacity-100/);
    await expect(thirdLine).toHaveClass(/translate-y-1\.5/);
  });
});