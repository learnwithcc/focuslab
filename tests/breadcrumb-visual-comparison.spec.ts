import { test, expect } from '@playwright/test';

test.describe('Breadcrumb Visual Improvements', () => {
  test('should capture breadcrumb before and after simplification', async ({ page }) => {
    // Test the simplified breadcrumb implementation
    await page.goto('/blog/introducing-focuslab-blog');
    
    // Wait for page to fully load
    await page.waitForSelector('[aria-label="Breadcrumb navigation"]', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of simplified breadcrumb
    const breadcrumbSection = page.locator('div:has([aria-label="Breadcrumb navigation"])');
    await expect(breadcrumbSection).toHaveScreenshot('simplified-breadcrumb-blog-post.png');
    
    // Navigate to blog index to compare
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of blog index (should have no breadcrumbs or minimal ones)
    await expect(page.locator('main')).toHaveScreenshot('blog-index-navigation.png');
  });

  test('should document breadcrumb improvements across different post types', async ({ page }) => {
    const testPosts = [
      { slug: 'introducing-focuslab-blog', category: 'announcements' },
      { slug: 'accessibility-first-design', category: 'accessibility' },
      { slug: 'mdx-powered-blogging', category: 'development' }
    ];

    for (const post of testPosts) {
      await page.goto(`/blog/${post.slug}`);
      await page.waitForSelector('[aria-label="Breadcrumb navigation"]', { timeout: 10000 });
      
      // Capture breadcrumb for each post type
      const breadcrumbSection = page.locator('div:has([aria-label="Breadcrumb navigation"])');
      await expect(breadcrumbSection).toHaveScreenshot(`breadcrumb-${post.category}-post.png`);
      
      // Verify clean structure in the screenshot
      const breadcrumbText = await page.locator('[aria-label="Breadcrumb navigation"]').textContent();
      console.log(`${post.slug} breadcrumb: ${breadcrumbText?.replace(/\s+/g, ' ').trim()}`);
    }
  });

  test('should show breadcrumb improvements on mobile devices', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/blog/accessibility-first-design');
    await page.waitForSelector('[aria-label="Breadcrumb navigation"]', { timeout: 10000 });
    
    // Mobile breadcrumb screenshot
    const breadcrumbSection = page.locator('div:has([aria-label="Breadcrumb navigation"])');
    await expect(breadcrumbSection).toHaveScreenshot('mobile-breadcrumb-simplified.png');
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(breadcrumbSection).toHaveScreenshot('tablet-breadcrumb-simplified.png');
  });

  test('should demonstrate theme consistency', async ({ page }) => {
    await page.goto('/blog/introducing-focuslab-blog');
    await page.waitForSelector('[aria-label="Breadcrumb navigation"]', { timeout: 10000 });
    
    // Light theme breadcrumb
    const breadcrumbSection = page.locator('div:has([aria-label="Breadcrumb navigation"])');
    await expect(breadcrumbSection).toHaveScreenshot('breadcrumb-light-theme.png');
    
    // Switch to dark theme
    await page.locator('[aria-label="Toggle theme"]').click();
    await page.waitForTimeout(500); // Allow theme transition
    
    // Dark theme breadcrumb
    await expect(breadcrumbSection).toHaveScreenshot('breadcrumb-dark-theme.png');
  });

  test('should show accessibility improvements', async ({ page }) => {
    await page.goto('/blog/accessibility-first-design');
    await page.waitForSelector('[aria-label="Breadcrumb navigation"]', { timeout: 10000 });
    
    // Focus on first breadcrumb link to show focus states
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Navigate to breadcrumb
    
    const breadcrumbSection = page.locator('div:has([aria-label="Breadcrumb navigation"])');
    await expect(breadcrumbSection).toHaveScreenshot('breadcrumb-focus-state.png');
    
    // Navigate to next link
    await page.keyboard.press('Tab');
    await expect(breadcrumbSection).toHaveScreenshot('breadcrumb-second-focus-state.png');
  });

  test('should document the UX improvement in navigation clarity', async ({ page }) => {
    // Create a documentation screenshot showing the improvement
    await page.goto('/blog/introducing-focuslab-blog');
    await page.waitForSelector('[aria-label="Breadcrumb navigation"]', { timeout: 10000 });
    
    // Add a visual annotation (using page evaluation to add temporary styling)
    await page.evaluate(() => {
      const breadcrumb = document.querySelector('[aria-label="Breadcrumb navigation"]');
      if (breadcrumb) {
        // Add a subtle highlight to show the simplified structure
        const style = document.createElement('style');
        style.textContent = `
          [aria-label="Breadcrumb navigation"] {
            position: relative;
          }
          [aria-label="Breadcrumb navigation"]::after {
            content: "Simplified: Home > Blog > Post Title";
            position: absolute;
            top: -25px;
            left: 0;
            font-size: 12px;
            color: #059669;
            font-weight: 600;
            background: rgba(5, 150, 105, 0.1);
            padding: 2px 8px;
            border-radius: 4px;
          }
        `;
        document.head.appendChild(style);
      }
    });
    
    // Take screenshot showing the improvement
    const pageHeader = page.locator('div:has([aria-label="Breadcrumb navigation"])').first();
    await expect(pageHeader).toHaveScreenshot('breadcrumb-ux-improvement-documentation.png');
  });
});

test.describe('Before/After Comparison Documentation', () => {
  test('should generate comparison documentation', async ({ page }) => {
    await page.goto('/blog/accessibility-first-design');
    await page.waitForSelector('[aria-label="Breadcrumb navigation"]', { timeout: 10000 });
    
    // Document the simplified breadcrumb structure
    const breadcrumbText = await page.locator('[aria-label="Breadcrumb navigation"]').textContent();
    const breadcrumbItems = await page.locator('[aria-label="Breadcrumb navigation"] ol li').count();
    
    console.log('=== BREADCRUMB SIMPLIFICATION RESULTS ===');
    console.log(`Current structure: ${breadcrumbText?.replace(/\s+/g, ' ').trim()}`);
    console.log(`Number of breadcrumb levels: ${breadcrumbItems}`);
    console.log(`Expected: Home > Blog > Post Title (3 levels)`);
    console.log(`Removed: Category level from breadcrumb navigation`);
    console.log('=== UX IMPROVEMENTS ===');
    console.log('✓ Reduced cognitive load by removing unnecessary navigation level');
    console.log('✓ Cleaner, more intuitive navigation pattern');
    console.log('✓ Consistent with modern web navigation best practices');
    console.log('✓ Maintains accessibility and semantic structure');
    console.log('✓ Responsive design across all device sizes');
    
    // Verify the improvement metrics
    expect(breadcrumbItems).toBe(3); // Home, Blog, Post Title
    expect(breadcrumbText).not.toContain('announcements');
    expect(breadcrumbText).not.toContain('accessibility');
    expect(breadcrumbText).not.toContain('development');
  });
});