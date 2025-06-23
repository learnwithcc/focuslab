import { test, Page } from '@playwright/test';

test.describe('Theme Toggle Investigation', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Clear localStorage
    await page.evaluate(() => {
      localStorage.removeItem('focuslab-theme-preference');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Investigate focus behavior', async () => {
    const button = page.locator('[data-testid="theme-toggle-button"]');
    const label = page.locator('#theme-label');

    console.log('=== Focus Behavior Investigation ===');

    // Check initial state
    const initialBox = await button.boundingBox();
    console.log('Initial button dimensions:', initialBox);

    // Test programmatic focus
    await button.focus();
    await page.waitForTimeout(500);

    const focusedBox = await button.boundingBox();
    console.log('Focused button dimensions:', focusedBox);

    // Check if label is visible
    const labelVisible = await label.isVisible();
    console.log('Label visible on focus:', labelVisible);

    // Check computed styles
    const buttonStyles = await button.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        width: style.width,
        transition: style.transition,
        transform: style.transform
      };
    });
    console.log('Button computed styles when focused:', buttonStyles);

    // Test hover behavior for comparison
    await page.mouse.move(0, 0); // Move away first
    await button.hover();
    await page.waitForTimeout(500);

    const hoveredBox = await button.boundingBox();
    console.log('Hovered button dimensions:', hoveredBox);

    const labelVisibleOnHover = await label.isVisible();
    console.log('Label visible on hover:', labelVisibleOnHover);
  });

  test('Investigate icon switching', async () => {
    const button = page.locator('[data-testid="theme-toggle-button"]');
    const sunIcon = page.locator('#sun-icon');
    const moonIcon = page.locator('#moon-icon');

    console.log('=== Icon Switching Investigation ===');

    // Initial state
    console.log('Initial light mode:');
    console.log('Sun icon visible:', await sunIcon.isVisible());
    console.log('Moon icon visible:', await moonIcon.isVisible());
    console.log('Sun icon classes:', await sunIcon.getAttribute('class'));
    console.log('Moon icon classes:', await moonIcon.getAttribute('class'));

    // Click to switch to dark
    await button.click();
    await page.waitForTimeout(1000);

    console.log('After switching to dark mode:');
    console.log('Sun icon visible:', await sunIcon.isVisible());
    console.log('Moon icon visible:', await moonIcon.isVisible());
    console.log('Sun icon classes:', await sunIcon.getAttribute('class'));
    console.log('Moon icon classes:', await moonIcon.getAttribute('class'));

    // Check HTML class
    const htmlClass = await page.locator('html').getAttribute('class');
    console.log('HTML classes:', htmlClass);
  });

  test('Investigate CSS transitions', async () => {
    const button = page.locator('[data-testid="theme-toggle-button"]');

    console.log('=== CSS Transitions Investigation ===');

    // Check button transition styles
    const transitionStyles = await button.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        transition: style.transition,
        transitionProperty: style.transitionProperty,
        transitionDuration: style.transitionDuration,
        transitionTimingFunction: style.transitionTimingFunction
      };
    });
    
    console.log('Button transition styles:', transitionStyles);

    // Check if the button has the expected classes
    const buttonClasses = await button.getAttribute('class');
    console.log('Button classes:', buttonClasses);
  });

  test('Manual verification of all functionalities', async () => {
    const button = page.locator('[data-testid="theme-toggle-button"]');
    const container = page.locator('[data-testid="theme-toggle-container"]');
    const sunIcon = page.locator('#sun-icon');
    const moonIcon = page.locator('#moon-icon');
    const label = page.locator('#theme-label');

    console.log('=== Manual Verification Report ===');

    // 1. Console messages
    const messages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('ThemeToggle') || msg.text().includes('ThemeScript')) {
        messages.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('1. Console Messages:');
    messages.forEach(msg => console.log('  -', msg));

    // 2. Visibility and positioning
    console.log('2. Visibility & Positioning:');
    console.log('  - Container visible:', await container.isVisible());
    console.log('  - Button visible:', await button.isVisible());
    
    const containerBox = await container.boundingBox();
    const viewportSize = await page.viewportSize();
    console.log('  - Container position:', containerBox);
    console.log('  - Viewport size:', viewportSize);

    // 3. Theme toggling
    console.log('3. Theme Toggling:');
    let htmlClass = await page.locator('html').getAttribute('class');
    console.log('  - Initial theme:', htmlClass?.includes('dark') ? 'dark' : 'light');
    
    await button.click();
    await page.waitForTimeout(500);
    htmlClass = await page.locator('html').getAttribute('class');
    console.log('  - After first click:', htmlClass?.includes('dark') ? 'dark' : 'light');
    
    await button.click();
    await page.waitForTimeout(500);
    htmlClass = await page.locator('html').getAttribute('class');
    console.log('  - After second click:', htmlClass?.includes('dark') ? 'dark' : 'light');

    // 4. Hover behavior
    console.log('4. Hover Behavior:');
    const initialWidth = await button.boundingBox();
    console.log('  - Initial width:', initialWidth?.width);
    
    await button.hover();
    await page.waitForTimeout(500);
    const hoverWidth = await button.boundingBox();
    console.log('  - Hover width:', hoverWidth?.width);
    console.log('  - Label visible on hover:', await label.isVisible());
    
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    const afterHoverWidth = await button.boundingBox();
    console.log('  - Width after hover:', afterHoverWidth?.width);

    // 5. LocalStorage
    console.log('5. LocalStorage:');
    await button.click(); // Switch to dark
    await page.waitForTimeout(500);
    let storedTheme = await page.evaluate(() => localStorage.getItem('focuslab-theme-preference'));
    console.log('  - Stored theme after dark switch:', storedTheme);
    
    await button.click(); // Switch to light
    await page.waitForTimeout(500);
    storedTheme = await page.evaluate(() => localStorage.getItem('focuslab-theme-preference'));
    console.log('  - Stored theme after light switch:', storedTheme);

    // 6. Keyboard navigation
    console.log('6. Keyboard Navigation:');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    
    await button.focus();
    await page.waitForTimeout(500);
    const focusWidth = await button.boundingBox();
    console.log('  - Width on focus:', focusWidth?.width);
    console.log('  - Label visible on focus:', await label.isVisible());

    // 7. Icon switching
    console.log('7. Icon Switching:');
    console.log('  - Current sun icon visible:', await sunIcon.isVisible());
    console.log('  - Current moon icon visible:', await moonIcon.isVisible());
    
    await button.press('Enter');
    await page.waitForTimeout(500);
    console.log('  - After Enter press - sun icon visible:', await sunIcon.isVisible());
    console.log('  - After Enter press - moon icon visible:', await moonIcon.isVisible());

    // 8. Accessibility
    console.log('8. Accessibility:');
    console.log('  - Aria label:', await button.getAttribute('aria-label'));
    console.log('  - Title attribute:', await button.getAttribute('title'));
    console.log('  - Button type:', await button.getAttribute('type'));
  });
});