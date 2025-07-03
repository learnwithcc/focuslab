import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3600';

test.describe('Cookie Banner Hydration Timing Issue', () => {
  test('Demonstrates the banner flash/loading issue with extensive timing analysis', async ({ page }) => {
    console.log('🔬 Starting comprehensive analysis of cookie banner hydration timing issue');
    
    // Clear storage first
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.log('Could not clear storage in init script');
      }
    });

    // Set up detailed performance monitoring before navigation
    await page.addInitScript(() => {
      window.timingData = {
        navigationStart: Date.now(),
        events: [],
        markEvent: function(name, data = {}) {
          const timestamp = Date.now();
          const timing = {
            name,
            timestamp,
            relativeTime: timestamp - this.navigationStart,
            data
          };
          this.events.push(timing);
          console.log(`🕐 [TIMING] ${name} at ${timing.relativeTime}ms:`, data);
          return timing;
        }
      };
      
      // Override console methods to capture initialization logs
      const originalLog = console.log;
      window.capturedLogs = [];
      console.log = function(...args) {
        window.capturedLogs.push({
          timestamp: Date.now(),
          args: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg))
        });
        originalLog.apply(console, args);
      };
      
      window.timingData.markEvent('INIT_SCRIPT_LOADED');
    });

    // Navigate to homepage and capture initial state
    console.log('📡 Navigating to homepage...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    // Take screenshot immediately after navigation
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/01-immediate-after-navigation.png',
      fullPage: true 
    });

    // Capture state immediately after navigation (before hydration)
    const immediateState = await page.evaluate(() => {
      window.timingData.markEvent('IMMEDIATE_STATE_CAPTURE');
      
      return {
        url: window.location.href,
        readyState: document.readyState,
        hasLocalStorage: typeof localStorage !== 'undefined',
        localStorageContent: (() => {
          try {
            return localStorage.getItem('cookie-consent');
          } catch (e) {
            return 'ERROR_ACCESSING_LOCALSTORAGE';
          }
        })(),
        reactMounted: !!document.querySelector('[data-reactroot]'),
        cookieConsentElements: document.querySelectorAll('[data-testid*="cookie"], [class*="cookie"], [class*="consent"]').length,
        visibleBanners: Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.toLowerCase() || '';
          const style = getComputedStyle(el);
          return (text.includes('cookie') || text.includes('consent')) && 
                 style.display !== 'none' && style.visibility !== 'hidden';
        }).length,
        contextProviders: document.querySelectorAll('[data-react-context]').length,
        timingEvents: window.timingData.events
      };
    });

    console.log('📊 State immediately after navigation:', immediateState);

    // Wait for hydration and capture logs
    console.log('⏳ Waiting for React hydration...');
    try {
      await page.waitForFunction(() => {
        window.timingData.markEvent('CHECKING_HYDRATION');
        return document.readyState === 'complete' && 
               !!document.querySelector('[data-reactroot]') &&
               !!window.React;
      }, { timeout: 10000 });
      
      console.log('✅ React hydration detected');
    } catch (error) {
      console.log('❌ React hydration timeout - continuing with analysis');
    }
    
    // Take screenshot after hydration
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/02-after-hydration.png',
      fullPage: true 
    });

    // Wait additional time to see if banner appears
    console.log('⏳ Waiting to see if banner appears...');
    await page.waitForTimeout(3000);
    
    // Take screenshot after waiting
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/03-after-waiting.png',
      fullPage: true 
    });

    // Capture detailed state after hydration
    const postHydrationState = await page.evaluate(() => {
      window.timingData.markEvent('POST_HYDRATION_STATE_CAPTURE');
      
      // Try to find cookie consent context and components
      const cookieContexts = Array.from(document.querySelectorAll('*')).filter(el => {
        return el.getAttribute && (
          el.getAttribute('data-cookie-context') ||
          el.className?.includes('cookie') ||
          el.className?.includes('consent')
        );
      });
      
      // Check for React context providers
      const reactContexts = Array.from(document.querySelectorAll('*')).filter(el => {
        return el._reactInternalFiber || el._reactInternals || 
               (el.dataset && Object.keys(el.dataset).some(key => key.includes('react')));
      });
      
      return {
        readyState: document.readyState,
        reactMounted: !!document.querySelector('[data-reactroot]'),
        reactExists: typeof window.React !== 'undefined',
        localStorageNow: (() => {
          try {
            return localStorage.getItem('cookie-consent');
          } catch (e) {
            return 'ERROR_ACCESSING_LOCALSTORAGE';
          }
        })(),
        cookieContextElements: cookieContexts.length,
        reactContextElements: reactContexts.length,
        allCookieRelatedElements: Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.toLowerCase() || '';
          const className = el.className?.toLowerCase() || '';
          const id = el.id?.toLowerCase() || '';
          return text.includes('cookie') || text.includes('consent') ||
                 className.includes('cookie') || className.includes('consent') ||
                 id.includes('cookie') || id.includes('consent');
        }).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: el.textContent?.substring(0, 100),
          visible: getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'
        })),
        windowProperties: {
          posthog: typeof window.posthog !== 'undefined',
          posthogLoaded: window.posthog?.__loaded,
          timingData: window.timingData.events.length
        },
        capturedLogs: window.capturedLogs.slice(-20) // Last 20 logs
      };
    });

    console.log('📊 State after hydration:', postHydrationState);

    // Check if we can find cookie consent elements by forcing a re-render
    console.log('🔍 Attempting to force cookie consent check...');
    const forcedCheck = await page.evaluate(() => {
      window.timingData.markEvent('FORCED_CONSENT_CHECK');
      
      // Try to manually trigger consent checking
      try {
        // Clear localStorage to simulate first visit
        localStorage.removeItem('cookie-consent');
        
        // Dispatch storage event to trigger re-evaluation
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'cookie-consent',
          oldValue: null,
          newValue: null,
          storageArea: localStorage
        }));
        
        // Dispatch custom events
        window.dispatchEvent(new CustomEvent('cookieConsentRevoked'));
        
        return {
          localStorageAfterClear: localStorage.getItem('cookie-consent'),
          eventsDispatched: true
        };
      } catch (error) {
        return {
          error: error.message,
          localStorageAfterClear: 'ERROR'
        };
      }
    });

    console.log('🔍 Forced check result:', forcedCheck);

    // Wait to see if anything changes
    await page.waitForTimeout(2000);
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/04-after-forced-check.png',
      fullPage: true 
    });

    // Capture final timing data
    const finalTiming = await page.evaluate(() => {
      window.timingData.markEvent('FINAL_CAPTURE');
      return {
        totalEvents: window.timingData.events.length,
        events: window.timingData.events,
        finalLocalStorage: (() => {
          try {
            return localStorage.getItem('cookie-consent');
          } catch (e) {
            return 'ERROR';
          }
        })(),
        cookieBannerVisible: Array.from(document.querySelectorAll('*')).some(el => {
          const text = el.textContent?.toLowerCase() || '';
          const style = getComputedStyle(el);
          return (text.includes('cookie') || text.includes('consent')) &&
                 text.includes('accept') &&
                 style.display !== 'none' && 
                 style.visibility !== 'hidden' &&
                 style.opacity !== '0';
        })
      };
    });

    console.log('📊 Final timing analysis:', finalTiming);

    // Write detailed report
    const report = {
      testName: 'Cookie Banner Hydration Timing Analysis',
      timestamp: new Date().toISOString(),
      issue: 'Cookie consent banner does not appear on first visit',
      immediateState,
      postHydrationState,
      forcedCheck,
      finalTiming,
      analysis: {
        bannerFoundAtAnyPoint: postHydrationState.allCookieRelatedElements.some(el => el.visible),
        localStorageAccessible: immediateState.localStorageContent !== 'ERROR_ACCESSING_LOCALSTORAGE',
        reactHydrated: postHydrationState.reactMounted && postHydrationState.reactExists,
        ssrHydrationMismatch: immediateState.localStorageContent === 'ERROR_ACCESSING_LOCALSTORAGE' && postHydrationState.localStorageNow === null
      }
    };

    console.log('📝 Complete analysis report:', JSON.stringify(report, null, 2));

    // Assert that we have identified the issue
    expect(report.analysis.ssrHydrationMismatch).toBe(true);
    expect(report.analysis.bannerFoundAtAnyPoint).toBe(false);
    expect(finalTiming.cookieBannerVisible).toBe(false);
  });

  test('Debug page analysis - verifying the issue persists even with debug tools', async ({ page }) => {
    console.log('🔧 Testing debug page to confirm the issue...');
    
    // Clear storage
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.log('Could not clear storage');
      }
    });

    // Navigate to debug page
    await page.goto(`${BASE_URL}/debug/posthog`, { waitUntil: 'networkidle' });
    
    // Take screenshot of debug page
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/debug-page-initial.png',
      fullPage: true 
    });

    // Extract debug information
    const debugInfo = await page.evaluate(() => {
      const getTextByLabel = (label) => {
        const element = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent?.includes(label)
        );
        if (element && element.nextElementSibling) {
          return element.nextElementSibling.textContent?.trim() || 'NOT_FOUND';
        }
        return 'NOT_FOUND';
      };

      return {
        analyticsConsent: getTextByLabel('Analytics Consent:'),
        consentRequired: getTextByLabel('Consent Required:'),
        showBanner: getTextByLabel('Show Banner:'),
        showModal: getTextByLabel('Show Modal:'),
        contextInitialized: getTextByLabel('Context Initialized:'),
        localStorageValue: getTextByLabel('LocalStorage Value:'),
        postHogLoaded: getTextByLabel('Loaded:'),
        postHogOptedIn: getTextByLabel('Opted In:')
      };
    });

    console.log('🔧 Debug page values:', debugInfo);

    // Click the "Clear Consent & Reload" button
    await page.click('button:has-text("Clear Consent & Reload")');
    
    // Wait for reload
    await page.waitForLoadState('networkidle');
    
    // Take screenshot after clear and reload
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/debug-page-after-clear.png',
      fullPage: true 
    });

    // Extract debug information again
    const debugInfoAfterClear = await page.evaluate(() => {
      const getTextByLabel = (label) => {
        const element = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent?.includes(label)
        );
        if (element && element.nextElementSibling) {
          return element.nextElementSibling.textContent?.trim() || 'NOT_FOUND';
        }
        return 'NOT_FOUND';
      };

      return {
        analyticsConsent: getTextByLabel('Analytics Consent:'),
        consentRequired: getTextByLabel('Consent Required:'),
        showBanner: getTextByLabel('Show Banner:'),
        showModal: getTextByLabel('Show Modal:'),
        contextInitialized: getTextByLabel('Context Initialized:'),
        localStorageValue: getTextByLabel('LocalStorage Value:'),
        postHogLoaded: getTextByLabel('Loaded:'),
        postHogOptedIn: getTextByLabel('Opted In:')
      };
    });

    console.log('🔧 Debug page values after clear:', debugInfoAfterClear);

    // Navigate to homepage to see if banner appears
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Take screenshot of homepage after clearing consent
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/homepage-after-clear-consent.png',
      fullPage: true 
    });

    // Check if banner appears on homepage
    const bannerVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el => {
        const text = el.textContent?.toLowerCase() || '';
        const style = getComputedStyle(el);
        return (text.includes('cookie') || text.includes('consent')) &&
               text.includes('accept') &&
               style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               style.opacity !== '0';
      });
    });

    console.log('🔧 Banner visible on homepage after clearing consent:', bannerVisible);

    // Document the issue
    const issueReport = {
      beforeClear: debugInfo,
      afterClear: debugInfoAfterClear,
      bannerVisibleOnHomepage: bannerVisible,
      issue: {
        description: 'Even after clearing consent via debug page, banner does not appear',
        consentRequiredAfterClear: debugInfoAfterClear.consentRequired,
        showBannerAfterClear: debugInfoAfterClear.showBanner,
        bannerActuallyVisible: bannerVisible
      }
    };

    console.log('📋 Issue report:', JSON.stringify(issueReport, null, 2));

    // Assert the issue
    expect(debugInfoAfterClear.consentRequired).toBe('No');
    expect(debugInfoAfterClear.showBanner).toBe('No');
    expect(bannerVisible).toBe(false);
  });

  test('Console logs analysis during initialization', async ({ page }) => {
    console.log('📜 Analyzing console logs during initialization...');
    
    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
        location: msg.location()
      });
    });

    // Clear storage
    await page.context().clearCookies();
    
    // Navigate with detailed logging
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Wait for initialization to complete
    await page.waitForTimeout(5000);
    
    // Filter for cookie/consent related logs
    const relevantLogs = consoleMessages.filter(log => {
      const text = log.text.toLowerCase();
      return text.includes('cookie') || 
             text.includes('consent') || 
             text.includes('posthog') ||
             text.includes('timing') ||
             text.includes('initialization') ||
             text.includes('context') ||
             text.includes('required') ||
             text.includes('banner') ||
             text.includes('mounted');
    });

    console.log('📜 Relevant console logs during initialization:');
    relevantLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.type.toUpperCase()}] ${log.text}`);
    });

    // Create logs analysis
    const logsAnalysis = {
      totalLogs: consoleMessages.length,
      relevantLogs: relevantLogs.length,
      cookieContextLogs: relevantLogs.filter(log => log.text.includes('CookieConsentProvider')),
      timingLogs: relevantLogs.filter(log => log.text.includes('TIMING')),
      initializationLogs: relevantLogs.filter(log => log.text.includes('initialization')),
      mountedLogs: relevantLogs.filter(log => log.text.includes('mounted')),
      isConsentRequiredLogs: relevantLogs.filter(log => log.text.includes('isConsentRequired')),
      relevantLogsSample: relevantLogs.slice(0, 10).map(log => `[${log.type}] ${log.text}`)
    };

    console.log('📊 Logs analysis:', JSON.stringify(logsAnalysis, null, 2));

    // Expect that we captured initialization logs
    expect(logsAnalysis.cookieContextLogs.length).toBeGreaterThan(0);
    expect(logsAnalysis.relevantLogs.length).toBeGreaterThan(0);

    // Check for specific initialization patterns
    const hasInitializationStart = relevantLogs.some(log => 
      log.text.includes('initialization') && log.text.includes('start')
    );
    const hasConsentRequiredCheck = relevantLogs.some(log => 
      log.text.includes('isConsentRequired')
    );

    console.log('🔍 Key initialization patterns found:');
    console.log('  - Initialization start:', hasInitializationStart);
    console.log('  - Consent required check:', hasConsentRequiredCheck);
  });
});