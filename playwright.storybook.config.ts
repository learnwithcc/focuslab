import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration specifically for Storybook testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/storybook',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report-storybook' }],
    ['json', { outputFile: 'test-results/storybook-results.json' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for Storybook */
    baseURL: 'http://localhost:6006',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Always take screenshots for Storybook tests (for documentation) */
    screenshot: 'always',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Longer timeout for Storybook loading */
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  /* Configure projects for testing Storybook across browsers */
  projects: [
    {
      name: 'storybook-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Specific viewport for Storybook testing */
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'storybook-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'storybook-webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },

    /* Mobile testing for Storybook responsive behavior */
    {
      name: 'storybook-mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
  ],

  /* Start Storybook before running tests */
  webServer: {
    command: 'STORYBOOK=true npm run storybook',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 60000, // Give Storybook time to start
  },
});