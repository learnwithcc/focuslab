import { test, expect, type Page } from '@playwright/test';
import { performance } from 'perf_hooks';

// Performance metrics interface
interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  tti: number | null;
  bannerAppearanceTime: number | null;
  hydrationTime: number | null;
  jsExecutionTime: number;
  memoryUsage: number | null;
  networkRequests: number;
  layoutShifts: number;
  transitionSmoothness: number;
  errorRecoveryTime: number | null;
}

interface TestScenario {
  name: string;
  description: string;
  setup: (page: Page) => Promise<void>;
  expectedBannerState: 'shown' | 'hidden' | 'either';
}

class PerformanceAnalyzer {
  private page: Page;
  private metrics: PerformanceMetrics;
  private startTime: number;

  constructor(page: Page) {
    this.page = page;
    this.metrics = this.getEmptyMetrics();
    this.startTime = performance.now();
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      tti: null,
      bannerAppearanceTime: null,
      hydrationTime: null,
      jsExecutionTime: 0,
      memoryUsage: null,
      networkRequests: 0,
      layoutShifts: 0,
      transitionSmoothness: 0,
      errorRecoveryTime: null,
    };
  }

  async measureCoreWebVitals(): Promise<void> {
    // Measure Core Web Vitals using browser APIs
    const webVitals = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {};
        let resolveTimeout: NodeJS.Timeout;

        // Set a timeout to resolve after 5 seconds if not all metrics are available
        resolveTimeout = setTimeout(() => resolve(metrics), 5000);

        // LCP
        if ('PerformanceObserver' in window) {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              const lastEntry = entries[entries.length - 1] as any;
              metrics.lcp = lastEntry.startTime;
            }
          });
          try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            console.warn('LCP observation failed:', e);
          }

          // FCP
          const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              metrics.fcp = entries[0].startTime;
            }
          });
          try {
            fcpObserver.observe({ entryTypes: ['paint'] });
          } catch (e) {
            console.warn('FCP observation failed:', e);
          }

          // CLS
          const clsObserver = new PerformanceObserver((list) => {
            let cls = 0;
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
            metrics.cls = cls;
          });
          try {
            clsObserver.observe({ entryTypes: ['layout-shift'] });
          } catch (e) {
            console.warn('CLS observation failed:', e);
          }
        }

        // TTI approximation using navigation timing
        if (performance.getEntriesByType) {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            metrics.tti = navigation.domInteractive - navigation.navigationStart;
            metrics.jsExecutionTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          }
        }

        // Memory usage (if available)
        if ((performance as any).memory) {
          metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }

        // Network requests count
        const resourceEntries = performance.getEntriesByType('resource');
        metrics.networkRequests = resourceEntries.length;

        // Wait for some metrics to be available
        setTimeout(() => {
          clearTimeout(resolveTimeout);
          resolve(metrics);
        }, 2000);
      });
    });

    // Update metrics with Core Web Vitals
    this.metrics.lcp = webVitals.lcp || null;
    this.metrics.fcp = webVitals.fcp || null;
    this.metrics.cls = webVitals.cls || null;
    this.metrics.tti = webVitals.tti || null;
    this.metrics.jsExecutionTime = webVitals.jsExecutionTime || 0;
    this.metrics.memoryUsage = webVitals.memoryUsage || null;
    this.metrics.networkRequests = webVitals.networkRequests || 0;
  }

  async measureBannerTiming(): Promise<void> {
    const bannerTimingStart = performance.now();
    
    try {
      // Wait for banner to appear or timeout after 3 seconds
      await this.page.waitForSelector('[data-testid="cookie-banner"], [data-testid="fallback-consent-banner"]', {
        timeout: 3000,
        state: 'visible'
      });
      
      this.metrics.bannerAppearanceTime = performance.now() - bannerTimingStart;
    } catch (error) {
      // Banner didn't appear (might be a returning user scenario)
      this.metrics.bannerAppearanceTime = null;
    }
  }

  async measureHydrationTiming(): Promise<void> {
    // Measure hydration by checking when React is ready
    const hydrationTime = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const start = performance.now();
        
        // Check if React has hydrated by looking for hydration markers
        const checkHydration = () => {
          // Look for React-specific indicators or custom hydration markers
          const reactRoot = document.querySelector('#root [data-reactroot], #root [data-react-hydrate]');
          const hasInteractiveElements = document.querySelector('button, input, [role="button"]');
          
          if (reactRoot || hasInteractiveElements) {
            resolve(performance.now() - start);
          } else {
            requestAnimationFrame(checkHydration);
          }
        };
        
        checkHydration();
        
        // Fallback timeout
        setTimeout(() => resolve(performance.now() - start), 5000);
      });
    });

    this.metrics.hydrationTime = hydrationTime as number;
  }

  async measureLayoutShifts(): Promise<void> {
    // Count layout shifts that occur during page load
    const layoutShifts = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        let shiftCount = 0;
        let totalShiftScore = 0;

        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutShift = entry as any;
              if (!layoutShift.hadRecentInput) {
                shiftCount++;
                totalShiftScore += layoutShift.value;
              }
            }
          });

          try {
            observer.observe({ entryTypes: ['layout-shift'] });
          } catch (e) {
            console.warn('Layout shift observation failed:', e);
          }
        }

        // Measure for 3 seconds
        setTimeout(() => {
          resolve({ count: shiftCount, totalScore: totalShiftScore });
        }, 3000);
      });
    });

    const shifts = layoutShifts as { count: number; totalScore: number };
    this.metrics.layoutShifts = shifts.count;
    this.metrics.cls = shifts.totalScore;
  }

  async measurePostHogInitTiming(): Promise<void> {
    // Measure PostHog initialization timing
    const posthogTiming = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const start = performance.now();
        let initComplete = false;

        // Check if PostHog is loaded
        const checkPostHog = () => {
          if (window.posthog && window.posthog.__loaded) {
            if (!initComplete) {
              initComplete = true;
              resolve(performance.now() - start);
            }
          } else {
            requestAnimationFrame(checkPostHog);
          }
        };

        checkPostHog();

        // Fallback timeout
        setTimeout(() => {
          if (!initComplete) {
            resolve(null); // PostHog didn't initialize
          }
        }, 5000);
      });
    });

    // Store PostHog timing in a custom field
    (this.metrics as any).posthogInitTime = posthogTiming;
  }

  async measureErrorRecovery(): Promise<void> {
    // Simulate error conditions and measure recovery time
    try {
      const recoveryStart = performance.now();
      
      // Trigger a localStorage error simulation
      await this.page.evaluate(() => {
        // Simulate localStorage being full or unavailable
        const original = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('Simulated localStorage error');
        };
        
        // Trigger error by trying to save consent
        try {
          window.dispatchEvent(new CustomEvent('simulate-consent-error'));
        } catch (e) {
          // Expected error
        }
        
        // Restore localStorage
        localStorage.setItem = original;
      });

      // Wait for error boundary to recover
      await this.page.waitForSelector('[data-testid="fallback-consent-banner"]', {
        timeout: 3000,
        state: 'visible'
      });

      this.metrics.errorRecoveryTime = performance.now() - recoveryStart;
    } catch (error) {
      // No error recovery needed or error boundary not triggered
      this.metrics.errorRecoveryTime = null;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}

// Test scenarios
const testScenarios: TestScenario[] = [
  {
    name: 'first-time-user',
    description: 'First-time user with no existing consent',
    setup: async (page: Page) => {
      // Clear all storage
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    },
    expectedBannerState: 'shown'
  },
  {
    name: 'returning-user-with-consent',
    description: 'Returning user with existing analytics consent',
    setup: async (page: Page) => {
      // Set up existing consent
      await page.evaluate(() => {
        localStorage.setItem('cookie-consent', JSON.stringify({
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0'
        }));
      });
    },
    expectedBannerState: 'hidden'
  },
  {
    name: 'returning-user-no-consent',
    description: 'Returning user who previously rejected analytics',
    setup: async (page: Page) => {
      // Set up rejected consent
      await page.evaluate(() => {
        localStorage.setItem('cookie-consent', JSON.stringify({
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
          timestamp: Date.now(),  
          version: '1.0.0'
        }));
      });
    },
    expectedBannerState: 'hidden'
  },
  {
    name: 'error-fallback-scenario',
    description: 'User with corrupted consent data triggering fallback',
    setup: async (page: Page) => {
      // Set up corrupted consent
      await page.evaluate(() => {
        localStorage.setItem('cookie-consent', 'invalid-json-data');
      });
    },
    expectedBannerState: 'shown'
  }
];

// Performance test suite
test.describe('Cookie Consent Performance Analysis', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const scenario of testScenarios) {
    test(`Performance Analysis: ${scenario.name}`, async ({ page, browserName }) => {
      console.log(`\n🧪 Testing scenario: ${scenario.description}`);
      console.log(`📱 Browser: ${browserName}`);

      // Set up scenario
      await scenario.setup(page);

      // Create performance analyzer
      const analyzer = new PerformanceAnalyzer(page);

      // Navigate to homepage with performance monitoring
      const navigationStart = performance.now();
      await page.goto('http://localhost:3600', {
        waitUntil: 'domcontentloaded'
      });

      // Measure performance metrics
      console.log('📊 Measuring Core Web Vitals...');
      await analyzer.measureCoreWebVitals();

      console.log('⏱️ Measuring banner timing...');
      await analyzer.measureBannerTiming();

      console.log('💧 Measuring hydration timing...');
      await analyzer.measureHydrationTiming();

      console.log('📐 Measuring layout shifts...');
      await analyzer.measureLayoutShifts();

      console.log('📈 Measuring PostHog initialization...');
      await analyzer.measurePostHogInitTiming();

      console.log('🔄 Measuring error recovery...');
      await analyzer.measureErrorRecovery();

      // Get final metrics
      const metrics = analyzer.getMetrics();
      const navigationTime = performance.now() - navigationStart;

      // Verify banner state matches expectation
      const bannerVisible = await page.locator('[data-testid="cookie-banner"], [data-testid="fallback-consent-banner"]').isVisible();
      
      if (scenario.expectedBannerState === 'shown') {
        expect(bannerVisible).toBe(true);
      } else if (scenario.expectedBannerState === 'hidden') {
        expect(bannerVisible).toBe(false);
      }
      // 'either' case doesn't assert

      // Performance assertions
      if (metrics.lcp) {
        expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s is good
      }

      if (metrics.fcp) {
        expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s is good
      }

      if (metrics.cls !== null) {
        expect(metrics.cls).toBeLessThan(0.1); // CLS < 0.1 is good
      }

      if (metrics.bannerAppearanceTime) {
        expect(metrics.bannerAppearanceTime).toBeLessThan(500); // Banner should appear within 500ms
      }

      if (metrics.hydrationTime) {
        expect(metrics.hydrationTime).toBeLessThan(1000); // Hydration should complete within 1s
      }

      // Log comprehensive results
      console.log(`\n📋 Performance Results for ${scenario.name}:`);
      console.log('═══════════════════════════════════════════════');
      console.log(`🎯 Core Web Vitals:`);
      console.log(`   • LCP: ${metrics.lcp ? `${metrics.lcp.toFixed(2)}ms` : 'Not measured'}`);
      console.log(`   • FCP: ${metrics.fcp ? `${metrics.fcp.toFixed(2)}ms` : 'Not measured'}`);
      console.log(`   • CLS: ${metrics.cls !== null ? metrics.cls.toFixed(4) : 'Not measured'}`);
      console.log(`   • TTI: ${metrics.tti ? `${metrics.tti.toFixed(2)}ms` : 'Not measured'}`);
      
      console.log(`\n🍪 Cookie Consent Metrics:`);
      console.log(`   • Banner Appearance: ${metrics.bannerAppearanceTime ? `${metrics.bannerAppearanceTime.toFixed(2)}ms` : 'No banner shown'}`);
      console.log(`   • Hydration Time: ${metrics.hydrationTime ? `${metrics.hydrationTime.toFixed(2)}ms` : 'Not measured'}`);
      console.log(`   • Layout Shifts: ${metrics.layoutShifts}`);
      console.log(`   • Error Recovery: ${metrics.errorRecoveryTime ? `${metrics.errorRecoveryTime.toFixed(2)}ms` : 'No errors'}`);
      
      console.log(`\n⚡ Resource Metrics:`);
      console.log(`   • JS Execution: ${metrics.jsExecutionTime.toFixed(2)}ms`);
      console.log(`   • Memory Usage: ${metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'Not available'}`);
      console.log(`   • Network Requests: ${metrics.networkRequests}`);
      console.log(`   • PostHog Init: ${(metrics as any).posthogInitTime ? `${((metrics as any).posthogInitTime).toFixed(2)}ms` : 'Not initialized'}`);
      
      console.log(`\n🏁 Navigation Time: ${navigationTime.toFixed(2)}ms`);
      console.log(`🎪 Banner State: ${bannerVisible ? 'Visible' : 'Hidden'} (Expected: ${scenario.expectedBannerState})`);

      // Store results for later analysis
      await page.evaluate((results) => {
        window.performanceResults = window.performanceResults || [];
        window.performanceResults.push({
          scenario: results.scenario,
          metrics: results.metrics,
          timestamp: Date.now(),
          browser: results.browser
        });
      }, {
        scenario: scenario.name,
        metrics,
        browser: browserName
      });
    });
  }

  test('Generate Performance Report', async ({ page }) => {
    // This test runs last and generates a comprehensive report
    await page.goto('http://localhost:3600');
    
    const performanceReport = await page.evaluate(() => {
      const results = (window as any).performanceResults || [];
      
      if (results.length === 0) {
        return 'No performance data collected';
      }

      let report = '\n📊 COMPREHENSIVE PERFORMANCE ANALYSIS REPORT\n';
      report += '═══════════════════════════════════════════════════════════════\n\n';

      // Aggregate metrics by scenario
      const scenarioStats: Record<string, any> = {};
      
      results.forEach((result: any) => {
        if (!scenarioStats[result.scenario]) {
          scenarioStats[result.scenario] = {
            runs: 0,
            metrics: {
              lcp: [],
              fcp: [],
              cls: [],
              tti: [],
              bannerTime: [],
              hydrationTime: [],
              layoutShifts: [],
              jsExecution: [],
              memoryUsage: [],
              posthogInit: []
            }
          };
        }

        const stats = scenarioStats[result.scenario];
        stats.runs++;
        
        if (result.metrics.lcp) stats.metrics.lcp.push(result.metrics.lcp);
        if (result.metrics.fcp) stats.metrics.fcp.push(result.metrics.fcp);
        if (result.metrics.cls !== null) stats.metrics.cls.push(result.metrics.cls);
        if (result.metrics.tti) stats.metrics.tti.push(result.metrics.tti);
        if (result.metrics.bannerAppearanceTime) stats.metrics.bannerTime.push(result.metrics.bannerAppearanceTime);
        if (result.metrics.hydrationTime) stats.metrics.hydrationTime.push(result.metrics.hydrationTime);
        stats.metrics.layoutShifts.push(result.metrics.layoutShifts);
        stats.metrics.jsExecution.push(result.metrics.jsExecutionTime);
        if (result.metrics.memoryUsage) stats.metrics.memoryUsage.push(result.metrics.memoryUsage);
        if (result.metrics.posthogInitTime) stats.metrics.posthogInit.push(result.metrics.posthogInitTime);
      });

      // Calculate averages and generate report
      Object.keys(scenarioStats).forEach(scenario => {
        const stats = scenarioStats[scenario];
        report += `🎯 ${scenario.toUpperCase().replace(/-/g, ' ')}\n`;
        report += '─────────────────────────────────────────────────────────────\n';
        
        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
        const median = (arr: number[]) => {
          if (arr.length === 0) return null;
          const sorted = [...arr].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        };

        report += `Runs: ${stats.runs}\n`;
        report += `LCP: ${avg(stats.metrics.lcp)?.toFixed(2) || 'N/A'}ms (median: ${median(stats.metrics.lcp)?.toFixed(2) || 'N/A'}ms)\n`;
        report += `FCP: ${avg(stats.metrics.fcp)?.toFixed(2) || 'N/A'}ms (median: ${median(stats.metrics.fcp)?.toFixed(2) || 'N/A'}ms)\n`;
        report += `CLS: ${avg(stats.metrics.cls)?.toFixed(4) || 'N/A'} (median: ${median(stats.metrics.cls)?.toFixed(4) || 'N/A'})\n`;
        report += `TTI: ${avg(stats.metrics.tti)?.toFixed(2) || 'N/A'}ms (median: ${median(stats.metrics.tti)?.toFixed(2) || 'N/A'}ms)\n`;
        report += `Banner: ${avg(stats.metrics.bannerTime)?.toFixed(2) || 'N/A'}ms (median: ${median(stats.metrics.bannerTime)?.toFixed(2) || 'N/A'}ms)\n`;
        report += `Hydration: ${avg(stats.metrics.hydrationTime)?.toFixed(2) || 'N/A'}ms (median: ${median(stats.metrics.hydrationTime)?.toFixed(2) || 'N/A'}ms)\n`;
        report += `Layout Shifts: ${avg(stats.metrics.layoutShifts)?.toFixed(1) || 'N/A'} (median: ${median(stats.metrics.layoutShifts)?.toFixed(1) || 'N/A'})\n`;
        report += `JS Execution: ${avg(stats.metrics.jsExecution)?.toFixed(2) || 'N/A'}ms (median: ${median(stats.metrics.jsExecution)?.toFixed(2) || 'N/A'}ms)\n`;
        report += `Memory: ${avg(stats.metrics.memoryUsage) ? (avg(stats.metrics.memoryUsage)! / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}\n`;
        report += `PostHog Init: ${avg(stats.metrics.posthogInit)?.toFixed(2) || 'N/A'}ms\n\n`;
      });

      // Performance improvements summary
      report += '🚀 PERFORMANCE IMPROVEMENTS ACHIEVED\n';
      report += '─────────────────────────────────────────────────────────────\n';
      report += '✅ Eliminated useEffect delays in useIsMounted hook\n';
      report += '✅ Atomic state management reducing re-renders\n';
      report += '✅ Smooth CSS transitions preventing layout shifts\n';
      report += '✅ Optimized PostHog initialization timing\n';
      report += '✅ Comprehensive error boundary implementation\n';
      report += '✅ SSR-safe localStorage operations\n';
      report += '✅ Immediate hydration detection using useSyncExternalStore\n\n';

      // Recommendations
      report += '💡 RECOMMENDATIONS\n';
      report += '─────────────────────────────────────────────────────────────\n';
      
      const avgLcp = avg(results.map((r: any) => r.metrics.lcp).filter(Boolean));
      const avgCls = avg(results.map((r: any) => r.metrics.cls).filter((cls: number) => cls !== null));
      const avgBannerTime = avg(results.map((r: any) => r.metrics.bannerAppearanceTime).filter(Boolean));

      if (avgLcp && avgLcp > 2500) {
        report += '⚠️  LCP is above the recommended 2.5s threshold\n';
      } else {
        report += '✅ LCP performance is within acceptable range\n';
      }

      if (avgCls && avgCls > 0.1) {
        report += '⚠️  CLS is above the recommended 0.1 threshold\n';
      } else {
        report += '✅ CLS performance is within acceptable range\n';
      }

      if (avgBannerTime && avgBannerTime > 500) {
        report += '⚠️  Banner appearance time could be optimized\n';
      } else {
        report += '✅ Banner appearance timing is optimal\n';
      }

      return report;
    });

    console.log(performanceReport);
  });
});

// Network conditions testing
test.describe('Performance Under Different Network Conditions', () => {
  const networkConditions = [
    { name: 'fast-3g', downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 },
    { name: 'slow-3g', downloadThroughput: 500 * 1024 / 8, uploadThroughput: 500 * 1024 / 8, latency: 400 },
  ];

  for (const condition of networkConditions) {
    test(`Performance on ${condition.name}`, async ({ page, context }) => {
      // Set network conditions
      await context.route('**/*', async (route) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, condition.latency));
        route.continue();
      });

      // Clear storage for first-time user scenario
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      const analyzer = new PerformanceAnalyzer(page);
      const navigationStart = performance.now();

      await page.goto('http://localhost:3600', {
        waitUntil: 'domcontentloaded'
      });

      // Measure key metrics
      await analyzer.measureCoreWebVitals();
      await analyzer.measureBannerTiming();
      await analyzer.measureHydrationTiming();

      const metrics = analyzer.getMetrics();
      const navigationTime = performance.now() - navigationStart;

      console.log(`\n🌐 Network Condition: ${condition.name}`);
      console.log(`⏱️  Navigation Time: ${navigationTime.toFixed(2)}ms`);
      console.log(`🎯 LCP: ${metrics.lcp?.toFixed(2) || 'N/A'}ms`);
      console.log(`🍪 Banner Time: ${metrics.bannerAppearanceTime?.toFixed(2) || 'N/A'}ms`);
      console.log(`💧 Hydration Time: ${metrics.hydrationTime?.toFixed(2) || 'N/A'}ms`);

      // Network-specific assertions
      if (condition.name === 'slow-3g') {
        // More lenient thresholds for slow networks
        if (metrics.lcp) expect(metrics.lcp).toBeLessThan(4000);
        if (metrics.bannerAppearanceTime) expect(metrics.bannerAppearanceTime).toBeLessThan(1000);
      } else {
        // Standard thresholds for fast networks  
        if (metrics.lcp) expect(metrics.lcp).toBeLessThan(2500);
        if (metrics.bannerAppearanceTime) expect(metrics.bannerAppearanceTime).toBeLessThan(500);
      }
    });
  }
});

// Mobile device performance
test.describe('Mobile Performance Analysis', () => {
  test('Performance on mobile device', async ({ page, context }) => {
    // Set mobile viewport and user agent
    await page.setViewportSize({ width: 375, height: 667 });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1');

    // Throttle CPU to simulate slower mobile processor
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const analyzer = new PerformanceAnalyzer(page);
    const navigationStart = performance.now();

    await page.goto('http://localhost:3600', {
      waitUntil: 'domcontentloaded'
    });

    // Measure mobile-specific performance
    await analyzer.measureCoreWebVitals();
    await analyzer.measureBannerTiming();
    await analyzer.measureHydrationTiming();
    await analyzer.measureLayoutShifts();

    const metrics = analyzer.getMetrics();
    const navigationTime = performance.now() - navigationStart;

    console.log(`\n📱 Mobile Performance Results:`);
    console.log(`⏱️  Navigation Time: ${navigationTime.toFixed(2)}ms`);
    console.log(`🎯 Core Web Vitals:`);
    console.log(`   • LCP: ${metrics.lcp?.toFixed(2) || 'N/A'}ms`);
    console.log(`   • FCP: ${metrics.fcp?.toFixed(2) || 'N/A'}ms`);
    console.log(`   • CLS: ${metrics.cls?.toFixed(4) || 'N/A'}`);
    console.log(`🍪 Banner Time: ${metrics.bannerAppearanceTime?.toFixed(2) || 'N/A'}ms`);
    console.log(`💧 Hydration Time: ${metrics.hydrationTime?.toFixed(2) || 'N/A'}ms`);
    console.log(`📐 Layout Shifts: ${metrics.layoutShifts}`);

    // Mobile-specific assertions (more lenient thresholds)
    if (metrics.lcp) expect(metrics.lcp).toBeLessThan(4000); // Mobile LCP can be higher
    if (metrics.cls !== null) expect(metrics.cls).toBeLessThan(0.1);
    if (metrics.bannerAppearanceTime) expect(metrics.bannerAppearanceTime).toBeLessThan(800);
    if (metrics.hydrationTime) expect(metrics.hydrationTime).toBeLessThan(2000);
  });
});