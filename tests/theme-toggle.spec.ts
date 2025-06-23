import { test, expect, Page } from '@playwright/test';

test.describe('Theme Toggle Component', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Clear localStorage to start fresh
    await page.evaluate(() => {
      localStorage.removeItem('focuslab-theme-preference');
    });
    
    // Reload to ensure clean state
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('1. Check console for ThemeToggle initialization messages', async () => {
    const messages: string[] = [];
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.text().includes('ThemeToggle') || msg.text().includes('ThemeScript')) {
        messages.push(msg.text());
      }
    });

    // Reload page to capture initialization messages
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for all console messages
    await page.waitForTimeout(1000);

    console.log('Console messages:', messages);
    
    // Verify initialization messages are present
    expect(messages.some(msg => msg.includes('ThemeScript: Applied theme'))).toBeTruthy();
    expect(messages.some(msg => msg.includes('ThemeToggle: Initializing pure JavaScript version'))).toBeTruthy();
    expect(messages.some(msg => msg.includes('ThemeToggle: Pure JavaScript version ready'))).toBeTruthy();
  });

  test('2. Verify the button is visible and properly positioned', async () => {
    // Check if theme toggle container exists
    const container = page.locator('[data-testid="theme-toggle-container"]');
    await expect(container).toBeVisible();

    // Check if button exists and is visible
    const button = page.locator('[data-testid="theme-toggle-button"]');
    await expect(button).toBeVisible();

    // Verify positioning (fixed, right side, centered vertically)
    const containerBox = await container.boundingBox();
    const viewportSize = await page.viewportSize();
    
    expect(containerBox).toBeTruthy();
    if (containerBox && viewportSize) {
      // Should be on the right side (close to right edge)
      expect(containerBox.x).toBeGreaterThan(viewportSize.width - 100);
      
      // Should be vertically centered (approximately)
      const centerY = viewportSize.height / 2;
      expect(Math.abs(containerBox.y + containerBox.height / 2 - centerY)).toBeLessThan(50);
    }

    // Check initial button dimensions (should be 40px wide)
    const buttonBox = await button.boundingBox();
    expect(buttonBox).toBeTruthy();
    if (buttonBox) {
      expect(buttonBox.width).toBeCloseTo(40, 5); // 40px ± 5px tolerance
      expect(buttonBox.height).toBeCloseTo(40, 5); // 40px ± 5px tolerance
    }

    // Verify aria-label and title attributes
    await expect(button).toHaveAttribute('aria-label', 'Toggle theme');
    await expect(button).toHaveAttribute('title', 'Toggle theme');
  });

  test('3. Test clicking the button to toggle themes (light to dark and back)', async () => {
    const button = page.locator('[data-testid="theme-toggle-button"]');
    
    // Initially should be in light mode
    let htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('light');
    
    // Verify sun icon is visible, moon icon is hidden
    const sunIcon = page.locator('#sun-icon');
    const moonIcon = page.locator('#moon-icon');
    
    await expect(sunIcon).toBeVisible();
    await expect(moonIcon).toBeHidden();

    // Click to switch to dark mode
    await button.click();
    await page.waitForTimeout(500); // Wait for transition

    // Should now be in dark mode
    htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
    
    // Verify moon icon is visible, sun icon is hidden
    await expect(moonIcon).toBeVisible();
    await expect(sunIcon).toBeHidden();

    // Click again to switch back to light mode
    await button.click();
    await page.waitForTimeout(500); // Wait for transition

    // Should be back to light mode
    htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('light');
    
    // Verify sun icon is visible again, moon icon is hidden
    await expect(sunIcon).toBeVisible();
    await expect(moonIcon).toBeHidden();
  });

  test('4. Test hover behavior - button should expand and show theme label', async () => {
    const button = page.locator('[data-testid="theme-toggle-button"]');
    const label = page.locator('#theme-label');

    // Initially label should be hidden
    await expect(label).toBeHidden();

    // Get initial button width
    const initialBox = await button.boundingBox();
    expect(initialBox?.width).toBeCloseTo(40, 5);

    // Hover over the button
    await button.hover();
    await page.waitForTimeout(400); // Wait for transition

    // Button should expand to ~120px and label should be visible
    const expandedBox = await button.boundingBox();
    expect(expandedBox?.width).toBeCloseTo(120, 10);
    await expect(label).toBeVisible();

    // Check label text (should be "Light" initially)
    const labelText = await label.textContent();
    expect(labelText).toBe('Light');

    // Move mouse away
    await page.mouse.move(0, 0);
    await page.waitForTimeout(400); // Wait for transition

    // Button should shrink back and label should be hidden
    const shrunkBox = await button.boundingBox();
    expect(shrunkBox?.width).toBeCloseTo(40, 5);
    await expect(label).toBeHidden();

    // Test hover after switching to dark mode
    await button.click();
    await page.waitForTimeout(500);

    await button.hover();
    await page.waitForTimeout(400);

    // Label should now show "Dark"
    const darkLabelText = await label.textContent();
    expect(darkLabelText).toBe('Dark');
  });

  test('5. Verify localStorage persistence between clicks', async () => {
    const button = page.locator('[data-testid="theme-toggle-button"]');

    // Initially, localStorage should be empty or have light theme
    let storedTheme = await page.evaluate(() => localStorage.getItem('focuslab-theme-preference'));
    expect(storedTheme).toBeNull(); // Should be null initially

    // Click to switch to dark mode
    await button.click();
    await page.waitForTimeout(500);

    // Check localStorage was updated
    storedTheme = await page.evaluate(() => localStorage.getItem('focuslab-theme-preference'));
    expect(storedTheme).toBe('dark');

    // Click to switch back to light mode
    await button.click();
    await page.waitForTimeout(500);

    // Check localStorage was updated again
    storedTheme = await page.evaluate(() => localStorage.getItem('focuslab-theme-preference'));
    expect(storedTheme).toBe('light');

    // Reload page and verify theme persists
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be in light mode due to localStorage
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('light');

    // Set to dark and reload to test persistence
    await button.click();
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should be in dark mode after reload
    const htmlClassAfterReload = await page.locator('html').getAttribute('class');
    expect(htmlClassAfterReload).toContain('dark');
  });

  test('6. Test keyboard navigation (focus/blur)', async () => {
    const button = page.locator('[data-testid="theme-toggle-button"]');
    const label = page.locator('#theme-label');

    // Initially label should be hidden
    await expect(label).toBeHidden();

    // Focus the button using keyboard
    await button.press('Tab');
    await page.waitForTimeout(400); // Wait for transition

    // Button should expand and label should be visible when focused
    const focusedBox = await button.boundingBox();
    expect(focusedBox?.width).toBeCloseTo(120, 10);
    await expect(label).toBeVisible();

    // Test pressing Enter to toggle theme
    await button.press('Enter');
    await page.waitForTimeout(500);

    // Should switch to dark mode
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');

    // Test pressing Space to toggle theme
    await button.press(' ');
    await page.waitForTimeout(500);

    // Should switch back to light mode
    const htmlClassAfterSpace = await page.locator('html').getAttribute('class');
    expect(htmlClassAfterSpace).toContain('light');

    // Blur the button (focus something else)
    await page.keyboard.press('Tab');
    await page.waitForTimeout(400);

    // Button should shrink back and label should be hidden
    const blurredBox = await button.boundingBox();
    expect(blurredBox?.width).toBeCloseTo(40, 5);
    await expect(label).toBeHidden();
  });

  test('7. Take screenshots in both light and dark modes', async () => {
    const button = page.locator('[data-testid="theme-toggle-button"]');

    // Take screenshot in light mode
    await page.screenshot({ 
      path: 'test-results/theme-toggle-light-mode.png',
      fullPage: true 
    });

    // Take screenshot of just the theme toggle area in light mode
    const container = page.locator('[data-testid="theme-toggle-container"]');
    await container.screenshot({ 
      path: 'test-results/theme-toggle-button-light.png' 
    });

    // Switch to dark mode
    await button.click();
    await page.waitForTimeout(1000); // Wait for all transitions

    // Take screenshot in dark mode
    await page.screenshot({ 
      path: 'test-results/theme-toggle-dark-mode.png',
      fullPage: true 
    });

    // Take screenshot of just the theme toggle area in dark mode
    await container.screenshot({ 
      path: 'test-results/theme-toggle-button-dark.png' 
    });

    // Test hover state screenshot
    await button.hover();
    await page.waitForTimeout(400);
    await container.screenshot({ 
      path: 'test-results/theme-toggle-button-hover.png' 
    });
  });

  test('8. Comprehensive functionality report', async () => {
    const button = page.locator('[data-testid="theme-toggle-button"]');
    const container = page.locator('[data-testid="theme-toggle-container"]');
    const sunIcon = page.locator('#sun-icon');
    const moonIcon = page.locator('#moon-icon');
    const label = page.locator('#theme-label');

    // Test all functionality and collect results
    const testResults = {
      initialization: false,
      visibility: false,
      positioning: false,
      themeToggling: false,
      hoverExpansion: false,
      labelDisplay: false,
      localStorage: false,
      keyboardNavigation: false,
      iconSwitching: false,
      cssTransitions: false
    };

    // Test initialization (check console messages)
    const messages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('ThemeToggle') || msg.text().includes('ThemeScript')) {
        messages.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    testResults.initialization = messages.some(msg => 
      msg.includes('ThemeToggle: Pure JavaScript version ready')
    );

    // Test visibility and positioning
    testResults.visibility = await container.isVisible() && await button.isVisible();
    
    const containerBox = await container.boundingBox();
    const viewportSize = await page.viewportSize();
    testResults.positioning = !!(containerBox && viewportSize && 
      containerBox.x > viewportSize.width - 100);

    // Test theme toggling
    await button.click();
    await page.waitForTimeout(500);
    let htmlClass = await page.locator('html').getAttribute('class');
    const switchedToDark = htmlClass?.includes('dark');

    await button.click();
    await page.waitForTimeout(500);
    htmlClass = await page.locator('html').getAttribute('class');
    const switchedBackToLight = htmlClass?.includes('light');

    testResults.themeToggling = !!(switchedToDark && switchedBackToLight);

    // Test hover expansion
    const initialBox = await button.boundingBox();
    await button.hover();
    await page.waitForTimeout(400);
    const expandedBox = await button.boundingBox();
    
    testResults.hoverExpansion = !!(initialBox && expandedBox && 
      expandedBox.width > initialBox.width + 50);

    // Test label display
    testResults.labelDisplay = await label.isVisible();

    // Test localStorage persistence
    await button.click(); // Switch to dark
    await page.waitForTimeout(500);
    let storedTheme = await page.evaluate(() => 
      localStorage.getItem('focuslab-theme-preference')
    );
    testResults.localStorage = storedTheme === 'dark';

    // Test keyboard navigation
    await page.mouse.move(0, 0); // Move mouse away
    await page.waitForTimeout(400);
    await button.press('Tab');
    await page.waitForTimeout(400);
    const focusedBox = await button.boundingBox();
    testResults.keyboardNavigation = !!(focusedBox && focusedBox.width > 100);

    // Test icon switching
    await button.press('Enter'); // Toggle with keyboard
    await page.waitForTimeout(500);
    const moonVisible = await moonIcon.isVisible();
    const sunHidden = await sunIcon.isHidden();
    testResults.iconSwitching = moonVisible && sunHidden;

    // Test CSS transitions (check if transitions are applied)
    const buttonStyles = await button.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.transition;
    });
    testResults.cssTransitions = buttonStyles.includes('all') || buttonStyles.includes('width');

    // Log comprehensive test results
    console.log('=== Theme Toggle Functionality Report ===');
    console.log('Initialization:', testResults.initialization ? '✅ PASS' : '❌ FAIL');
    console.log('Visibility:', testResults.visibility ? '✅ PASS' : '❌ FAIL');
    console.log('Positioning:', testResults.positioning ? '✅ PASS' : '❌ FAIL');
    console.log('Theme Toggling:', testResults.themeToggling ? '✅ PASS' : '❌ FAIL');
    console.log('Hover Expansion:', testResults.hoverExpansion ? '✅ PASS' : '❌ FAIL');
    console.log('Label Display:', testResults.labelDisplay ? '✅ PASS' : '❌ FAIL');
    console.log('LocalStorage:', testResults.localStorage ? '✅ PASS' : '❌ FAIL');
    console.log('Keyboard Navigation:', testResults.keyboardNavigation ? '✅ PASS' : '❌ FAIL');
    console.log('Icon Switching:', testResults.iconSwitching ? '✅ PASS' : '❌ FAIL');
    console.log('CSS Transitions:', testResults.cssTransitions ? '✅ PASS' : '❌ FAIL');

    // All tests should pass
    const allTestsPassed = Object.values(testResults).every(result => result === true);
    expect(allTestsPassed).toBeTruthy();
  });
});