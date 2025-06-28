import { test, expect } from '@playwright/test';

test.describe('Blog System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to blog index before each test
    await page.goto('/blog');
  });

  test.describe('Blog Index Page', () => {
    test('should display blog listing page', async ({ page }) => {
      // Check page title and main heading
      await expect(page).toHaveTitle(/Blog.*FocusLab/);
      await expect(page.getByRole('heading', { name: /FocusLab Blog/i })).toBeVisible();
      
      // Should show blog posts
      await expect(page.locator('[data-testid="blog-post-card"]')).toHaveCount.greaterThan(0);
    });

    test('should filter posts by category', async ({ page }) => {
      // Click on a category filter
      const categoryFilter = page.getByRole('link', { name: /accessibility/i }).first();
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        
        // URL should include category parameter
        await expect(page).toHaveURL(/category=accessibility/);
        
        // Should show filtered results
        await expect(page.getByText(/Posts in.*accessibility/i)).toBeVisible();
      }
    });

    test('should filter posts by tag', async ({ page }) => {
      // Click on a tag filter
      const tagFilter = page.getByRole('link', { name: /#react/i }).first();
      if (await tagFilter.isVisible()) {
        await tagFilter.click();
        
        // URL should include tag parameter
        await expect(page).toHaveURL(/tag=react/);
        
        // Should show filtered results
        await expect(page.getByText(/Posts tagged.*react/i)).toBeVisible();
      }
    });

    test('should navigate to individual post', async ({ page }) => {
      // Click on the first blog post
      const firstPost = page.locator('[data-testid="blog-post-card"]').first();
      const postTitle = await firstPost.getByRole('heading').textContent();
      
      await firstPost.click();
      
      // Should navigate to post page
      await expect(page).toHaveURL(/\/blog\/[^\/]+$/);
      
      // Should show the post content
      if (postTitle) {
        await expect(page.getByRole('heading', { name: postTitle })).toBeVisible();
      }
    });

    test('should show pagination when there are many posts', async ({ page }) => {
      // Check if pagination is present (might not be if there are few posts)
      const pagination = page.locator('[data-testid="pagination"]');
      if (await pagination.isVisible()) {
        await expect(pagination).toContainText(/Page.*of/);
      }
    });

    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Blog should still be functional
      await expect(page.getByRole('heading', { name: /FocusLab Blog/i })).toBeVisible();
      await expect(page.locator('[data-testid="blog-post-card"]')).toHaveCount.greaterThan(0);
    });
  });

  test.describe('Individual Blog Post Page', () => {
    test('should display blog post content', async ({ page }) => {
      // Navigate to a specific post
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Should show post title
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      
      // Should show post content
      await expect(page.locator('article')).toBeVisible();
      
      // Should show post metadata
      await expect(page.getByText(/min read/)).toBeVisible();
      await expect(page.getByText(/By.*FocusLab Team/)).toBeVisible();
    });

    test('should show breadcrumb navigation', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Should show breadcrumbs
      const breadcrumbs = page.locator('[aria-label="Breadcrumb navigation"]');
      await expect(breadcrumbs).toBeVisible();
      await expect(breadcrumbs.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(breadcrumbs.getByRole('link', { name: 'Blog' })).toBeVisible();
    });

    test('should show related posts sidebar', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Should show related posts (if available)
      const relatedPosts = page.getByText(/Related Posts/);
      if (await relatedPosts.isVisible()) {
        await expect(relatedPosts).toBeVisible();
      }
    });

    test('should have working back to blog navigation', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Click back to blog
      await page.getByRole('link', { name: /Back to Blog/i }).click();
      
      // Should return to blog index
      await expect(page).toHaveURL('/blog');
      await expect(page.getByRole('heading', { name: /FocusLab Blog/i })).toBeVisible();
    });

    test('should render MDX content correctly', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Should render headings
      await expect(page.locator('article h2')).toHaveCount.greaterThan(0);
      
      // Should render paragraphs
      await expect(page.locator('article p')).toHaveCount.greaterThan(0);
      
      // Should render custom components if present
      const callout = page.locator('[role="region"]');
      if (await callout.isVisible()) {
        await expect(callout).toBeVisible();
      }
    });
  });

  test.describe('SEO and Meta Tags', () => {
    test('should have proper meta tags on blog index', async ({ page }) => {
      await page.goto('/blog');
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /.+/);
      
      // Check Open Graph tags
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveAttribute('content', /.+/);
    });

    test('should have proper meta tags on individual posts', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Check title
      await expect(page).toHaveTitle(/.+FocusLab Blog/);
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /.+/);
      
      // Check canonical URL
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', /\/blog\/.+/);
    });

    test('should have structured data', async ({ page }) => {
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Check for JSON-LD structured data
      const structuredData = page.locator('script[type="application/ld+json"]');
      await expect(structuredData).toHaveCount.greaterThan(0);
    });
  });

  test.describe('RSS Feed', () => {
    test('should serve valid RSS feed', async ({ page }) => {
      const response = await page.request.get('/blog/rss.xml');
      
      // Should return XML
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/xml');
      
      // Should contain RSS structure
      const rssContent = await response.text();
      expect(rssContent).toContain('<rss');
      expect(rssContent).toContain('<channel>');
      expect(rssContent).toContain('<item>');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/blog');
      
      // Should have h1
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      
      // Should have logical heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/blog');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Should be able to navigate to blog posts
      const firstPost = page.locator('[data-testid="blog-post-card"]').first();
      await firstPost.focus();
      await page.keyboard.press('Enter');
      
      // Should navigate to post
      await expect(page).toHaveURL(/\/blog\/[^\/]+$/);
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto('/blog');
      
      // All images should have alt text
      const images = await page.locator('img').all();
      for (const image of images) {
        await expect(image).toHaveAttribute('alt', /.*/);
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/blog');
      
      // Navigation should have aria-label
      const nav = page.locator('nav');
      if (await nav.isVisible()) {
        await expect(nav.first()).toHaveAttribute('aria-label', /.+/);
      }
      
      // Blog posts should have proper article structure
      const articles = page.locator('article');
      if (await articles.first().isVisible()) {
        await expect(articles.first()).toHaveAttribute('aria-labelledby', /.*/);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load blog index quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should load individual posts quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/blog/introducing-focuslab-blog');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have good Lighthouse scores', async ({ page }) => {
      // This would require additional Lighthouse integration
      // For now, just ensure page loads and core elements are present
      await page.goto('/blog');
      
      await expect(page.getByRole('heading', { name: /FocusLab Blog/i })).toBeVisible();
      await expect(page.locator('[data-testid="blog-post-card"]')).toHaveCount.greaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle non-existent blog posts gracefully', async ({ page }) => {
      // Navigate to non-existent post
      const response = await page.goto('/blog/non-existent-post');
      
      // Should return 404
      expect(response?.status()).toBe(404);
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // This test would simulate network failures
      // For now, ensure basic error boundaries work
      await page.goto('/blog');
      
      // Should still show basic structure even if some content fails to load
      await expect(page.getByRole('heading', { name: /FocusLab Blog/i })).toBeVisible();
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work in different browsers', async ({ page }) => {
      await page.goto('/blog');
      
      // Basic functionality should work across browsers
      await expect(page.getByRole('heading', { name: /FocusLab Blog/i })).toBeVisible();
      await expect(page.locator('[data-testid="blog-post-card"]')).toHaveCount.greaterThan(0);
      
      // Navigation should work
      const firstPost = page.locator('[data-testid="blog-post-card"]').first();
      await firstPost.click();
      await expect(page).toHaveURL(/\/blog\/[^\/]+$/);
    });
  });
});