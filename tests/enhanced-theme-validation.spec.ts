import { test, expect } from '@playwright/test';

test.describe('Enhanced Theme Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing theme cookies before each test
    await page.context().clearCookies();
  });

  test('theme system initializes correctly on page load', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Wait for the enhanced theme script to execute
    await page.waitForFunction(() => window.__themeScriptExecuted === true, { timeout: 5000 });
    
    // Check that theme is applied to DOM
    const htmlClasses = await page.evaluate(() => document.documentElement.className);
    const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const colorScheme = await page.evaluate(() => document.documentElement.style.colorScheme);
    
    expect(htmlClasses).toMatch(/light|dark/);
    expect(dataTheme).toMatch(/light|dark/);
    expect(colorScheme).toMatch(/light|dark/);
  });

  test('theme toggle cycles correctly through all states', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForFunction(() => window.__themeScriptExecuted === true);
    
    // Wait for theme toggle to be ready
    await page.waitForSelector('[aria-label*="Switch"]', { timeout: 10000 });
    
    // Test full cycle: auto -> light -> dark -> auto
    let themeButton = page.locator('[aria-label*="Switch"]').first();
    
    // Should start in auto mode (following system)
    await expect(themeButton).toHaveAttribute('aria-label', /currently following system/);
    
    // Click to switch to light mode
    await themeButton.click();
    await page.waitForTimeout(500); // Allow theme to apply
    await expect(themeButton).toHaveAttribute('aria-label', /Switch to dark mode/);
    
    // Click to switch to dark mode
    await themeButton.click();
    await page.waitForTimeout(500);
    await expect(themeButton).toHaveAttribute('aria-label', /Switch to automatic/);
    
    // Verify dark theme is applied
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);
    
    // Click to switch back to auto mode
    await themeButton.click();
    await page.waitForTimeout(500);
    await expect(themeButton).toHaveAttribute('aria-label', /currently following system/);
  });

  test('theme persists across page navigation', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForFunction(() => window.__themeScriptExecuted === true);
    await page.waitForSelector('[aria-label*="Switch"]', { timeout: 10000 });
    
    // Set to dark mode
    const themeButton = page.locator('[aria-label*="Switch"]').first();
    await themeButton.click(); // to light
    await themeButton.click(); // to dark
    await page.waitForTimeout(500);
    
    // Verify dark mode is set
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
    
    // Navigate to projects page
    await page.click('a[href="/projects"]');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.__themeScriptExecuted === true);
    
    // Verify theme persisted
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
    
    // Verify override cookie exists
    const cookies = await page.context().cookies();
    const themeCookie = cookies.find(c => c.name === 'focuslab-theme-override');
    expect(themeCookie?.value).toBe('dark');
  });

  test('theme respects user preference and auto-switch functionality', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForFunction(() => window.__themeScriptExecuted === true);
    await page.waitForSelector('[aria-label*="Switch"]', { timeout: 10000 });
    
    // Ensure we're in auto mode
    const themeButton = page.locator('[aria-label*="Switch"]').first();
    const ariaLabel = await themeButton.getAttribute('aria-label');
    
    if (!ariaLabel?.includes('currently following system')) {
      // Click until we get to auto mode
      for (let i = 0; i < 3; i++) {
        await themeButton.click();
        await page.waitForTimeout(300);
        const newLabel = await themeButton.getAttribute('aria-label');
        if (newLabel?.includes('currently following system')) break;
      }
    }
    
    // Verify no override cookie exists in auto mode
    const cookies = await page.context().cookies();
    const overrideCookie = cookies.find(c => c.name === 'focuslab-theme-override');
    expect(overrideCookie).toBeUndefined();
  });

  test('theme works correctly across different browsers', async ({ page, browserName }) => {
    await page.goto('http://localhost:3001');
    await page.waitForFunction(() => window.__themeScriptExecuted === true, { timeout: 10000 });
    
    // Test basic theme functionality
    await page.waitForSelector('[aria-label*="Switch"]', { timeout: 10000 });
    const themeButton = page.locator('[aria-label*="Switch"]').first();
    
    // Test theme toggle
    await themeButton.click();
    await page.waitForTimeout(500);
    
    const htmlClasses = await page.evaluate(() => document.documentElement.className);
    expect(htmlClasses).toMatch(/light|dark/);
    
    // Log browser-specific results
    console.log(`${browserName}: Theme classes applied:`, htmlClasses);
  });

  test('theme component stories render correctly', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForFunction(() => window.__themeScriptExecuted === true);
    
    // Test that components render properly in both themes
    await page.waitForSelector('[aria-label*="Switch"]', { timeout: 10000 });
    const themeButton = page.locator('[aria-label*="Switch"]').first();
    
    // Test light mode rendering
    await themeButton.click(); // Switch to light if not already
    await page.waitForTimeout(500);
    
    // Take screenshot for visual regression testing
    await page.screenshot({ path: 'test-results/light-mode-components.png', fullPage: true });
    
    // Test dark mode rendering
    await themeButton.click(); // Switch to dark
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/dark-mode-components.png', fullPage: true });
    
    // Verify both themes applied visual changes
    const lightScreenshot = await page.screenshot({ fullPage: true });
    await themeButton.click(); // Back to light
    await page.waitForTimeout(500);
    const darkScreenshot = await page.screenshot({ fullPage: true });
    
    // Screenshots should be different
    expect(Buffer.compare(lightScreenshot, darkScreenshot)).not.toBe(0);
  });

  test('system theme persistence and auto-switch theme across story navigation', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForFunction(() => window.__themeScriptExecuted === true);
    
    // Verify auto mode works and persists across navigation
    await page.waitForSelector('[aria-label*="Switch"]', { timeout: 10000 });
    
    // Navigate to about page
    await page.click('a[href="/about"]');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.__themeScriptExecuted === true);
    
    // Verify theme script executed and theme is applied
    const hasTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('light') || 
             document.documentElement.classList.contains('dark');
    });
    expect(hasTheme).toBe(true);
  });

  test('theme toggle functionality works', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForFunction(() => window.__themeScriptExecuted === true);
    
    // Wait for theme toggle and test functionality
    await page.waitForSelector('[aria-label*="Switch"]', { timeout: 10000 });
    const themeButton = page.locator('[aria-label*="Switch"]').first();
    
    // Get initial state
    const initialTheme = await page.evaluate(() => 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    
    // Toggle theme
    await themeButton.click();
    await page.waitForTimeout(500);
    
    // Verify theme changed
    const newTheme = await page.evaluate(() => 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    
    expect(newTheme).not.toBe(initialTheme);
  });
});