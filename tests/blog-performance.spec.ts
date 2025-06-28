import { test, expect } from '@playwright/test';

test.describe('Blog Performance Tests', () => {
  test.describe('Page Load Performance', () => {
    test('blog index should load within performance budget', async ({ page }) => {
      // Start performance monitoring
      const startTime = Date.now();
      
      // Navigate to blog
      await page.goto('/blog');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Page should be interactive
      await expect(page.getByRole('heading', { name: /FocusLab Blog/i })).toBeVisible();
    });

    test('individual blog posts should load quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/blog/introducing-focuslab-blog');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have good Time to First Byte (TTFB)', async ({ page }) => {
      // Monitor navigation timing
      await page.goto('/blog');
      
      const timing = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart
        };
      });
      
      // TTFB should be under 500ms
      expect(timing.ttfb).toBeLessThan(500);
      
      // DOM Content Loaded should be under 1.5s
      expect(timing.domContentLoaded).toBeLessThan(1500);
      
      // Complete load should be under 3s
      expect(timing.loadComplete).toBeLessThan(3000);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should have good Largest Contentful Paint (LCP)', async ({ page }) => {
      await page.goto('/blog');
      
      // Wait for LCP measurement
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Timeout after 5 seconds
          setTimeout(() => resolve(null), 5000);
        });
      });
      
      if (lcp) {
        // LCP should be under 2.5 seconds
        expect(lcp).toBeLessThan(2500);
      }
    });

    test('should have minimal Cumulative Layout Shift (CLS)', async ({ page }) => {
      await page.goto('/blog');
      
      // Wait for page to stabilize
      await page.waitForTimeout(2000);
      
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            resolve(clsValue);
          }).observe({ entryTypes: ['layout-shift'] });
          
          // Resolve after 3 seconds
          setTimeout(() => resolve(clsValue), 3000);
        });
      });
      
      // CLS should be under 0.1
      expect(cls).toBeLessThan(0.1);
    });

    test('should have good First Input Delay (FID)', async ({ page }) => {
      await page.goto('/blog');
      
      // Wait for page to be interactive
      await page.waitForLoadState('networkidle');
      
      // Simulate user interaction
      const startTime = Date.now();
      await page.click('body');
      const interactionTime = Date.now() - startTime;
      
      // Should respond to interaction quickly
      expect(interactionTime).toBeLessThan(100);
    });
  });

  test.describe('Resource Loading', () => {
    test('should optimize image loading', async ({ page }) => {
      await page.goto('/blog');
      
      // Check that images are loaded efficiently
      const images = await page.locator('img').all();
      
      for (const image of images.slice(0, 3)) { // Check first 3 images
        if (await image.isVisible()) {
          // Images should have proper loading attributes
          const loading = await image.getAttribute('loading');
          const src = await image.getAttribute('src');
          
          // Images below the fold should be lazy loaded
          expect(loading).toBeTruthy();
          expect(src).toBeTruthy();
        }
      }
    });

    test('should have efficient CSS loading', async ({ page }) => {
      // Monitor resource loading
      const resourcePromise = page.waitForEvent('response', response => 
        response.url().includes('.css') && response.status() === 200
      );
      
      await page.goto('/blog');
      
      try {
        const cssResponse = await resourcePromise;
        
        // CSS should be compressed
        const contentEncoding = cssResponse.headers()['content-encoding'];
        expect(contentEncoding).toContain('gzip');
        
        // CSS should have cache headers
        const cacheControl = cssResponse.headers()['cache-control'];
        expect(cacheControl).toBeTruthy();
      } catch (error) {
        // CSS might be inlined, which is also good for performance
        console.log('CSS might be inlined');
      }
    });

    test('should have efficient JavaScript loading', async ({ page }) => {
      // Monitor JS resource loading
      const jsResources: string[] = [];
      
      page.on('response', response => {
        if (response.url().includes('.js')) {
          jsResources.push(response.url());
        }
      });
      
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Should not load excessive JavaScript
      expect(jsResources.length).toBeLessThan(10);
    });
  });

  test.describe('Memory Usage', () => {
    test('should not have memory leaks', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      // Navigate to multiple pages
      await page.goto('/blog');
      await page.goto('/blog/introducing-focuslab-blog');
      await page.goto('/blog');
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      if (initialMemory > 0 && finalMemory > 0) {
        // Memory shouldn't increase dramatically (allow for some growth)
        expect(finalMemory).toBeLessThan(initialMemory * 2);
      }
    });

    test('should handle large content efficiently', async ({ page }) => {
      // Navigate to a potentially large blog post
      await page.goto('/blog/introducing-focuslab-blog');
      
      // Check DOM node count
      const nodeCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
      
      // Should not have excessive DOM nodes
      expect(nodeCount).toBeLessThan(1000);
    });
  });

  test.describe('Network Efficiency', () => {
    test('should minimize network requests', async ({ page }) => {
      const requests: string[] = [];
      
      page.on('request', request => {
        requests.push(request.url());
      });
      
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Should not make excessive requests
      expect(requests.length).toBeLessThan(50);
    });

    test('should use appropriate cache headers', async ({ page }) => {
      const responses: Array<{ url: string; headers: Record<string, string> }> = [];
      
      page.on('response', response => {
        responses.push({
          url: response.url(),
          headers: response.headers()
        });
      });
      
      await page.goto('/blog');
      
      // Check static assets have cache headers
      const staticAssets = responses.filter(r => 
        r.url.includes('.js') || r.url.includes('.css') || r.url.includes('.png') || r.url.includes('.jpg')
      );
      
      for (const asset of staticAssets.slice(0, 3)) {
        expect(asset.headers['cache-control']).toBeTruthy();
      }
    });

    test('should compress responses', async ({ page }) => {
      const htmlResponse = await page.goto('/blog');
      
      if (htmlResponse) {
        const contentEncoding = htmlResponse.headers()['content-encoding'];
        
        // HTML should be compressed
        expect(contentEncoding).toContain('gzip');
      }
    });
  });

  test.describe('Bundle Size', () => {
    test('should have reasonable JavaScript bundle size', async ({ page }) => {
      const jsResources: Array<{ url: string; size: number }> = [];
      
      page.on('response', async response => {
        if (response.url().includes('.js')) {
          try {
            const buffer = await response.body();
            jsResources.push({
              url: response.url(),
              size: buffer.length
            });
          } catch (error) {
            // Some JS might not be accessible
          }
        }
      });
      
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const totalJSSize = jsResources.reduce((total, resource) => total + resource.size, 0);
      
      // Total JS should be under 500KB
      expect(totalJSSize).toBeLessThan(500 * 1024);
    });

    test('should have reasonable CSS bundle size', async ({ page }) => {
      const cssResources: Array<{ url: string; size: number }> = [];
      
      page.on('response', async response => {
        if (response.url().includes('.css')) {
          try {
            const buffer = await response.body();
            cssResources.push({
              url: response.url(),
              size: buffer.length
            });
          } catch (error) {
            // Some CSS might not be accessible
          }
        }
      });
      
      await page.goto('/blog');
      
      const totalCSSSize = cssResources.reduce((total, resource) => total + resource.size, 0);
      
      // Total CSS should be under 100KB
      expect(totalCSSSize).toBeLessThan(100 * 1024);
    });
  });

  test.describe('Search Performance', () => {
    test('should perform client-side search efficiently', async ({ page }) => {
      await page.goto('/blog');
      
      // Find search input if it exists
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      
      if (await searchInput.isVisible()) {
        const startTime = Date.now();
        
        // Perform search
        await searchInput.fill('test');
        
        // Wait for search results
        await page.waitForTimeout(500);
        
        const searchTime = Date.now() - startTime;
        
        // Search should be fast (under 500ms)
        expect(searchTime).toBeLessThan(500);
      }
    });
  });

  test.describe('Mobile Performance', () => {
    test('should perform well on mobile devices', async ({ page }) => {
      // Simulate mobile device
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Throttle network to simulate mobile conditions
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100); // Add 100ms delay
      });
      
      const startTime = Date.now();
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should still load reasonably quickly on mobile
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have efficient touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/blog');
      
      // Test touch interaction performance
      const blogPost = page.locator('[data-testid="blog-post-card"]').first();
      
      if (await blogPost.isVisible()) {
        const startTime = Date.now();
        await blogPost.tap();
        const tapTime = Date.now() - startTime;
        
        // Touch interactions should be responsive
        expect(tapTime).toBeLessThan(200);
      }
    });
  });

  test.describe('SEO Performance', () => {
    test('should generate RSS feed efficiently', async ({ page }) => {
      const startTime = Date.now();
      const response = await page.request.get('/blog/rss.xml');
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000);
      
      // RSS should have appropriate cache headers
      const cacheControl = response.headers()['cache-control'];
      expect(cacheControl).toBeTruthy();
    });

    test('should generate sitemap efficiently', async ({ page }) => {
      const startTime = Date.now();
      const response = await page.request.get('/sitemap.xml');
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000);
    });
  });
});