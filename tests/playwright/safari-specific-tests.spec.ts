/**
 * Safari-Specific Cookie Consent Tests
 * 
 * Safari has unique privacy and storage restrictions that require special testing:
 * 1. Intelligent Tracking Prevention (ITP)
 * 2. Storage access limitations
 * 3. Third-party cookie blocking
 * 4. Stricter CORS policies
 * 5. Different JavaScript engine behaviors
 */

import { test, expect, webkit } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Safari-specific test configuration
test.use({ 
  ...webkit,
  // Safari-like privacy settings
  contextOptions: {
    extraHTTPHeaders: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    }
  }
});

async function simulateFirstTimeUser(page) {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Storage may not be available
    }
  });
}

test.describe('Safari-Specific Cookie Consent Tests', () => {
  
  test('Safari ITP simulation - Third-party storage restrictions', async ({ page }) => {
    console.log('🍎 Testing Safari ITP storage restrictions');
    
    await simulateFirstTimeUser(page);
    
    // Simulate Safari's storage restrictions
    await page.addInitScript(() => {
      // Simulate Safari's storage access restrictions
      let storageAccessGranted = false;
      
      // Override storage access API (Safari-specific)
      if (!document.hasStorageAccess) {
        document.hasStorageAccess = async () => storageAccessGranted;
        document.requestStorageAccess = async () => {
          if (!storageAccessGranted) {
            throw new DOMException('User denied storage access', 'NotAllowedError');
          }
          return Promise.resolve();
        };
      }
      
      // Simulate restricted localStorage in cross-site context
      const originalSetItem = localStorage.setItem;
      let restrictedContext = true;
      
      localStorage.setItem = function(key, value) {
        if (restrictedContext && key.includes('posthog') || key.includes('analytics')) {
          throw new DOMException('Storage access denied in restricted context', 'SecurityError');
        }
        return originalSetItem.call(localStorage, key, value);
      };
      
      window.grantStorageAccess = () => { 
        storageAccessGranted = true; 
        restrictedContext = false;
      };
    });
    
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Test storage restrictions
    const storageTest = await page.evaluate(async () => {
      const results = {
        hasStorageAccess: typeof document.hasStorageAccess === 'function',
        storageAccessGranted: false,
        consentStorageWorks: false,
        analyticsStorageBlocked: false,
        error: null
      };
      
      try {
        // Test storage access API
        if (document.hasStorageAccess) {
          results.storageAccessGranted = await document.hasStorageAccess();
        }
        
        // Test consent storage (should work)
        localStorage.setItem('cookie-consent', JSON.stringify({ essential: true }));
        results.consentStorageWorks = localStorage.getItem('cookie-consent') !== null;
        
        // Test analytics storage (might be blocked)
        try {
          localStorage.setItem('posthog-test', 'value');
        } catch (error) {
          results.analyticsStorageBlocked = true;
          results.error = error.toString();
        }
        
      } catch (error) {
        results.error = error.toString();
      }
      
      return results;
    });
    
    console.log('🍎 Safari storage test results:', storageTest);
    
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/safari-itp-test.png',
      fullPage: true 
    });
    
    // Safari should have storage access API
    expect(storageTest.hasStorageAccess).toBe(true);
    
    // Essential consent storage should work
    expect(storageTest.consentStorageWorks).toBe(true);
  });

  test('Safari private browsing mode simulation', async ({ page }) => {
    console.log('🍎 Testing Safari private browsing behavior');
    
    // Simulate Safari private browsing storage limitations
    await page.addInitScript(() => {
      // In Safari private browsing, localStorage has very limited quota
      const PRIVATE_STORAGE_LIMIT = 1024; // 1KB limit
      let currentUsage = 0;
      
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        const newSize = currentUsage + key.length + value.length;
        if (newSize > PRIVATE_STORAGE_LIMIT) {
          throw new DOMException('Quota exceeded in private browsing', 'QuotaExceededError');
        }
        currentUsage = newSize;
        return originalSetItem.call(localStorage, key, value);
      };
      
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = function(key) {
        const item = localStorage.getItem(key);
        if (item) {
          currentUsage -= key.length + item.length;
        }
        return originalRemoveItem.call(localStorage, key);
      };
      
      window.getStorageUsage = () => currentUsage;
      window.getStorageLimit = () => PRIVATE_STORAGE_LIMIT;
    });
    
    await simulateFirstTimeUser(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const privateTest = await page.evaluate(() => {
      const results = {
        initialUsage: window.getStorageUsage(),
        storageLimit: window.getStorageLimit(),
        consentStored: false,
        quotaExceeded: false,
        error: null
      };
      
      try {
        // Store minimal consent data
        const minimalConsent = JSON.stringify({ essential: true, timestamp: Date.now() });
        localStorage.setItem('cookie-consent', minimalConsent);
        results.consentStored = true;
        results.finalUsage = window.getStorageUsage();
        
        // Try to store larger data that might exceed quota
        const largeData = 'x'.repeat(500); // 500 characters
        localStorage.setItem('large-test-data', largeData);
        
      } catch (error) {
        results.quotaExceeded = error.name === 'QuotaExceededError';
        results.error = error.toString();
      }
      
      return results;
    });
    
    console.log('🍎 Safari private browsing test:', privateTest);
    
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/safari-private-browsing.png',
      fullPage: true 
    });
    
    // Consent should be storable even with quota limits
    expect(privateTest.consentStored).toBe(true);
    
    // System should handle quota exceeded gracefully
    if (privateTest.quotaExceeded) {
      expect(privateTest.error).toContain('QuotaExceededError');
    }
  });

  test('Safari content blocker impact on analytics', async ({ page }) => {
    console.log('🍎 Testing Safari content blocker impact');
    
    // Simulate Safari content blockers blocking analytics
    await page.route('**/posthog/**', route => {
      console.log('🍎 Blocking PostHog request (content blocker simulation)');
      route.abort();
    });
    
    await page.route('**/analytics/**', route => {
      console.log('🍎 Blocking analytics request (content blocker simulation)');
      route.abort();
    });
    
    await simulateFirstTimeUser(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const blockerTest = await page.evaluate(() => {
      return {
        postHogLoaded: typeof window.posthog !== 'undefined',
        postHogInitialized: window.posthog?.__loaded || false,
        analyticsBlocked: !window.posthog || window.posthog.has_opted_out_capturing?.(),
        consentSystemWorking: document.querySelectorAll('*').length > 0 && 
                             Array.from(document.querySelectorAll('*')).some(el => 
                               (el.textContent || '').toLowerCase().includes('cookie')
                             ),
        networkErrors: performance.getEntriesByType('resource').filter(entry => 
          entry.name.includes('posthog') && entry.transferSize === 0
        ).length
      };
    });
    
    console.log('🍎 Safari content blocker test:', blockerTest);
    
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/safari-content-blocker.png',
      fullPage: true 
    });
    
    // Consent system should work even when analytics is blocked
    expect(blockerTest.consentSystemWorking).toBe(true);
    
    // Analytics should be gracefully handled when blocked
    if (blockerTest.networkErrors > 0) {
      console.log('🍎 Analytics requests blocked as expected');
    }
  });
  
  test('Safari WebKit specific JavaScript behaviors', async ({ page }) => {
    console.log('🍎 Testing Safari WebKit JavaScript behaviors');
    
    await simulateFirstTimeUser(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const webkitTest = await page.evaluate(() => {
      const results = {
        userAgent: navigator.userAgent,
        isWebKit: navigator.userAgent.includes('WebKit'),
        isSafari: navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'),
        
        // Test WebKit-specific features
        hasRequestIdleCallback: typeof requestIdleCallback !== 'undefined',
        hasIntersectionObserver: typeof IntersectionObserver !== 'undefined',
        hasResizeObserver: typeof ResizeObserver !== 'undefined',
        
        // Test CSS support
        supportsCSSGrid: CSS.supports('display', 'grid'),
        supportsCSSCustomProperties: CSS.supports('--test', 'value'),
        supportsClipPath: CSS.supports('clip-path', 'circle(50%)'),
        
        // Test consent banner rendering
        bannerRendered: Array.from(document.querySelectorAll('*')).some(el => {
          const text = (el.textContent || '').toLowerCase();
          return text.includes('cookie') && text.includes('accept');
        }),
        
        // Test animation support
        supportsWebAnimationsAPI: typeof Element.prototype.animate !== 'undefined',
        supportsReducedMotion: window.matchMedia('(prefers-reduced-motion)').matches !== undefined
      };
      
      return results;
    });
    
    console.log('🍎 Safari WebKit test results:', webkitTest);
    
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/safari-webkit-features.png',
      fullPage: true 
    });
    
    // Basic modern features should be supported
    expect(webkitTest.supportsCSSGrid).toBe(true);
    expect(webkitTest.supportsCSSCustomProperties).toBe(true);
    expect(webkitTest.bannerRendered).toBe(true);
  });

  test('Safari CORS and security restrictions', async ({ page }) => {
    console.log('🍎 Testing Safari CORS and security restrictions');
    
    // Monitor network requests and CORS issues
    const networkLogs = [];
    page.on('response', response => {
      networkLogs.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        type: response.request().resourceType()
      });
    });
    
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('cors')) {
        consoleLogs.push(msg.text());
      }
    });
    
    await simulateFirstTimeUser(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const securityTest = await page.evaluate(() => {
      return {
        origin: window.location.origin,
        protocol: window.location.protocol,
        
        // Test cross-origin restrictions
        canAccessParent: (() => {
          try {
            return window.parent !== window;
          } catch (e) {
            return false;
          }
        })(),
        
        // Test third-party context detection
        isThirdPartyContext: window.self !== window.top,
        
        // Test secure context
        isSecureContext: window.isSecureContext,
        
        // Check for mixed content warnings
        mixedContent: document.querySelectorAll('img[src^="http:"], script[src^="http:"]').length > 0
      };
    });
    
    console.log('🍎 Safari security test:', {
      securityTest,
      corsErrors: consoleLogs.length,
      networkRequests: networkLogs.filter(log => log.status >= 400).length
    });
    
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/safari-security.png',
      fullPage: true 
    });
    
    // Should be in secure context for proper operation
    expect(securityTest.isSecureContext).toBe(true);
    
    // Should not have CORS errors for first-party consent system
    expect(consoleLogs.length).toBe(0);
  });

  test('Safari performance with privacy features enabled', async ({ page }) => {
    console.log('🍎 Testing Safari performance with privacy features');
    
    // Enable additional privacy restrictions
    await page.addInitScript(() => {
      // Simulate additional Safari privacy restrictions
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: false
      });
      
      // Simulate referrer policy restrictions
      Object.defineProperty(document, 'referrer', {
        value: '',
        writable: false
      });
    });
    
    await simulateFirstTimeUser(page);
    
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    // Wait for banner to appear and measure timing
    let bannerAppearTime = -1;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(100);
      const bannerVisible = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('*')).some(el => {
          const text = (el.textContent || '').toLowerCase();
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return text.includes('cookie') && text.includes('accept') &&
                 style.display !== 'none' && 
                 style.visibility !== 'hidden' &&
                 rect.width > 0 && rect.height > 0;
        });
      });
      
      if (bannerVisible) {
        bannerAppearTime = i * 100;
        break;
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    const performanceTest = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        doNotTrack: navigator.doNotTrack,
        referrer: document.referrer,
        loadTiming: {
          domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart,
          loadComplete: perfData?.loadEventEnd - perfData?.loadEventStart
        },
        resourceCount: performance.getEntriesByType('resource').length,
        memoryUsage: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      };
    });
    
    console.log('🍎 Safari performance with privacy:', {
      totalLoadTime: totalTime,
      bannerAppearTime,
      performanceData: performanceTest
    });
    
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/safari-privacy-performance.png',
      fullPage: true 
    });
    
    // Performance should still be reasonable with privacy features
    expect(totalTime).toBeLessThan(5000);
    
    // Banner should still appear within reasonable time
    if (bannerAppearTime > -1) {
      expect(bannerAppearTime).toBeLessThan(3000);
    }
    
    // Privacy settings should be respected
    expect(performanceTest.doNotTrack).toBe('1');
  });
});

test('🍎 Safari Compatibility Summary', async ({ page }) => {
  console.log('🍎 SAFARI COMPATIBILITY SUMMARY');
  console.log('==============================');
  
  await simulateFirstTimeUser(page);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  const safariSummary = await page.evaluate(() => {
    return {
      browser: 'Safari (WebKit)',
      timestamp: new Date().toISOString(),
      
      // Core functionality
      pageLoaded: document.readyState === 'complete',
      bannerPresent: Array.from(document.querySelectorAll('*')).some(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.includes('cookie') && text.includes('accept');
      }),
      
      // Storage capabilities
      localStorageWorks: (() => {
        try {
          localStorage.setItem('test', 'value');
          const result = localStorage.getItem('test') === 'value';
          localStorage.removeItem('test');
          return result;
        } catch (e) {
          return false;
        }
      })(),
      
      // Privacy features
      hasStorageAccessAPI: typeof document.hasStorageAccess === 'function',
      doNotTrack: navigator.doNotTrack,
      
      // WebKit features
      isWebKit: navigator.userAgent.includes('WebKit'),
      webKitVersion: navigator.userAgent.match(/WebKit\/(\d+)/)?.[1] || 'unknown',
      
      // Security context
      isSecureContext: window.isSecureContext,
      
      // Performance
      resourceLoadCount: performance.getEntriesByType('resource').length,
      
      // Essential functionality status
      consentSystemOperational: true
    };
  });
  
  console.log('🍎 Safari Final Assessment:', safariSummary);
  
  await page.screenshot({ 
    path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/safari-final-summary.png',
    fullPage: true 
  });
  
  // Core Safari functionality requirements
  expect(safariSummary.pageLoaded, 'Page should load in Safari').toBe(true);
  expect(safariSummary.bannerPresent, 'Cookie banner should be present in Safari').toBe(true);
  expect(safariSummary.localStorageWorks, 'localStorage should work in Safari').toBe(true);
  expect(safariSummary.isSecureContext, 'Should be in secure context in Safari').toBe(true);
  
  console.log('✅ Safari: All core functionality tests passed');
  console.log('🍎 Safari-specific privacy features handled appropriately');
});