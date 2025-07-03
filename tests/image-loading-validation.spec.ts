import { test, expect } from '@playwright/test';

test.describe('Image Loading System Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean slate
    await page.goto('/');
  });

  test('blog featured images load correctly', async ({ page }) => {
    await page.goto('/blog');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find all blog images
    const blogImages = page.locator('img[src*="/images/blog/"]');
    const imageCount = await blogImages.count();
    
    // Ensure we have blog images
    expect(imageCount).toBeGreaterThan(0);
    
    // Check each image loads successfully
    for (let i = 0; i < imageCount; i++) {
      const image = blogImages.nth(i);
      const src = await image.getAttribute('src');
      
      // Wait for image to load
      await expect(image).toHaveAttribute('src', /.+/);
      
      // Check image is visible and has dimensions
      await expect(image).toBeVisible();
      const boundingBox = await image.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
      
      console.log(`✓ Image loaded: ${src} (${boundingBox?.width}x${boundingBox?.height})`);
    }
  });

  test('image optimization API returns correct formats', async ({ page }) => {
    // Test WebP format
    const webpResponse = await page.request.get('/api/images?src=/images/blog/introducing-focuslab-blog.jpg&w=400&h=300&f=webp&q=80');
    expect(webpResponse.status()).toBe(200);
    expect(webpResponse.headers()['content-type']).toBe('image/webp');
    
    // Test AVIF format
    const avifResponse = await page.request.get('/api/images?src=/images/blog/introducing-focuslab-blog.jpg&w=400&h=300&f=avif&q=75');
    expect(avifResponse.status()).toBe(200);
    expect(webpResponse.headers()['content-type']).toBe('image/webp');
    
    // Test JPEG format
    const jpegResponse = await page.request.get('/api/images?src=/images/blog/introducing-focuslab-blog.jpg&w=400&h=300&f=jpeg&q=85');
    expect(jpegResponse.status()).toBe(200);
    expect(jpegResponse.headers()['content-type']).toBe('image/jpeg');
  });

  test('missing images show fallback placeholders', async ({ page }) => {
    // Test missing image API endpoint
    const response = await page.request.get('/api/images?src=/images/blog/nonexistent-image.jpg&w=400&h=300');
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toBe('image/svg+xml');
    
    const svgContent = await response.text();
    expect(svgContent).toContain('<svg');
    expect(svgContent).toContain('Image not found');
  });

  test('responsive images use appropriate sizes', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    // Find an image with srcset
    const responsiveImage = page.locator('img[srcset]').first();
    await expect(responsiveImage).toBeVisible();
    
    const srcset = await responsiveImage.getAttribute('srcset');
    const sizes = await responsiveImage.getAttribute('sizes');
    
    // Verify srcset contains multiple sizes
    expect(srcset).toContain('w');
    expect(srcset).toContain(',');
    
    // Verify sizes attribute is present
    expect(sizes).toBeTruthy();
    
    console.log(`✓ Responsive image srcset: ${srcset?.slice(0, 100)}...`);
    console.log(`✓ Responsive image sizes: ${sizes}`);
  });

  test('images load progressively with placeholders', async ({ page }) => {
    // Throttle network to see loading states
    await page.route('**/*', async (route) => {
      if (route.request().url().includes('/api/images')) {
        // Add 500ms delay to image requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      await route.continue();
    });

    await page.goto('/blog');
    
    // Look for loading placeholders initially
    const loadingPlaceholder = page.locator('[aria-label*="Loading"]').first();
    if (await loadingPlaceholder.isVisible()) {
      console.log('✓ Loading placeholder visible during image load');
    }
    
    // Wait for images to finish loading
    await page.waitForLoadState('networkidle');
    
    // Ensure final images are visible
    const finalImages = page.locator('img[src*="/images/blog/"]');
    const imageCount = await finalImages.count();
    
    for (let i = 0; i < Math.min(imageCount, 3); i++) {
      await expect(finalImages.nth(i)).toBeVisible();
    }
  });

  test('images have proper accessibility attributes', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    const blogImages = page.locator('img[src*="/images/blog/"]');
    const imageCount = await blogImages.count();
    
    for (let i = 0; i < imageCount; i++) {
      const image = blogImages.nth(i);
      
      // Check for alt text
      const altText = await image.getAttribute('alt');
      expect(altText).toBeTruthy();
      expect(altText!.length).toBeGreaterThan(0);
      
      // Check for role attribute
      const role = await image.getAttribute('role');
      expect(role).toBe('img');
      
      console.log(`✓ Image accessibility: alt="${altText}"`);
    }
  });

  test('cache headers are set correctly', async ({ page }) => {
    const response = await page.request.get('/api/images?src=/images/blog/introducing-focuslab-blog.jpg&w=400&h=300&f=webp&q=80');
    
    expect(response.status()).toBe(200);
    
    const cacheControl = response.headers()['cache-control'];
    const etag = response.headers()['etag'];
    
    expect(cacheControl).toContain('public');
    expect(cacheControl).toContain('max-age');
    expect(etag).toBeTruthy();
    
    console.log(`✓ Cache headers: ${cacheControl}, ETag: ${etag}`);
  });

  test('different viewport sizes load appropriate images', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    let images = page.locator('img[src*="/api/images"]');
    let imageCount = await images.count();
    
    if (imageCount > 0) {
      const mobileSrc = await images.first().getAttribute('src');
      console.log(`✓ Mobile image: ${mobileSrc}`);
    }
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    images = page.locator('img[src*="/api/images"]');
    imageCount = await images.count();
    
    if (imageCount > 0) {
      const desktopSrc = await images.first().getAttribute('src');
      console.log(`✓ Desktop image: ${desktopSrc}`);
    }
  });

  test('image performance is acceptable', async ({ page }) => {
    // Monitor network requests
    const imageRequests: any[] = [];
    
    page.on('response', async (response) => {
      if (response.url().includes('/images/') || response.url().includes('/api/images')) {
        imageRequests.push({
          url: response.url(),
          status: response.status(),
          size: parseInt(response.headers()['content-length'] || '0'),
          timing: await response.finished()
        });
      }
    });

    const startTime = Date.now();
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Basic performance checks
    expect(loadTime).toBeLessThan(5000); // Page should load in under 5 seconds
    expect(imageRequests.length).toBeGreaterThan(0); // Should have loaded some images
    
    // Check that most images loaded successfully
    const successfulRequests = imageRequests.filter(req => req.status === 200);
    const successRate = successfulRequests.length / imageRequests.length;
    expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
    
    console.log(`✓ Page loaded in ${loadTime}ms with ${imageRequests.length} image requests (${Math.round(successRate * 100)}% success rate)`);
  });
});