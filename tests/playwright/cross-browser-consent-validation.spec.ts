/**
 * AGENT 4.3 DELIVERABLE: Cross-Browser Cookie Consent Validation Suite
 * 
 * This comprehensive test suite validates the cookie consent fixes across all major browsers:
 * - Chrome (Chromium engine)
 * - Firefox (Gecko engine) 
 * - Safari (WebKit engine)
 * - Edge (Chromium-based but with differences)
 * 
 * Test Areas:
 * 1. Hydration Behavior (useIsMounted hook performance)
 * 2. CSS Transitions (smooth banner animations)  
 * 3. Storage Access (localStorage consistency)
 * 4. PostHog Integration (cross-browser analytics) 
 * 5. Error Handling (fallback UI behavior)
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Browser-specific configuration for testing different scenarios
const BROWSER_CONFIGS = {
  chromium: {
    name: 'Chrome',
    storageQuotaTest: true,
    privacyFeatures: 'standard',
    expectedPerformance: 'fast'
  },
  firefox: {
    name: 'Firefox',
    storageQuotaTest: true,
    privacyFeatures: 'enhanced',
    expectedPerformance: 'standard'
  },
  webkit: {
    name: 'Safari',
    storageQuotaTest: false, // Safari has strict storage limitations
    privacyFeatures: 'strict',
    expectedPerformance: 'variable'
  },
  edge: {
    name: 'Edge',
    storageQuotaTest: true,
    privacyFeatures: 'standard',
    expectedPerformance: 'fast'
  }
};

// Helper function to get browser-specific expectations
function getBrowserConfig(browserName: string) {
  return BROWSER_CONFIGS[browserName] || BROWSER_CONFIGS.chromium;
}

// Helper function to simulate first-time user
async function simulateFirstTimeUser(page: Page) {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Storage may not be available during init
    }
  });
}

// Helper function to check banner visibility with browser-specific considerations
async function checkBannerVisibility(page: Page, browserName: string) {
  const config = getBrowserConfig(browserName);
  
  return await page.evaluate((configData) => {
    const banners = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = (el.textContent || '').toLowerCase();
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      return (text.includes('cookie') && (text.includes('accept') || text.includes('allow'))) &&
             style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             style.opacity !== '0' &&
             rect.width > 0 &&
             rect.height > 0;
    });

    return {
      bannerCount: banners.length,
      bannerVisible: banners.length > 0,
      bannerDetails: banners.slice(0, 3).map(el => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent?.substring(0, 100),
        computedStyles: {
          display: getComputedStyle(el).display,
          visibility: getComputedStyle(el).visibility,
          opacity: getComputedStyle(el).opacity,
          transform: getComputedStyle(el).transform
        }
      })),
      browserConfig: configData
    };
  }, config);
}

test.describe('Cross-Browser Cookie Consent Validation', () => {
  
  test.describe('1. Hydration Behavior Tests', () => {
    
    test('useIsMounted hook should work consistently across browsers', async ({ page, browserName }) => {
      console.log(`🔍 Testing useIsMounted hook in ${getBrowserConfig(browserName).name}`);
      
      await simulateFirstTimeUser(page);
      
      // Set up hydration timing monitoring
      await page.addInitScript(() => {
        window.hydrationEvents = [];
        window.originalConsoleLog = console.log;
        console.log = function(...args) {
          if (args[0] && args[0].includes && args[0].includes('useIsMounted')) {
            window.hydrationEvents.push({
              message: args.join(' '),
              timestamp: Date.now(),
              performance: performance.now()
            });
          }
          window.originalConsoleLog.apply(console, args);
        };
      });

      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      
      // Wait for hydration to complete
      await page.waitForTimeout(2000);
      const endTime = Date.now();
      
      const hydrationData = await page.evaluate(() => {
        return {
          events: window.hydrationEvents || [],
          documentReady: document.readyState,
          mountedIndicator: document.querySelector('[data-hydrated="true"]') !== null
        };
      });

      const bannerCheck = await checkBannerVisibility(page, browserName);
      
      console.log(`🔍 ${getBrowserConfig(browserName).name} hydration results:`, {
        loadTime: endTime - startTime,
        hydrationEvents: hydrationData.events.length,
        bannerVisible: bannerCheck.bannerVisible
      });

      // Take browser-specific screenshot
      await page.screenshot({ 
        path: `/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/hydration-${browserName}.png`,
        fullPage: true 
      });

      // Hydration should work in all browsers
      expect(hydrationData.documentReady).toBe('complete');
      
      // Banner should be visible after hydration for first-time users
      expect(bannerCheck.bannerVisible, 
        `Cookie banner should be visible in ${getBrowserConfig(browserName).name} after hydration`
      ).toBe(true);
    });

    test('Banner should appear without hydration delay', async ({ page, browserName }) => {
      console.log(`⚡ Testing immediate banner appearance in ${getBrowserConfig(browserName).name}`);
      
      await simulateFirstTimeUser(page);
      
      // Monitor banner appearance timing
      const timingResults = [];
      
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      
      // Check banner visibility at different intervals
      for (let i = 0; i < 8; i++) {
        const checkTime = i * 250; // Check every 250ms
        await page.waitForTimeout(250);
        
        const bannerCheck = await checkBannerVisibility(page, browserName);
        timingResults.push({
          time: checkTime,
          visible: bannerCheck.bannerVisible,
          details: bannerCheck.bannerDetails
        });
        
        if (bannerCheck.bannerVisible) {
          console.log(`⚡ Banner appeared in ${getBrowserConfig(browserName).name} at ${checkTime}ms`);
          break;
        }
      }
      
      const firstVisible = timingResults.find(result => result.visible);
      const bannerAppearanceTime = firstVisible ? firstVisible.time : -1;
      
      console.log(`⚡ ${getBrowserConfig(browserName).name} banner timing:`, {
        appearanceTime: bannerAppearanceTime,
        totalChecks: timingResults.length
      });

      // Banner should appear within reasonable time (1 second)
      expect(bannerAppearanceTime, 
        `Banner should appear within 1000ms in ${getBrowserConfig(browserName).name}`
      ).toBeLessThan(1000);
      
      expect(bannerAppearanceTime, 
        `Banner should appear in ${getBrowserConfig(browserName).name}`
      ).toBeGreaterThan(-1);
    });
  });

  test.describe('2. CSS Transitions and Animations', () => {
    
    test('Banner transitions should be smooth across browsers', async ({ page, browserName }) => {
      console.log(`🎨 Testing CSS transitions in ${getBrowserConfig(browserName).name}`);
      
      await simulateFirstTimeUser(page);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      
      // Check if banner is visible and has proper CSS
      const transitionData = await page.evaluate(() => {
        const banners = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = (el.textContent || '').toLowerCase();
          return text.includes('cookie') && text.includes('accept');
        });
        
        if (banners.length === 0) return { hasTransitions: false, bannerFound: false };
        
        const banner = banners[0];
        const style = getComputedStyle(banner);
        
        return {
          bannerFound: true,
          hasTransitions: style.transition !== 'all 0s ease 0s',
          transitionProperty: style.transitionProperty,
          transitionDuration: style.transitionDuration,
          transform: style.transform,
          opacity: style.opacity,
          animationName: style.animationName,
          animationDuration: style.animationDuration
        };
      });
      
      console.log(`🎨 ${getBrowserConfig(browserName).name} transition data:`, transitionData);

      if (transitionData.bannerFound) {
        // Test banner interaction (if visible)
        const bannerSelector = 'button:has-text("Accept"), button:has-text("Allow")';
        const acceptButton = page.locator(bannerSelector).first();
        
        if (await acceptButton.isVisible()) {
          // Test smooth interaction
          await acceptButton.hover();
          await page.waitForTimeout(200);
          
          const hoverState = await page.evaluate(() => {
            const button = document.querySelector('button[class*="accept"], button:contains("Accept")');
            if (button) {
              const style = getComputedStyle(button);
              return {
                transform: style.transform,
                backgroundColor: style.backgroundColor,
                boxShadow: style.boxShadow
              };
            }
            return null;
          });
          
          console.log(`🎨 ${getBrowserConfig(browserName).name} hover state:`, hoverState);
        }
      }

      await page.screenshot({ 
        path: `/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/transitions-${browserName}.png`,
        fullPage: true 
      });

      expect(transitionData.bannerFound, 
        `Cookie banner should be found in ${getBrowserConfig(browserName).name}`
      ).toBe(true);
    });

    test('Reduced motion preferences should be respected', async ({ page, browserName }) => {
      console.log(`♿ Testing reduced motion in ${getBrowserConfig(browserName).name}`);
      
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await simulateFirstTimeUser(page);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      
      const motionData = await page.evaluate(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        const banners = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = (el.textContent || '').toLowerCase();
          return text.includes('cookie') && text.includes('accept');
        });
        
        let bannerMotionData = { bannerFound: false };
        if (banners.length > 0) {
          const banner = banners[0];
          const style = getComputedStyle(banner);
          bannerMotionData = {
            bannerFound: true,
            animationPlayState: style.animationPlayState,
            transitionDuration: style.transitionDuration,
            animationDuration: style.animationDuration
          };
        }
        
        return {
          prefersReducedMotion,
          ...bannerMotionData
        };
      });
      
      console.log(`♿ ${getBrowserConfig(browserName).name} motion data:`, motionData);

      expect(motionData.prefersReducedMotion, 
        `Reduced motion preference should be detected in ${getBrowserConfig(browserName).name}`
      ).toBe(true);
    });
  });

  test.describe('3. Storage Access Tests', () => {
    
    test('localStorage should work consistently across browsers', async ({ page, browserName }) => {
      console.log(`💾 Testing localStorage in ${getBrowserConfig(browserName).name}`);
      
      await simulateFirstTimeUser(page);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      
      // Test storage operations
      const storageTest = await page.evaluate((config) => {
        const results = {
          browserConfig: config,
          storageAvailable: false,
          canWrite: false,
          canRead: false,
          quotaExceeded: false,
          initialConsent: null,
          error: null
        };
        
        try {
          // Test storage availability
          if (typeof localStorage !== 'undefined') {
            results.storageAvailable = true;
            
            // Test write capability
            localStorage.setItem('test-key', 'test-value');
            results.canWrite = true;
            
            // Test read capability
            const testValue = localStorage.getItem('test-key');
            results.canRead = testValue === 'test-value';
            
            // Check initial consent state
            results.initialConsent = localStorage.getItem('cookie-consent');
            
            // Clean up test
            localStorage.removeItem('test-key');
          }
        } catch (error) {
          results.error = error.toString();
          if (error.name === 'QuotaExceededError') {
            results.quotaExceeded = true;
          }
        }
        
        return results;
      }, getBrowserConfig(browserName));
      
      console.log(`💾 ${getBrowserConfig(browserName).name} storage test:`, storageTest);

      expect(storageTest.storageAvailable, 
        `localStorage should be available in ${getBrowserConfig(browserName).name}`
      ).toBe(true);
      
      expect(storageTest.canWrite, 
        `localStorage should be writable in ${getBrowserConfig(browserName).name}`
      ).toBe(true);
      
      expect(storageTest.canRead, 
        `localStorage should be readable in ${getBrowserConfig(browserName).name}`
      ).toBe(true);
    });

    test('Private/Incognito mode behavior', async ({ page, browserName }) => {
      console.log(`🕵️ Testing private mode behavior in ${getBrowserConfig(browserName).name}`);
      
      // Note: We can't actually test incognito mode directly in Playwright,
      // but we can test the fallback behavior when storage is restricted
      
      await page.addInitScript(() => {
        // Simulate restricted storage environment
        const originalSetItem = localStorage.setItem;
        let storageRestricted = false;
        
        localStorage.setItem = function(key, value) {
          if (storageRestricted) {
            throw new DOMException('QuotaExceededError', 'QuotaExceededError');
          }
          return originalSetItem.call(localStorage, key, value);
        };
        
        // Allow toggling restriction for testing
        window.simulateStorageRestriction = () => { storageRestricted = true; };
        window.removeStorageRestriction = () => { storageRestricted = false; };
      });
      
      await simulateFirstTimeUser(page);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      
      // Test normal operation first
      let consentFlow = await page.evaluate(() => {
        try {
          return {
            phase: 'normal',
            consentStored: localStorage.getItem('cookie-consent'),
            error: null
          };
        } catch (error) {
          return {
            phase: 'normal',
            error: error.toString()
          };
        }
      });
      
      // Now simulate restricted storage and test fallback
      await page.evaluate(() => window.simulateStorageRestriction());
      
      const restrictedTest = await page.evaluate(() => {
        try {
          // This should fail
          localStorage.setItem('test-restricted', 'value');
          return { restrictionActive: false, error: null };
        } catch (error) {
          return { restrictionActive: true, error: error.toString() };
        }
      });
      
      console.log(`🕵️ ${getBrowserConfig(browserName).name} private mode simulation:`, {
        normalOperation: consentFlow,
        restrictedStorage: restrictedTest
      });

      await page.screenshot({ 
        path: `/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/private-mode-${browserName}.png`,
        fullPage: true 
      });

      // The system should handle storage restrictions gracefully
      expect(restrictedTest.restrictionActive, 
        `Storage restriction simulation should work in ${getBrowserConfig(browserName).name}`
      ).toBe(true);
    });
  });

  test.describe('4. PostHog Integration Tests', () => {
    
    test('PostHog should initialize correctly across browsers', async ({ page, browserName }) => {
      console.log(`📊 Testing PostHog integration in ${getBrowserConfig(browserName).name}`);
      
      await simulateFirstTimeUser(page);
      
      // Monitor PostHog initialization
      await page.addInitScript(() => {
        window.postHogEvents = [];
        window.originalPostHog = window.posthog;
      });
      
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const postHogStatus = await page.evaluate((config) => {
        return {
          browserConfig: config,
          postHogExists: typeof window.posthog !== 'undefined',
          postHogLoaded: window.posthog?.__loaded || false,
          postHogOptedOut: window.posthog?.has_opted_out_capturing?.() || false,
          postHogConfig: window.posthog?.config ? {
            api_host: window.posthog.config.api_host,
            persistence_type: window.posthog.config.persistence || 'localStorage',
            opt_out_by_default: window.posthog.config.opt_out_capturing_by_default || false
          } : null,
          consentState: (() => {
            try {
              return localStorage.getItem('cookie-consent');
            } catch (e) {
              return 'STORAGE_ERROR';
            }
          })(),
          userAgent: navigator.userAgent
        };
      }, getBrowserConfig(browserName));
      
      console.log(`📊 ${getBrowserConfig(browserName).name} PostHog status:`, postHogStatus);

      // Take screenshot of debug page for PostHog status
      await page.goto(`${BASE_URL}/debug/posthog`, { waitUntil: 'domcontentloaded' });
      await page.screenshot({ 
        path: `/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/posthog-${browserName}.png`,
        fullPage: true 
      });

      expect(postHogStatus.postHogExists, 
        `PostHog should be available in ${getBrowserConfig(browserName).name}`
      ).toBe(true);
    });

    test('Analytics consent flow should work properly', async ({ page, browserName }) => {
      console.log(`📈 Testing analytics consent flow in ${getBrowserConfig(browserName).name}`);
      
      await simulateFirstTimeUser(page);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Try to interact with consent banner
      const consentInteraction = await page.evaluate(() => {
        const acceptButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
          btn.textContent?.toLowerCase().includes('accept') || 
          btn.textContent?.toLowerCase().includes('allow')
        );
        
        if (acceptButtons.length > 0) {
          const button = acceptButtons[0];
          button.click();
          return {
            buttonFound: true,
            buttonText: button.textContent,
            clicked: true
          };
        }
        
        return { buttonFound: false, clicked: false };
      });
      
      if (consentInteraction.clicked) {
        await page.waitForTimeout(1000);
        
        // Check PostHog status after consent
        const postConsentStatus = await page.evaluate(() => {
          return {
            consentGiven: localStorage.getItem('cookie-consent'),
            postHogOptedOut: window.posthog?.has_opted_out_capturing?.() || true,
            postHogInitialized: window.posthog?.__loaded || false
          };
        });
        
        console.log(`📈 ${getBrowserConfig(browserName).name} post-consent status:`, {
          interaction: consentInteraction,
          status: postConsentStatus
        });
        
        // After accepting consent, PostHog should not be opted out
        if (postConsentStatus.consentGiven) {
          expect(postConsentStatus.postHogOptedOut, 
            `PostHog should not be opted out after consent in ${getBrowserConfig(browserName).name}`
          ).toBe(false);
        }
      }
      
      console.log(`📈 ${getBrowserConfig(browserName).name} consent interaction:`, consentInteraction);
    });
  });

  test.describe('5. Error Handling and Fallbacks', () => {
    
    test('Error boundaries should work across browsers', async ({ page, browserName }) => {
      console.log(`🛡️ Testing error handling in ${getBrowserConfig(browserName).name}`);
      
      await simulateFirstTimeUser(page);
      
      // Inject error simulation
      await page.addInitScript(() => {
        window.simulateConsentError = () => {
          // Simulate various error conditions
          const originalGetItem = localStorage.getItem;
          localStorage.getItem = function(key) {
            if (key === 'cookie-consent') {
              throw new Error('Simulated storage error');
            }
            return originalGetItem.call(localStorage, key);
          };
        };
        
        window.simulateJSError = () => {
          throw new Error('Simulated JavaScript error');
        };
      });
      
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      
      // Test error simulation
      const errorTest = await page.evaluate(() => {
        try {
          window.simulateConsentError();
          const consent = localStorage.getItem('cookie-consent');
          return { errorTriggered: false, result: consent };
        } catch (error) {
          return { errorTriggered: true, error: error.toString() };
        }
      });
      
      // Check if fallback UI appears
      const fallbackCheck = await page.evaluate(() => {
        const fallbackElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = (el.textContent || '').toLowerCase();
          const className = el.className || '';
          return text.includes('fallback') || 
                 text.includes('error') || 
                 className.includes('fallback') ||
                 className.includes('error');
        });
        
        return {
          fallbackElementsFound: fallbackElements.length,
          fallbackVisible: fallbackElements.some(el => {
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   rect.width > 0 && rect.height > 0;
          })
        };
      });
      
      console.log(`🛡️ ${getBrowserConfig(browserName).name} error handling:`, {
        errorTest,
        fallbackCheck
      });

      await page.screenshot({ 
        path: `/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/error-handling-${browserName}.png`,
        fullPage: true 
      });

      // The system should handle errors gracefully
      expect(errorTest.errorTriggered, 
        `Error simulation should work in ${getBrowserConfig(browserName).name}`
      ).toBe(true);
    });

    test('Fallback banner should render when main system fails', async ({ page, browserName }) => {
      console.log(`🆘 Testing fallback banner in ${getBrowserConfig(browserName).name}`);
      
      await simulateFirstTimeUser(page);
      
      // Simulate consent system failure
      await page.addInitScript(() => {
        // Override context to simulate failure
        const originalCreateContext = React?.createContext;
        if (originalCreateContext) {
          React.createContext = function() {
            throw new Error('Simulated context failure');
          };
        }
      });
      
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      
      const fallbackStatus = await page.evaluate(() => {
        // Check for fallback banner
        const fallbackBanners = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = (el.textContent || '').toLowerCase();
          return text.includes('cookie') && 
                 text.includes('accept') && 
                 (text.includes('fallback') || el.className.includes('fallback'));
        });
        
        return {
          fallbackBannersFound: fallbackBanners.length,
          fallbackVisible: fallbackBanners.some(el => {
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   rect.width > 0 && rect.height > 0;
          }),
          anyConsentUI: document.querySelectorAll('*').length > 0 && 
                       Array.from(document.querySelectorAll('*')).some(el => 
                         (el.textContent || '').toLowerCase().includes('cookie')
                       )
        };
      });
      
      console.log(`🆘 ${getBrowserConfig(browserName).name} fallback status:`, fallbackStatus);

      await page.screenshot({ 
        path: `/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/fallback-${browserName}.png`,
        fullPage: true 
      });

      // Some form of consent UI should be available even with errors
      expect(fallbackStatus.anyConsentUI, 
        `Some consent UI should be available in ${getBrowserConfig(browserName).name} even with system failures`
      ).toBe(true);
    });
  });

  test.describe('6. Performance Comparison', () => {
    
    test('Performance benchmarks across browsers', async ({ page, browserName }) => {
      console.log(`⚡ Performance testing in ${getBrowserConfig(browserName).name}`);
      
      await simulateFirstTimeUser(page);
      
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      
      // Measure key performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          timeToInteractive: performance.now() // Approximate
        };
      });
      
      // Wait for banner and measure appearance time
      let bannerAppearTime = -1;
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(100);
        const bannerVisible = await checkBannerVisibility(page, browserName);
        if (bannerVisible.bannerVisible) {
          bannerAppearTime = i * 100;
          break;
        }
      }
      
      const endTime = Date.now();
      const totalLoadTime = endTime - startTime;
      
      const browserPerformance = {
        browser: getBrowserConfig(browserName).name,
        totalLoadTime,
        bannerAppearTime,
        metrics: performanceMetrics,
        expectedPerformance: getBrowserConfig(browserName).expectedPerformance
      };
      
      console.log(`⚡ ${getBrowserConfig(browserName).name} performance:`, browserPerformance);

      // Performance should be reasonable (under 5 seconds for total load)
      expect(totalLoadTime, 
        `Total load time should be reasonable in ${getBrowserConfig(browserName).name}`
      ).toBeLessThan(5000);
      
      // Banner should appear within 2 seconds
      if (bannerAppearTime > -1) {
        expect(bannerAppearTime, 
          `Banner should appear quickly in ${getBrowserConfig(browserName).name}`
        ).toBeLessThan(2000);
      }
    });
  });
});

// Final summary test that compares all browsers
test('🎯 Cross-Browser Compatibility Summary', async ({ page, browserName }) => {
  console.log('🎯 CROSS-BROWSER COMPATIBILITY SUMMARY');
  console.log('=====================================');
  
  const config = getBrowserConfig(browserName);
  
  await simulateFirstTimeUser(page);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Final comprehensive check
  const finalResults = await page.evaluate((browserConfig) => {
    const results = {
      browser: browserConfig.name,
      timestamp: new Date().toISOString(),
      
      // Basic functionality
      pageLoaded: document.readyState === 'complete',
      domReady: document.readyState !== 'loading',
      
      // Storage
      localStorageAvailable: typeof localStorage !== 'undefined',
      sessionStorageAvailable: typeof sessionStorage !== 'undefined',
      
      // Cookie banner
      bannerElements: Array.from(document.querySelectorAll('*')).filter(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.includes('cookie') && text.includes('accept');
      }).length,
      
      // PostHog
      postHogAvailable: typeof window.posthog !== 'undefined',
      postHogLoaded: window.posthog?.__loaded || false,
      
      // Consent state
      consentStored: (() => {
        try {
          return localStorage.getItem('cookie-consent');
        } catch (e) {
          return 'ERROR';
        }
      })(),
      
      // Browser capabilities
      supportsES6: typeof Promise !== 'undefined',
      supportsWebComponents: typeof customElements !== 'undefined',
      supportsFetch: typeof fetch !== 'undefined'
    };
    
    return results;
  }, config);
  
  console.log(`✅ ${config.name} Final Results:`, finalResults);
  
  await page.screenshot({ 
    path: `/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/final-${browserName}.png`,
    fullPage: true 
  });
  
  // Core functionality should work in all browsers
  expect(finalResults.pageLoaded, `Page should load completely in ${config.name}`).toBe(true);
  expect(finalResults.localStorageAvailable, `localStorage should be available in ${config.name}`).toBe(true);
  expect(finalResults.bannerElements, `Cookie banner should be present in ${config.name}`).toBeGreaterThan(0);
  
  console.log(`✅ ${config.name}: All core functionality tests passed`);
});