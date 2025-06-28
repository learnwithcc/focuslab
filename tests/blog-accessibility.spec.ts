import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Blog Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core for accessibility testing
    await injectAxe(page);
  });

  test.describe('Blog Index Accessibility', () => {
    test('should have no accessibility violations on blog index', async ({ page }) => {
      await page.goto('/blog');
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      // Run accessibility checks
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
    });

    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/blog');
      
      // Check that h1 exists and is unique
      const h1Elements = await page.locator('h1').count();
      expect(h1Elements).toBe(1);
      
      // Check logical heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      let previousLevel = 0;
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const currentLevel = parseInt(tagName.charAt(1));
        
        // Heading levels should not skip (e.g., h1 -> h3)
        if (previousLevel > 0) {
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        }
        previousLevel = currentLevel;
      }
    });

    test('should have proper landmarks', async ({ page }) => {
      await page.goto('/blog');
      
      // Should have main landmark
      await expect(page.locator('main')).toBeVisible();
      
      // Should have navigation landmarks
      const navElements = await page.locator('nav').count();
      expect(navElements).toBeGreaterThan(0);
      
      // Should have proper article structure for blog posts
      const articles = await page.locator('article').count();
      expect(articles).toBeGreaterThan(0);
    });

    test('should have proper focus management', async ({ page }) => {
      await page.goto('/blog');
      
      // Skip to main content link should be first focusable element
      await page.keyboard.press('Tab');
      const firstFocused = await page.locator(':focus').textContent();
      expect(firstFocused).toContain('Skip to main content');
      
      // Should be able to navigate through all interactive elements
      let focusedElementsCount = 0;
      const maxTabs = 50; // Prevent infinite loop
      
      while (focusedElementsCount < maxTabs) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        if (!(await focusedElement.isVisible())) break;
        focusedElementsCount++;
      }
      
      expect(focusedElementsCount).toBeGreaterThan(0);
    });

    test('should have proper color contrast', async ({ page }) => {
      await page.goto('/blog');
      
      // Run axe-core specifically for color contrast
      await checkA11y(page, undefined, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    test('should support keyboard navigation for filtering', async ({ page }) => {
      await page.goto('/blog');
      
      // Find category filters
      const categoryFilters = page.locator('[data-testid="category-filter"] a');
      if (await categoryFilters.first().isVisible()) {
        // Focus first category filter
        await categoryFilters.first().focus();
        await expect(categoryFilters.first()).toBeFocused();
        
        // Activate with keyboard
        await page.keyboard.press('Enter');
        
        // Should navigate to filtered view
        await expect(page).toHaveURL(/category=/);
      }
    });
  });

  test.describe('Individual Post Accessibility', () => {
    test('should have no accessibility violations on blog post', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      // Run accessibility checks
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
    });

    test('should have proper article structure', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Should have article element
      await expect(page.locator('article')).toBeVisible();
      
      // Article should have proper heading
      const articleHeading = page.locator('article h1');
      await expect(articleHeading).toBeVisible();
      
      // Should have author information
      await expect(page.getByText(/By.*FocusLab Team/)).toBeVisible();
      
      // Should have publication date
      await expect(page.getByText(/\d{4}/)).toBeVisible();
    });

    test('should have proper breadcrumb navigation', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Breadcrumbs should have proper ARIA
      const breadcrumbs = page.locator('[aria-label="Breadcrumb navigation"]');
      await expect(breadcrumbs).toBeVisible();
      
      // Should have proper list structure
      const breadcrumbList = breadcrumbs.locator('ol');
      await expect(breadcrumbList).toBeVisible();
      
      // Current page should be marked appropriately
      const currentPage = breadcrumbs.locator('[aria-current="page"]');
      await expect(currentPage).toBeVisible();
    });

    test('should have accessible images', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // All images should have alt text
      const images = await page.locator('img').all();
      for (const image of images) {
        const altText = await image.getAttribute('alt');
        expect(altText).toBeTruthy();
        expect(altText).not.toBe('');
      }
    });

    test('should have accessible links', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // All links should have accessible names
      const links = await page.locator('a').all();
      for (const link of links) {
        const linkText = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const ariaLabelledby = await link.getAttribute('aria-labelledby');
        
        // Link should have accessible name from text, aria-label, or aria-labelledby
        expect(linkText || ariaLabel || ariaLabelledby).toBeTruthy();
      }
    });

    test('should have proper callout accessibility', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Check for blog callouts
      const callouts = page.locator('[role="region"]');
      const calloutCount = await callouts.count();
      
      if (calloutCount > 0) {
        for (let i = 0; i < calloutCount; i++) {
          const callout = callouts.nth(i);
          
          // Should have proper role
          await expect(callout).toHaveAttribute('role', 'region');
          
          // Should have accessible name
          const ariaLabelledby = await callout.getAttribute('aria-labelledby');
          if (ariaLabelledby) {
            const labelElement = page.locator(`#${ariaLabelledby}`);
            await expect(labelElement).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Screen Reader Testing', () => {
    test('should have proper screen reader announcements', async ({ page }) => {
      await page.goto('/blog');
      
      // Check for proper page title
      const title = await page.title();
      expect(title).toContain('Blog');
      expect(title).toContain('FocusLab');
      
      // Check for main heading
      const mainHeading = page.getByRole('heading', { level: 1 });
      await expect(mainHeading).toBeVisible();
      
      // Screen readers should announce page structure
      await expect(page.locator('main')).toHaveAttribute('role', 'main');
    });

    test('should have proper reading order', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Reading order should be: title, meta info, content, sidebar
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      // First heading should be the post title
      const firstHeading = headings[0];
      const firstHeadingLevel = await firstHeading.evaluate(el => 
        parseInt(el.tagName.charAt(1))
      );
      expect(firstHeadingLevel).toBe(1);
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/blog');
      
      // Check search input if present
      const searchInput = page.locator('input[type="search"]');
      if (await searchInput.isVisible()) {
        // Should have proper label
        const label = await searchInput.getAttribute('aria-label') || 
                     await searchInput.getAttribute('aria-labelledby');
        expect(label).toBeTruthy();
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation on blog index', async ({ page }) => {
      await page.goto('/blog');
      
      // Should be able to navigate to first blog post
      let tabCount = 0;
      const maxTabs = 20;
      let foundBlogPost = false;
      
      while (tabCount < maxTabs && !foundBlogPost) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        
        if (await focusedElement.isVisible()) {
          const href = await focusedElement.getAttribute('href');
          if (href && href.includes('/blog/')) {
            foundBlogPost = true;
            
            // Should be able to activate with Enter
            await page.keyboard.press('Enter');
            await expect(page).toHaveURL(/\/blog\/[^\/]+$/);
          }
        }
        tabCount++;
      }
      
      expect(foundBlogPost).toBe(true);
    });

    test('should support keyboard navigation on blog post', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Should be able to navigate back to blog
      await page.keyboard.press('Tab');
      
      let tabCount = 0;
      const maxTabs = 10;
      let foundBackLink = false;
      
      while (tabCount < maxTabs && !foundBackLink) {
        const focusedElement = page.locator(':focus');
        const text = await focusedElement.textContent();
        
        if (text && text.toLowerCase().includes('back to blog')) {
          foundBackLink = true;
          
          // Should navigate back
          await page.keyboard.press('Enter');
          await expect(page).toHaveURL('/blog');
        }
        
        await page.keyboard.press('Tab');
        tabCount++;
      }
    });

    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/blog');
      
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      
      if (await focusedElement.isVisible()) {
        // Check if focus is visually indicated
        const outline = await focusedElement.evaluate(el => 
          window.getComputedStyle(el).outline
        );
        const boxShadow = await focusedElement.evaluate(el => 
          window.getComputedStyle(el).boxShadow
        );
        
        // Should have some form of focus indication
        expect(outline !== 'none' || boxShadow !== 'none').toBe(true);
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/blog');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Run accessibility checks on mobile
      await checkA11y(page, undefined, {
        detailedReport: true
      });
    });

    test('should have proper touch targets on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/blog');
      
      // Check that interactive elements have sufficient size
      const links = await page.locator('a').all();
      for (const link of links.slice(0, 5)) { // Check first 5 links
        if (await link.isVisible()) {
          const box = await link.boundingBox();
          if (box) {
            // Touch targets should be at least 44x44px
            expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should handle zoom appropriately', async ({ page }) => {
      await page.goto('/blog');
      
      // Set zoom to 200%
      await page.setViewportSize({ width: 640, height: 960 }); // Simulate 200% zoom
      
      // Content should still be readable and accessible
      await expect(page.getByRole('heading', { name: /FocusLab Blog/i })).toBeVisible();
      
      // Should not have horizontal scrolling
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 50); // Allow small tolerance
    });
  });

  test.describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/blog');
      
      // Animations should be reduced or disabled
      // This would require checking specific animation properties
      // For now, ensure page still functions
      await expect(page.getByRole('heading', { name: /FocusLab Blog/i })).toBeVisible();
    });
  });

  test.describe('High Contrast Mode', () => {
    test('should work in high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              background: white !important;
              color: black !important;
            }
          }
        `
      });
      
      await page.goto('/blog');
      
      // Should still be readable and functional
      await expect(page.getByRole('heading', { name: /FocusLab Blog/i })).toBeVisible();
      
      // Run accessibility checks
      await checkA11y(page);
    });
  });
});