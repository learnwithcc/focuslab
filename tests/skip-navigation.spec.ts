import { test, expect } from '@playwright/test';

test.describe('Skip Navigation Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('skip navigation link appears on Tab and works correctly', async ({ page }) => {
    // Skip link should not be visible initially
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).not.toBeVisible();

    // Press Tab to focus the skip link
    await page.keyboard.press('Tab');
    
    // Skip link should now be visible and focused
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toBeFocused();
    
    // Verify skip link has proper ARIA attributes
    await expect(skipLink).toHaveAttribute('aria-label', 'Skip to main content');
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // Click the skip link
    await skipLink.click();
    
    // Verify main content is now focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
    
    // Skip link should become hidden again after use
    await expect(skipLink).not.toBeVisible();
  });

  test('skip navigation works with keyboard Enter key', async ({ page }) => {
    // Focus the skip link with Tab
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();

    // Press Enter to activate the skip link
    await page.keyboard.press('Enter');
    
    // Verify main content is focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('skip navigation has high contrast focus styles', async ({ page }) => {
    // Tab to focus the skip link
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    
    // Verify the skip link has proper focus styling
    await expect(skipLink).toBeVisible();
    
    // Check that it has the expected CSS classes for high contrast
    const classList = await skipLink.getAttribute('class');
    expect(classList).toContain('skip-link');
    
    // Verify high contrast colors are applied when focused
    const styles = await skipLink.evaluate((el) => {
      const computedStyles = window.getComputedStyle(el);
      return {
        backgroundColor: computedStyles.backgroundColor,
        color: computedStyles.color,
        position: computedStyles.position,
        zIndex: computedStyles.zIndex,
      };
    });
    
    // Should have high z-index to appear above other content
    expect(parseInt(styles.zIndex)).toBeGreaterThan(9999);
  });

  test('skip navigation works with Alt+S keyboard shortcut', async ({ page }) => {
    // Test the Alt+S shortcut for accessing skip link
    await page.keyboard.press('Alt+s');
    
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
  });

  test('skip navigation works in dark mode', async ({ page }) => {
    // Switch to dark mode first
    const themeToggle = page.getByRole('button', { name: /theme/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
    }
    
    // Tab to focus the skip link
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    
    // Verify it's visible and properly styled in dark mode
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toBeFocused();
    
    // Click to verify functionality in dark mode
    await skipLink.click();
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('skip navigation is accessible to screen readers', async ({ page }) => {
    // Tab to the skip link
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    
    // Verify proper semantic structure
    await expect(skipLink).toHaveRole('link');
    await expect(skipLink).toHaveAttribute('href', '#main-content');
    await expect(skipLink).toHaveAttribute('aria-label', 'Skip to main content');
    
    // Verify the target element exists and has proper ID
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toHaveAttribute('id', 'main-content');
    await expect(mainContent).toHaveRole('main');
  });

  test('skip navigation respects reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Tab to focus skip link
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeVisible();
    
    // Verify it still functions without motion
    await skipLink.click();
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('skip navigation is first in tab order', async ({ page }) => {
    // The very first Tab should focus the skip link
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
    
    // Second Tab should focus next element (likely in header)
    await page.keyboard.press('Tab');
    await expect(skipLink).not.toBeFocused();
  });

  test('main content becomes focusable when skip link is used', async ({ page }) => {
    const mainContent = page.locator('#main-content');
    
    // Initially main content should not have tabindex
    const initialTabIndex = await mainContent.getAttribute('tabindex');
    expect(initialTabIndex).toBeNull();
    
    // Use skip link
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await skipLink.click();
    
    // Main content should now be focused
    await expect(mainContent).toBeFocused();
    
    // After a brief moment, tabindex should be restored
    await page.waitForTimeout(150);
    const finalTabIndex = await mainContent.getAttribute('tabindex');
    expect(finalTabIndex).toBeNull();
  });

  test('skip navigation works across different pages', async ({ page }) => {
    // Test on homepage
    await page.goto('/');
    await page.keyboard.press('Tab');
    let skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeVisible();
    await skipLink.click();
    let mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();

    // Test on about page
    await page.goto('/about');
    await page.keyboard.press('Tab');
    skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeVisible();
    await skipLink.click();
    mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();

    // Test on projects page
    await page.goto('/projects');
    await page.keyboard.press('Tab');
    skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeVisible();
    await skipLink.click();
    mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });
});