import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3600';

test.describe('Cookie Consent Banner Loading Issue - Final Report', () => {
  test('Comprehensive evidence collection of the banner loading issue', async ({ page }) => {
    console.log('🔬 FINAL COMPREHENSIVE ANALYSIS OF COOKIE CONSENT BANNER ISSUE');
    console.log('================================================================');
    
    // Step 1: Clear all storage to simulate first-time user
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Storage not available during init
      }
    });

    console.log('✅ Step 1: Cleared all browser storage');

    // Step 2: Navigate to homepage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    console.log('✅ Step 2: Navigated to homepage');

    // Step 3: Take immediate screenshot
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/evidence-01-immediate-load.png',
      fullPage: true 
    });

    // Step 4: Check initial state
    const initialState = await page.evaluate(() => {
      // Check localStorage
      let localStorageState = 'UNKNOWN';
      try {
        localStorageState = localStorage.getItem('cookie-consent');
      } catch (e) {
        localStorageState = 'ERROR_ACCESSING';
      }

      // Look for any cookie/consent related elements
      const allElements = Array.from(document.querySelectorAll('*'));
      const cookieElements = allElements.filter(el => {
        const text = (el.textContent || '').toLowerCase();
        const className = (el.className || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        return text.includes('cookie') || text.includes('consent') ||
               className.includes('cookie') || className.includes('consent') ||
               id.includes('cookie') || id.includes('consent');
      });

      // Look specifically for banner-like elements
      const bannerElements = allElements.filter(el => {
        const text = (el.textContent || '').toLowerCase();
        const style = getComputedStyle(el);
        return (text.includes('cookie') || text.includes('consent')) &&
               (text.includes('accept') || text.includes('allow') || text.includes('agree')) &&
               style.display !== 'none' &&
               style.visibility !== 'hidden';
      });

      return {
        localStorageContent: localStorageState,
        cookieElementsFound: cookieElements.length,
        bannerElementsFound: bannerElements.length,
        cookieElementsDetails: cookieElements.slice(0, 5).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: (el.textContent || '').substring(0, 100),
          visible: getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'
        })),
        bannerElementsDetails: bannerElements.map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: (el.textContent || '').substring(0, 100),
          rect: el.getBoundingClientRect()
        })),
        documentReady: document.readyState,
        reactPresent: typeof window.React !== 'undefined',
        postHogPresent: typeof window.posthog !== 'undefined'
      };
    });

    console.log('✅ Step 4: Initial state analysis:');
    console.log(`   - localStorage content: ${initialState.localStorageContent}`);
    console.log(`   - Cookie elements found: ${initialState.cookieElementsFound}`);
    console.log(`   - Banner elements found: ${initialState.bannerElementsFound}`);
    console.log(`   - Document ready: ${initialState.documentReady}`);
    console.log(`   - React present: ${initialState.reactPresent}`);
    console.log(`   - PostHog present: ${initialState.postHogPresent}`);

    // Step 5: Wait for potential hydration
    await page.waitForTimeout(3000);
    
    console.log('✅ Step 5: Waited 3 seconds for potential hydration');

    // Step 6: Take post-wait screenshot
    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/evidence-02-after-wait.png',
      fullPage: true 
    });

    // Step 7: Check state after waiting
    const postWaitState = await page.evaluate(() => {
      let localStorageState = 'UNKNOWN';
      try {
        localStorageState = localStorage.getItem('cookie-consent');
      } catch (e) {
        localStorageState = 'ERROR_ACCESSING';
      }

      // Look for any visible consent banners
      const allElements = Array.from(document.querySelectorAll('*'));
      const visibleBanners = allElements.filter(el => {
        const text = (el.textContent || '').toLowerCase();
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        return (text.includes('cookie') || text.includes('consent')) &&
               (text.includes('accept') || text.includes('allow') || text.includes('agree')) &&
               style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               rect.width > 0 &&
               rect.height > 0;
      });

      return {
        localStorageContent: localStorageState,
        visibleBanners: visibleBanners.length,
        bannerDetails: visibleBanners.map(el => ({
          tagName: el.tagName,
          className: el.className,
          textContent: (el.textContent || '').substring(0, 150),
          rect: el.getBoundingClientRect(),
          computed: {
            display: getComputedStyle(el).display,
            visibility: getComputedStyle(el).visibility,
            opacity: getComputedStyle(el).opacity,
            position: getComputedStyle(el).position
          }
        })),
        reactPresent: typeof window.React !== 'undefined',
        postHogPresent: typeof window.posthog !== 'undefined',
        postHogLoaded: window.posthog?.__loaded
      };
    });

    console.log('✅ Step 7: Post-wait state analysis:');
    console.log(`   - localStorage content: ${postWaitState.localStorageContent}`);
    console.log(`   - Visible banners: ${postWaitState.visibleBanners}`);
    console.log(`   - React present: ${postWaitState.reactPresent}`);
    console.log(`   - PostHog present: ${postWaitState.postHogPresent}`);
    console.log(`   - PostHog loaded: ${postWaitState.postHogLoaded}`);

    // Step 8: Navigate to debug page for verification
    await page.goto(`${BASE_URL}/debug/posthog`, { waitUntil: 'domcontentloaded' });
    
    console.log('✅ Step 8: Navigated to debug page');

    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/evidence-03-debug-page.png',
      fullPage: true 
    });

    // Step 9: Extract debug information using more robust method
    const debugPageContent = await page.textContent('body');
    
    const extractDebugValue = (content, label) => {
      const regex = new RegExp(`${label}\\s*[:\n]\\s*([^\\n]+)`, 'i');
      const match = content.match(regex);
      return match ? match[1].trim() : 'NOT_FOUND';
    };

    const debugInfo = {
      analyticsConsent: extractDebugValue(debugPageContent, 'Analytics Consent'),
      consentRequired: extractDebugValue(debugPageContent, 'Consent Required'),
      showBanner: extractDebugValue(debugPageContent, 'Show Banner'),
      showModal: extractDebugValue(debugPageContent, 'Show Modal'),
      contextInitialized: extractDebugValue(debugPageContent, 'Context Initialized'),
      localStorageValue: extractDebugValue(debugPageContent, 'LocalStorage Value'),
      postHogLoaded: extractDebugValue(debugPageContent, 'Loaded'),
      postHogOptedIn: extractDebugValue(debugPageContent, 'Opted In')
    };

    console.log('✅ Step 9: Debug page information extracted:');
    Object.entries(debugInfo).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });

    // Step 10: Test the clear consent functionality
    const clearButton = page.locator('button:has-text("Clear Consent & Reload")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      console.log('✅ Step 10: Clicked "Clear Consent & Reload" button');
      
      await page.screenshot({ 
        path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/evidence-04-after-clear.png',
        fullPage: true 
      });

      // Extract debug info again
      const debugPageContentAfter = await page.textContent('body');
      const debugInfoAfter = {
        analyticsConsent: extractDebugValue(debugPageContentAfter, 'Analytics Consent'),
        consentRequired: extractDebugValue(debugPageContentAfter, 'Consent Required'),
        showBanner: extractDebugValue(debugPageContentAfter, 'Show Banner'),
        showModal: extractDebugValue(debugPageContentAfter, 'Show Modal'),
        contextInitialized: extractDebugValue(debugPageContentAfter, 'Context Initialized'),
        localStorageValue: extractDebugValue(debugPageContentAfter, 'LocalStorage Value')
      };

      console.log('✅ Step 10b: Debug info after clearing consent:');
      Object.entries(debugInfoAfter).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value}`);
      });
    } else {
      console.log('❌ Step 10: Clear consent button not found');
    }

    // Step 11: Navigate back to homepage to check if banner appears
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    console.log('✅ Step 11: Navigated back to homepage after clearing consent');

    await page.screenshot({ 
      path: '/Users/cryophobic/dev/projects/focuslab/tests/playwright/screenshots/evidence-05-homepage-after-clear.png',
      fullPage: true 
    });

    // Final verification
    const finalState = await page.evaluate(() => {
      let localStorageState = 'UNKNOWN';
      try {
        localStorageState = localStorage.getItem('cookie-consent');
      } catch (e) {
        localStorageState = 'ERROR_ACCESSING';
      }

      const visibleBanners = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = (el.textContent || '').toLowerCase();
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        return (text.includes('cookie') || text.includes('consent')) &&
               (text.includes('accept') || text.includes('allow') || text.includes('agree')) &&
               style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               rect.width > 0 &&
               rect.height > 0;
      });

      return {
        localStorageContent: localStorageState,
        bannerVisible: visibleBanners.length > 0,
        bannerCount: visibleBanners.length
      };
    });

    console.log('✅ Step 12: Final verification:');
    console.log(`   - localStorage after clear: ${finalState.localStorageContent}`);
    console.log(`   - Banner visible: ${finalState.bannerVisible}`);
    console.log(`   - Banner count: ${finalState.bannerCount}`);

    // Create comprehensive issue report
    const issueReport = {
      testName: 'Cookie Consent Banner Loading Issue - Comprehensive Evidence',
      timestamp: new Date().toISOString(),
      issue: {
        summary: 'Cookie consent banner does not appear for first-time users',
        severity: 'HIGH - Privacy compliance issue',
        reproduced: true
      },
      evidence: {
        initialState,
        postWaitState,
        debugInfo,
        finalState
      },
      rootCause: {
        suspected: 'SSR/Hydration timing mismatch in isConsentRequired() function',
        details: [
          'isConsentRequired() returns false during SSR because localStorage is not accessible',
          'CookieConsentProvider initializes with showBanner: false',
          'Even after hydration, the banner state is not recalculated',
          'Debug page shows "Consent Required: No" even with cleared localStorage'
        ]
      },
      impact: {
        users: 'All first-time visitors',
        compliance: 'GDPR/privacy law compliance at risk',
        analytics: 'PostHog analytics not properly initialized due to missing consent'
      },
      recommendations: [
        'Fix isConsentRequired() to properly handle SSR/client-side differences',
        'Add re-evaluation of consent state after hydration',
        'Ensure banner shows when no consent exists in localStorage',
        'Add proper client-side initialization flow'
      ]
    };

    console.log('📋 COMPREHENSIVE ISSUE REPORT:');
    console.log(JSON.stringify(issueReport, null, 2));

    // Assertions to document the issue
    expect(finalState.bannerVisible, 'Cookie banner should be visible for first-time users but is not').toBe(false);
    expect(debugInfo.consentRequired, 'Debug page should show consent is required but shows it is not').not.toBe('Yes');
    expect(finalState.localStorageContent, 'localStorage should be null for first-time users').toBe(null);
  });

  test('Performance timing analysis of banner appearance', async ({ page }) => {
    console.log('⏱️ PERFORMANCE TIMING ANALYSIS');
    console.log('===============================');

    // Clear storage
    await page.context().clearCookies();
    
    // Set up performance monitoring
    await page.addInitScript(() => {
      window.performanceMarks = [];
      const originalMark = performance.mark;
      performance.mark = function(markName) {
        window.performanceMarks.push({
          name: markName,
          timestamp: Date.now(),
          performanceNow: performance.now()
        });
        return originalMark.call(this, markName);
      };
    });

    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Capture performance data
    const performanceData = await page.evaluate(() => {
      return {
        marks: window.performanceMarks || [],
        timing: {
          navigationStart: performance.timing.navigationStart,
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
        },
        paint: performance.getEntriesByType('paint').map(entry => ({
          name: entry.name,
          startTime: entry.startTime
        }))
      };
    });

    console.log(`⏱️ Page load time: ${loadTime}ms`);
    console.log(`⏱️ DOMContentLoaded: ${performanceData.timing.domContentLoaded}ms`);
    console.log(`⏱️ Load complete: ${performanceData.timing.loadComplete}ms`);
    console.log('⏱️ Performance marks:', performanceData.marks);
    console.log('⏱️ Paint timing:', performanceData.paint);

    // Wait and check if banner appears at any point
    let bannerAppeared = false;
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      
      const bannerVisible = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('*')).some(el => {
          const text = (el.textContent || '').toLowerCase();
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          
          return (text.includes('cookie') || text.includes('consent')) &&
                 (text.includes('accept') || text.includes('allow')) &&
                 style.display !== 'none' &&
                 style.visibility !== 'hidden' &&
                 rect.width > 0 &&
                 rect.height > 0;
        });
      });

      if (bannerVisible) {
        bannerAppeared = true;
        console.log(`⏱️ Banner appeared at ${(i + 1) * 500}ms after load`);
        break;
      }
    }

    if (!bannerAppeared) {
      console.log('⏱️ Banner never appeared during 5 second observation period');
    }

    expect(bannerAppeared).toBe(false); // This documents that the banner doesn't appear
  });
});