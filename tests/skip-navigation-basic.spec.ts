import { test, expect } from '@playwright/test';

test.describe('Skip Navigation Basic Test', () => {
  test('skip navigation link exists and has correct attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check if skip link exists in the DOM
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeAttached();
    
    // Verify it has correct attributes
    await expect(skipLink).toHaveAttribute('href', '#main-content');
    await expect(skipLink).toHaveAttribute('aria-label', 'Skip to main content');
    
    // Verify main content target exists
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeAttached();
    await expect(mainContent).toHaveAttribute('id', 'main-content');
  });

  test('skip navigation appears on focus', async ({ page }) => {
    await page.goto('/');
    
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    
    // Should not be visible initially
    await expect(skipLink).not.toBeVisible();
    
    // Press Tab to focus
    await page.keyboard.press('Tab');
    
    // Should now be visible and focused
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toBeFocused();
  });
});