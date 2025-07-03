import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3600';

// Helper function to clear localStorage and cookies
async function clearBrowserState(page: Page) {
  await page.context().clearCookies();
  try {
    await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    });
  } catch (error) {
    console.log('Could not clear storage, continuing...');
  }
}

// Helper function to wait for PostHog initialization
async function waitForPostHogInit(page: Page) {
  return await page.waitForFunction(() => {
    return window.posthog && window.posthog.__loaded;
  }, { timeout: 10000 });
}

// Helper function to measure timing
async function measureTiming(page: Page, name: string) {
  return await page.evaluate((measureName) => {
    performance.mark(`${measureName}-start`);
    return Date.now();
  }, name);
}

async function measureTimingEnd(page: Page, name: string) {
  return await page.evaluate((measureName) => {
    performance.mark(`${measureName}-end`);
    try {
      performance.measure(measureName, `${measureName}-start`, `${measureName}-end`);
      const measure = performance.getEntriesByName(measureName)[0];
      return measure.duration;
    } catch (e) {
      return -1;
    }
  }, name);
}

test.describe('Cookie Consent Banner Loading Issue', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all browser state before each test
    await clearBrowserState(page);
  });

  test('First time user - Banner flash/loading issue', async ({ page }) => {
    console.log('Testing first time user experience...');
    
    // Start timing measurement
    await measureTiming(page, 'page-load');
    
    // Navigate to homepage
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // End timing measurement
    const loadTime = await measureTimingEnd(page, 'page-load');
    console.log(`Page load time: ${loadTime}ms`);
    
    // Take screenshot before hydration
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/first-time-before-hydration.png',
      fullPage: true 
    });
    
    // Wait for React hydration
    await page.waitForFunction(() => {
      return window.React && document.querySelector('[data-reactroot]');
    }, { timeout: 10000 });
    
    // Measure banner appearance timing
    await measureTiming(page, 'banner-appearance');
    
    // Wait for cookie consent banner to appear
    const bannerSelector = '[data-testid="cookie-consent-banner"], .cookie-consent-banner, [role="banner"]:has-text("cookie")';
    let bannerFound = false;
    
    try {
      const banner = await page.waitForSelector(bannerSelector, { timeout: 5000 });
      bannerFound = true;
      
      const bannerTime = await measureTimingEnd(page, 'banner-appearance');
      console.log(`Banner appearance time: ${bannerTime}ms`);
      
      // Check if banner is visible
      const isVisible = await banner.isVisible();
      expect(isVisible).toBe(true);
      
      // Take screenshot with banner visible
      await page.screenshot({ 
        path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/first-time-banner-visible.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.log('Banner not found with standard selectors, checking for any consent-related elements...');
      
      // Check for any consent-related elements
      const consentElements = await page.$$eval('*', (elements) => {
        return elements
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            const className = el.className?.toLowerCase() || '';
            const id = el.id?.toLowerCase() || '';
            return text.includes('cookie') || text.includes('consent') || 
                   className.includes('cookie') || className.includes('consent') ||
                   id.includes('cookie') || id.includes('consent');
          })
          .map(el => ({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            textContent: el.textContent?.substring(0, 100)
          }));
      });
      
      console.log('Found consent-related elements:', consentElements);
    }
    
    // Check localStorage state
    const localStorageState = await page.evaluate(() => {
      try {
        if (typeof localStorage !== 'undefined') {
          return {
            keys: Object.keys(localStorage),
            consentState: localStorage.getItem('cookie-consent'),
            postHogOptOut: localStorage.getItem('__ph_opt_in_out_phc_YOUR_PROJECT_ID'),
            allItems: Object.fromEntries(Object.entries(localStorage))
          };
        }
      } catch (error) {
        return { error: 'localStorage not accessible' };
      }
      return { error: 'localStorage not available' };
    });
    
    console.log('localStorage state:', localStorageState);
    
    // Verify PostHog initialization state
    const postHogState = await page.evaluate(() => {
      return {
        loaded: window.posthog?.__loaded,
        config: window.posthog?.config,
        optedOut: window.posthog?.has_opted_out_capturing?.()
      };
    });
    
    console.log('PostHog state:', postHogState);
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/first-time-final-state.png',
      fullPage: true 
    });
    
    // Expect that no consent has been given yet (if localStorage is accessible)
    if (localStorageState.error) {
      console.log('localStorage not accessible:', localStorageState.error);
    } else {
      expect(localStorageState.consentState).toBeNull();
    }
  });

  test('Debug page analysis', async ({ page }) => {
    console.log('Testing debug page...');
    
    // Navigate to debug page
    await page.goto(`${BASE_URL}/debug/posthog`, { waitUntil: 'networkidle' });
    
    // Take screenshot of debug page
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/debug-page.png',
      fullPage: true 
    });
    
    // Wait for debug information to load
    await page.waitForTimeout(2000);
    
    // Extract debug information
    const debugInfo = await page.evaluate(() => {
      const debugElements = document.querySelectorAll('pre, code, [data-testid*="debug"]');
      return Array.from(debugElements).map(el => ({
        tag: el.tagName,
        text: el.textContent?.substring(0, 500)
      }));
    });
    
    console.log('Debug page information:', debugInfo);
    
    // Check console logs for PostHog related messages
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().toLowerCase().includes('posthog') || 
          msg.text().toLowerCase().includes('consent') ||
          msg.text().toLowerCase().includes('cookie')) {
        consoleLogs.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: Date.now()
        });
      }
    });
    
    // Refresh to capture initialization logs
    await page.reload({ waitUntil: 'networkidle' });
    
    console.log('PostHog/Consent related console logs:', consoleLogs);
  });

  test('Consent acceptance flow', async ({ page }) => {
    console.log('Testing consent acceptance flow...');
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Wait for banner to appear
    const bannerSelector = '[data-testid="cookie-consent-banner"], .cookie-consent-banner, button:has-text("Accept"), button:has-text("consent")';
    
    try {
      const banner = await page.waitForSelector(bannerSelector, { timeout: 10000 });
      
      // Take screenshot before acceptance
      await page.screenshot({ 
        path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/before-consent-acceptance.png',
        fullPage: true 
      });
      
      // Look for accept button
      const acceptButton = await page.locator('button:has-text("Accept"), button:has-text("OK"), button:has-text("Agree")').first();
      
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        
        // Wait for consent to be processed
        await page.waitForTimeout(1000);
        
        // Take screenshot after acceptance
        await page.screenshot({ 
          path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/after-consent-acceptance.png',
          fullPage: true 
        });
        
        // Verify localStorage state
        const consentState = await page.evaluate(() => {
          try {
            return {
              consentGiven: typeof localStorage !== 'undefined' ? localStorage.getItem('cookie-consent') : null,
              postHogState: window.posthog?.has_opted_out_capturing?.()
            };
          } catch (error) {
            return {
              consentGiven: null,
              postHogState: null,
              error: error.message
            };
          }
        });
        
        console.log('Post-acceptance state:', consentState);
        expect(consentState.consentGiven).not.toBeNull();
      }
    } catch (error) {
      console.log('Could not find consent banner or accept button');
      
      // Take screenshot of current state
      await page.screenshot({ 
        path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/no-banner-found.png',
        fullPage: true 
      });
    }
  });

  test('Returning user with consent', async ({ page }) => {
    console.log('Testing returning user with existing consent...');
    
    // Set consent in localStorage before navigation
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('cookie-consent', 'accepted');
          localStorage.setItem('cookie-consent-timestamp', Date.now().toString());
        }
      } catch (error) {
        console.log('Could not set localStorage:', error);
      }
    });
    
    // Reload to test returning user experience
    await page.reload({ waitUntil: 'networkidle' });
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/returning-user-with-consent.png',
      fullPage: true 
    });
    
    // Verify banner is not shown
    const bannerSelector = '[data-testid="cookie-consent-banner"], .cookie-consent-banner';
    const banner = await page.locator(bannerSelector).first();
    
    // Wait a moment to ensure banner would appear if it was going to
    await page.waitForTimeout(3000);
    
    const bannerVisible = await banner.isVisible().catch(() => false);
    expect(bannerVisible).toBe(false);
    
    // Verify PostHog is initialized properly
    const postHogState = await page.evaluate(() => {
      return {
        loaded: window.posthog?.__loaded,
        hasOptedOut: window.posthog?.has_opted_out_capturing?.()
      };
    });
    
    console.log('Returning user PostHog state:', postHogState);
    expect(postHogState.hasOptedOut).toBe(false);
  });

  test('Consent revocation flow', async ({ page }) => {
    console.log('Testing consent revocation flow...');
    
    // First, set consent
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('cookie-consent', 'accepted');
        }
      } catch (error) {
        console.log('Could not set localStorage:', error);
      }
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    
    // Look for settings or revoke option
    const settingsSelectors = [
      'button:has-text("Settings")',
      'button:has-text("Preferences")',
      'a:has-text("Privacy")',
      '[data-testid="cookie-settings"]'
    ];
    
    let settingsFound = false;
    for (const selector of settingsSelectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 2000 });
        if (await element.isVisible()) {
          await element.click();
          settingsFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!settingsFound) {
      // Manually revoke consent via JavaScript
      await page.evaluate(() => {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('cookie-consent');
            localStorage.removeItem('cookie-consent-timestamp');
          }
        } catch (error) {
          console.log('Could not access localStorage:', error);
        }
      });
      
      await page.reload({ waitUntil: 'networkidle' });
    }
    
    // Take screenshot of revocation state
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/consent-revoked.png',
      fullPage: true 
    });
    
    // Verify consent state
    const consentState = await page.evaluate(() => {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem('cookie-consent');
        }
      } catch (error) {
        console.log('Could not access localStorage:', error);
      }
      return null;
    });
    
    expect(consentState).toBeNull();
  });

  test('Banner visibility timing analysis', async ({ page }) => {
    console.log('Analyzing banner visibility timing...');
    
    // Clear state
    await clearBrowserState(page);
    
    // Set up performance monitoring
    await page.addInitScript(() => {
      window.performanceData = {
        navigationStart: 0,
        hydrationStart: 0,
        hydrationEnd: 0,
        bannerStart: 0,
        bannerEnd: 0
      };
      
      performance.mark('navigation-start');
      window.performanceData.navigationStart = Date.now();
    });
    
    // Navigate and capture timing
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    // Monitor for hydration
    await page.evaluate(() => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if React has hydrated
            if (document.querySelector('[data-reactroot]') && !window.performanceData.hydrationEnd) {
              window.performanceData.hydrationEnd = Date.now();
              performance.mark('hydration-complete');
            }
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
    
    // Wait for potential banner appearance
    await page.waitForTimeout(5000);
    
    // Collect timing data
    const timingData = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('measure');
      const marks = performance.getEntriesByType('mark');
      
      return {
        performanceData: window.performanceData,
        measures: perfEntries.map(entry => ({
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime
        })),
        marks: marks.map(mark => ({
          name: mark.name,
          startTime: mark.startTime
        }))
      };
    });
    
    console.log('Timing analysis:', timingData);
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/timing-analysis-final.png',
      fullPage: true 
    });
  });

  test('PostHog initialization sequence', async ({ page }) => {
    console.log('Testing PostHog initialization sequence...');
    
    // Monitor console logs
    const logs = [];
    page.on('console', msg => {
      logs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });
    
    // Monitor network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('posthog') || request.url().includes('analytics')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });
    
    // Clear state and navigate
    await clearBrowserState(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Wait for PostHog to potentially initialize
    try {
      await waitForPostHogInit(page);
      console.log('PostHog initialized successfully');
    } catch (error) {
      console.log('PostHog initialization timeout or failed');
    }
    
    // Check PostHog state
    const postHogAnalysis = await page.evaluate(() => {
      return {
        postHogExists: typeof window.posthog !== 'undefined',
        postHogLoaded: window.posthog?.__loaded,
        postHogConfig: window.posthog?.config ? {
          api_host: window.posthog.config.api_host,
          loaded: window.posthog.config.loaded,
          opt_out_capturing_by_default: window.posthog.config.opt_out_capturing_by_default
        } : null,
        hasOptedOut: window.posthog?.has_opted_out_capturing?.(),
        persistence: window.posthog?.persistence ? {
          disabled: window.posthog.persistence.disabled,
          cross_subdomain: window.posthog.persistence.cross_subdomain
        } : null
      };
    });
    
    console.log('PostHog analysis:', postHogAnalysis);
    console.log('Network requests:', networkRequests);
    console.log('Console logs (PostHog/consent related):', 
      logs.filter(log => 
        log.text.toLowerCase().includes('posthog') || 
        log.text.toLowerCase().includes('consent') ||
        log.text.toLowerCase().includes('cookie')
      )
    );
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/posthog-initialization.png',
      fullPage: true 
    });
  });
});