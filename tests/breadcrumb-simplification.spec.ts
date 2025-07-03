import { test, expect } from '@playwright/test';

test.describe('Simplified Blog Breadcrumb Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Enable accessibility tree for testing
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (compatible; AccessibilityTest/1.0)'
    });
  });

  test('should display simplified breadcrumbs on blog post pages', async ({ page }) => {
    // Test each blog post for simplified breadcrumb structure
    const blogPosts = [
      'introducing-focuslab-blog',
      'accessibility-first-design', 
      'mdx-powered-blogging'
    ];

    for (const slug of blogPosts) {
      await page.goto(`/blog/${slug}`);
      
      // Wait for breadcrumbs to load
      await page.waitForSelector('[aria-label="Breadcrumb navigation"]', { timeout: 10000 });
      
      // Get all breadcrumb items
      const breadcrumbItems = await page.locator('[aria-label="Breadcrumb navigation"] ol li').all();
      
      // Should have exactly 3 items: Home > Blog > Post Title (no category)
      expect(breadcrumbItems).toHaveLength(3);
      
      // Verify structure
      const homeLink = breadcrumbItems[0].locator('a');
      const blogLink = breadcrumbItems[1].locator('a');
      const currentPage = breadcrumbItems[2].locator('[aria-current="page"]');
      
      // Check Home link
      await expect(homeLink).toHaveText('Home');
      await expect(homeLink).toHaveAttribute('href', '/');
      
      // Check Blog link
      await expect(blogLink).toHaveText('Blog');
      await expect(blogLink).toHaveAttribute('href', '/blog');
      
      // Check current page (post title)
      await expect(currentPage).toBeVisible();
      await expect(currentPage).toHaveAttribute('aria-current', 'page');
      
      // Ensure no category breadcrumb exists
      const breadcrumbText = await page.locator('[aria-label="Breadcrumb navigation"]').textContent();
      expect(breadcrumbText).not.toContain('announcements');
      expect(breadcrumbText).not.toContain('accessibility');
      expect(breadcrumbText).not.toContain('development');
      
      console.log(`✓ Verified simplified breadcrumbs for ${slug}`);
    }
  });

  test('should maintain proper semantic HTML structure', async ({ page }) => {
    await page.goto('/blog/introducing-focuslab-blog');
    
    // Check ARIA structure
    const nav = page.locator('[aria-label="Breadcrumb navigation"]');
    await expect(nav).toBeVisible();
    
    // Check schema.org structure
    const breadcrumbList = page.locator('[itemscope][itemtype="https://schema.org/BreadcrumbList"]');
    await expect(breadcrumbList).toBeVisible();
    
    // Check list items have proper schema markup
    const listItems = page.locator('[itemscope][itemtype="https://schema.org/ListItem"]');
    await expect(listItems).toHaveCount(3);
    
    // Verify position metadata
    const positions = await page.locator('[itemprop="position"]').all();
    expect(positions).toHaveLength(3);
    
    for (let i = 0; i < positions.length; i++) {
      await expect(positions[i]).toHaveAttribute('content', (i + 1).toString());
    }
  });

  test('should provide proper keyboard navigation', async ({ page }) => {
    await page.goto('/blog/accessibility-first-design');
    
    // Focus on first breadcrumb link
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Navigate to breadcrumb
    
    const homeLink = page.locator('[aria-label="Breadcrumb navigation"] a').first();
    await expect(homeLink).toBeFocused();
    
    // Tab to next breadcrumb link
    await page.keyboard.press('Tab');
    const blogLink = page.locator('[aria-label="Breadcrumb navigation"] a').nth(1);
    await expect(blogLink).toBeFocused();
    
    // Verify links are functional with keyboard
    await page.keyboard.press('Enter');
    await page.waitForURL('/blog');
    await expect(page).toHaveURL('/blog');
  });

  test('should work correctly on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/blog/mdx-powered-blogging');
    
    // Check breadcrumbs are visible and readable on mobile
    const breadcrumbNav = page.locator('[aria-label="Breadcrumb navigation"]');
    await expect(breadcrumbNav).toBeVisible();
    
    // Check for text overflow or layout issues
    const breadcrumbText = await breadcrumbNav.textContent();
    expect(breadcrumbText).toBeTruthy();
    
    // Verify touch targets are appropriately sized
    const links = page.locator('[aria-label="Breadcrumb navigation"] a');
    for (const link of await links.all()) {
      const box = await link.boundingBox();
      expect(box?.height).toBeGreaterThan(44); // Minimum touch target size
    }
  });

  test('should handle long post titles gracefully', async ({ page }) => {
    await page.goto('/blog/accessibility-first-design');
    
    // This post has a longer title: "Accessibility-First Design: Building for Every Brain"
    const currentPageSpan = page.locator('[aria-current="page"]');
    await expect(currentPageSpan).toBeVisible();
    
    // Check that long titles don't break layout
    const breadcrumbContainer = page.locator('[aria-label="Breadcrumb navigation"]');
    const containerBox = await breadcrumbContainer.boundingBox();
    const spanBox = await currentPageSpan.boundingBox();
    
    // Title should fit within container boundaries
    expect(spanBox?.x).toBeGreaterThanOrEqual(containerBox?.x || 0);
    expect((spanBox?.x || 0) + (spanBox?.width || 0)).toBeLessThanOrEqual((containerBox?.x || 0) + (containerBox?.width || 0));
  });

  test('should maintain consistent styling across themes', async ({ page }) => {
    await page.goto('/blog/introducing-focuslab-blog');
    
    // Test light theme
    const breadcrumbNav = page.locator('[aria-label="Breadcrumb navigation"]');
    await expect(breadcrumbNav).toBeVisible();
    
    // Switch to dark theme
    await page.locator('[aria-label="Toggle theme"]').click();
    await page.waitForTimeout(500); // Allow theme transition
    
    // Verify breadcrumbs still visible and functional in dark theme
    await expect(breadcrumbNav).toBeVisible();
    
    // Test link functionality in dark theme
    const blogLink = page.locator('[aria-label="Breadcrumb navigation"] a').nth(1);
    await blogLink.click();
    await page.waitForURL('/blog');
    await expect(page).toHaveURL('/blog');
  });

  test('should not show category in breadcrumb URL or text', async ({ page }) => {
    // Test all blog posts to ensure no category breadcrumbs
    const posts = await page.request.get('/blog');
    
    await page.goto('/blog/introducing-focuslab-blog');
    
    // Check breadcrumb links don't contain category filters
    const links = page.locator('[aria-label="Breadcrumb navigation"] a');
    
    for (const link of await links.all()) {
      const href = await link.getAttribute('href');
      expect(href).not.toContain('category=');
      expect(href).not.toContain('announcements');
      expect(href).not.toContain('accessibility');
      expect(href).not.toContain('development');
    }
    
    // Verify clean breadcrumb text
    const breadcrumbText = await page.locator('[aria-label="Breadcrumb navigation"]').textContent();
    expect(breadcrumbText?.replace(/\s+/g, ' ').trim()).toMatch(/^Home\s*[>›]\s*Blog\s*[>›]\s*.+$/);
  });

  test('should generate correct structured data for SEO', async ({ page }) => {
    await page.goto('/blog/accessibility-first-design');
    
    // Check for BreadcrumbList structured data
    const structuredData = await page.locator('script[type="application/ld+json"]').all();
    
    let foundBreadcrumbSchema = false;
    for (const script of structuredData) {
      const content = await script.textContent();
      if (content?.includes('BreadcrumbList')) {
        const data = JSON.parse(content);
        expect(data['@type']).toBe('BreadcrumbList');
        expect(data.itemListElement).toHaveLength(3); // Home, Blog, Post
        
        // Verify no category in structured data
        const breadcrumbNames = data.itemListElement.map((item: any) => item.name);
        expect(breadcrumbNames).not.toContain('announcements');
        expect(breadcrumbNames).not.toContain('accessibility');
        expect(breadcrumbNames).not.toContain('development');
        
        foundBreadcrumbSchema = true;
        break;
      }
    }
    
    expect(foundBreadcrumbSchema).toBe(true);
  });

  test('should maintain breadcrumb consistency on blog index page', async ({ page }) => {
    await page.goto('/blog');
    
    // Blog index should not have breadcrumbs or should show minimal ones
    const breadcrumbNav = page.locator('[aria-label="Breadcrumb navigation"]');
    
    // If breadcrumbs exist on blog index, they should be: Home > Blog (without third item)
    if (await breadcrumbNav.isVisible()) {
      const items = await page.locator('[aria-label="Breadcrumb navigation"] ol li').all();
      expect(items.length).toBeLessThanOrEqual(2); // Should not show a third level
    }
  });
});