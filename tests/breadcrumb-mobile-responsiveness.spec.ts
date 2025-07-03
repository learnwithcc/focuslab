import { test, expect, devices } from '@playwright/test';

test.describe('Breadcrumb Mobile Responsiveness', () => {
  // Test across multiple mobile devices
  const mobileDevices = [
    { name: 'iPhone SE', ...devices['iPhone SE'] },
    { name: 'iPhone 12', ...devices['iPhone 12'] },
    { name: 'Samsung Galaxy S21', ...devices['Galaxy S21'] },
    { name: 'iPad Mini', ...devices['iPad Mini'] }
  ];

  for (const device of mobileDevices) {
    test(`should display properly on ${device.name}`, async ({ browser }) => {
      const context = await browser.newContext(device);
      const page = await context.newPage();

      await page.goto('/blog/introducing-focuslab-blog');
      
      // Wait for breadcrumbs to load
      await page.waitForSelector('[aria-label="Breadcrumb navigation"]', { timeout: 10000 });
      
      // Check breadcrumbs are visible
      const breadcrumbNav = page.locator('[aria-label="Breadcrumb navigation"]');
      await expect(breadcrumbNav).toBeVisible();
      
      // Check for proper spacing and no overflow
      const breadcrumbBox = await breadcrumbNav.boundingBox();
      const viewportSize = page.viewportSize();
      
      // Breadcrumbs should not overflow the viewport
      expect(breadcrumbBox?.x).toBeGreaterThanOrEqual(0);
      expect((breadcrumbBox?.x || 0) + (breadcrumbBox?.width || 0)).toBeLessThanOrEqual(viewportSize?.width || 0);
      
      // Check touch targets are appropriately sized (44px minimum)
      const links = page.locator('[aria-label="Breadcrumb navigation"] a');
      for (const link of await links.all()) {
        const linkBox = await link.boundingBox();
        expect(linkBox?.height).toBeGreaterThanOrEqual(44);
        expect(linkBox?.width).toBeGreaterThanOrEqual(44);
      }
      
      // Test readability - text should not be too small
      const textStyles = await page.locator('[aria-label="Breadcrumb navigation"]').evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: parseInt(styles.fontSize),
          lineHeight: styles.lineHeight
        };
      });
      
      expect(textStyles.fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
      
      await context.close();
    });
  }

  test('should handle extremely long post titles on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone 5 size
    
    // Create a test scenario with a very long title
    await page.goto('/blog/accessibility-first-design'); // This has a longer title
    
    const breadcrumbNav = page.locator('[aria-label="Breadcrumb navigation"]');
    await expect(breadcrumbNav).toBeVisible();
    
    // Check for text wrapping or truncation
    const currentPageSpan = page.locator('[aria-current="page"]');
    const spanBox = await currentPageSpan.boundingBox();
    const navBox = await breadcrumbNav.boundingBox();
    
    // Current page text should not overflow container
    expect((spanBox?.x || 0) + (spanBox?.width || 0)).toBeLessThanOrEqual((navBox?.x || 0) + (navBox?.width || 0));
    
    // Should not cause horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(hasHorizontalScroll).toBe(false);
  });

  test('should maintain proper spacing between breadcrumb items on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 6/7/8 size
    
    await page.goto('/blog/mdx-powered-blogging');
    
    // Check spacing between breadcrumb items
    const breadcrumbItems = await page.locator('[aria-label="Breadcrumb navigation"] ol li').all();
    
    for (let i = 0; i < breadcrumbItems.length - 1; i++) {
      const currentItem = breadcrumbItems[i];
      const nextItem = breadcrumbItems[i + 1];
      
      const currentBox = await currentItem.boundingBox();
      const nextBox = await nextItem.boundingBox();
      
      // Should have reasonable spacing between items
      if (currentBox && nextBox) {
        const gap = nextBox.x - (currentBox.x + currentBox.width);
        expect(gap).toBeGreaterThanOrEqual(8); // Minimum 8px gap
        expect(gap).toBeLessThanOrEqual(32); // Maximum 32px gap
      }
    }
  });

  test('should be scrollable horizontally if needed on very small screens', async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 568 }); // Very small screen
    
    await page.goto('/blog/accessibility-first-design');
    
    const breadcrumbNav = page.locator('[aria-label="Breadcrumb navigation"]');
    await expect(breadcrumbNav).toBeVisible();
    
    // Check if breadcrumbs allow horizontal scroll if content is too wide
    const scrollable = await breadcrumbNav.evaluate(el => {
      return el.scrollWidth > el.clientWidth;
    });
    
    // Either content fits or is horizontally scrollable
    if (scrollable) {
      // Should allow scrolling without breaking layout
      await breadcrumbNav.evaluate(el => el.scrollTo(100, 0));
      await expect(breadcrumbNav).toBeVisible();
    }
  });

  test('should work with mobile orientation changes', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 12']);
    const page = await context.newPage();
    
    await page.goto('/blog/introducing-focuslab-blog');
    
    // Test portrait orientation
    await page.setViewportSize({ width: 390, height: 844 });
    const breadcrumbNav = page.locator('[aria-label="Breadcrumb navigation"]');
    await expect(breadcrumbNav).toBeVisible();
    
    // Test landscape orientation
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(breadcrumbNav).toBeVisible();
    
    // Check that breadcrumbs remain functional after orientation change
    const blogLink = page.locator('[aria-label="Breadcrumb navigation"] a').nth(1);
    await blogLink.click();
    await page.waitForURL('/blog');
    await expect(page).toHaveURL('/blog');
    
    await context.close();
  });
});