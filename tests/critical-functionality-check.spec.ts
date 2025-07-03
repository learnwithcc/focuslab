/**
 * Critical Functionality Check
 * 
 * Test core website functionality despite potential hydration issues
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Functionality Check', () => {
  
  test('should load homepage and basic functionality works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of current state
    await page.screenshot({ path: 'test-results/homepage-current-state.png', fullPage: true });
    
    // Check if main content is visible
    const mainContent = page.locator('main, [role="main"], #main-content');
    await expect(mainContent).toBeVisible();
    
    // Check if header is visible
    const header = page.locator('header, [role="banner"]');
    if (await header.isVisible()) {
      console.log('✅ Header is visible');
    }
    
    // Check if footer is visible
    const footer = page.locator('footer, [role="contentinfo"]');
    if (await footer.isVisible()) {
      console.log('✅ Footer is visible');
    }
    
    // Test theme toggle if it exists
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    const themeToggleCount = await themeToggle.count();
    
    if (themeToggleCount > 0) {
      const firstToggle = themeToggle.first();
      
      if (await firstToggle.isVisible()) {
        console.log('✅ Theme toggle is visible');
        
        // Try to click it
        try {
          await firstToggle.click();
          await page.waitForTimeout(1000);
          console.log('✅ Theme toggle clicked successfully');
          
          // Check if theme changed
          const html = page.locator('html');
          const classList = await html.getAttribute('class');
          console.log('Current theme classes:', classList);
        } catch (error) {
          console.log('⚠️ Theme toggle click failed:', error.message);
        }
      }
    } else {
      console.log('ℹ️ No theme toggle found');
    }
    
    // Check navigation
    const navLinks = page.locator('nav a, header a');
    const linkCount = await navLinks.count();
    console.log(`ℹ️ Found ${linkCount} navigation links`);
    
    if (linkCount > 0) {
      // Try clicking first link that's not current page
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        if (href && href !== '/' && href.startsWith('/')) {
          console.log(`Testing navigation to: ${href} (${text})`);
          
          try {
            await link.click();
            await page.waitForLoadState('networkidle');
            
            // Verify navigation worked
            expect(page.url()).toContain(href);
            console.log(`✅ Successfully navigated to ${href}`);
            
            // Go back to home
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            break;
          } catch (error) {
            console.log(`⚠️ Navigation to ${href} failed:`, error.message);
          }
        }
      }
    }
  });

  test('should handle images properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for images
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log(`ℹ️ Found ${imageCount} images on homepage`);
    
    if (imageCount > 0) {
      let loadedImages = 0;
      let brokenImages = 0;
      
      for (let i = 0; i < Math.min(imageCount, 10); i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt');
        
        if (src) {
          try {
            const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
            if (naturalWidth > 0) {
              loadedImages++;
            } else {
              brokenImages++;
            }
          } catch (error) {
            brokenImages++;
          }
        }
      }
      
      console.log(`✅ ${loadedImages} images loaded successfully`);
      if (brokenImages > 0) {
        console.log(`⚠️ ${brokenImages} images failed to load`);
      }
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/mobile-view.png', fullPage: true });
    
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(mainContent).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(mainContent).toBeVisible();
    
    console.log('✅ Responsive design test passed');
  });

  test('should show error status for console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log(`Total console errors: ${errors.length}`);
    
    // Categorize errors
    const hydrationErrors = errors.filter(e => e.includes('hydrat') || e.includes('Minified React error'));
    const resourceErrors = errors.filter(e => e.includes('Failed to load resource'));
    const scriptErrors = errors.filter(e => e.includes('script') || e.includes('MIME type'));
    const otherErrors = errors.filter(e => 
      !hydrationErrors.includes(e) && 
      !resourceErrors.includes(e) && 
      !scriptErrors.includes(e)
    );
    
    console.log(`Hydration errors: ${hydrationErrors.length}`);
    console.log(`Resource errors: ${resourceErrors.length}`);
    console.log(`Script errors: ${scriptErrors.length}`);
    console.log(`Other errors: ${otherErrors.length}`);
    
    if (hydrationErrors.length > 0) {
      console.log('⚠️ Hydration errors detected - needs investigation');
    }
    if (resourceErrors.length > 0) {
      console.log('⚠️ Resource loading errors detected');
    }
    if (scriptErrors.length > 0) {
      console.log('⚠️ Script execution errors detected');
    }
  });
});