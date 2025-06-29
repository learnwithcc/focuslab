import type { Preview } from '@storybook/react-vite';
import '../app/styles/tailwind.css';
import { withThemeByClassName } from '@storybook/addon-themes';
import { themes } from 'storybook/internal/theming';

const preview: Preview = {
  parameters: {
    backgrounds: {
      disable: true, // Use theme addon instead
    },
    docs: {
      theme: {
        ...themes.light,
        base: 'light',
        brandTitle: 'FocusLab Components',
        brandUrl: 'https://focuslab.dev',
        appBg: '#ffffff',
        appContentBg: '#ffffff', 
        appPreviewBg: '#ffffff',
        colorPrimary: '#4a0e4e',
        colorSecondary: '#00b2a9',
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
        wide: {
          name: 'Wide',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
    a11y: {
      config: {},
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
        restoreScroll: true,
      },
    },
    testCodegen: {
      generatedTestsDestination: './tests/storybook-generated',
      framework: 'playwright',
    },
  },
  decorators: [
    // Enhanced theme decorator with automatic system preference detection
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
    // Auto-detect system preference decorator
    (Story, context) => {
      // Only run system preference detection on first load
      if (typeof window !== 'undefined' && !window.__storybookThemeInitialized) {
        window.__storybookThemeInitialized = true;
        
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Set initial theme based on system preference
        if (prefersDark && context.globals.theme !== 'dark') {
          // Use timeout to ensure Storybook is ready
          setTimeout(() => {
            const themeSelector = document.querySelector('[title*="theme"]') as HTMLButtonElement;
            if (themeSelector && !document.documentElement.classList.contains('dark')) {
              themeSelector.click();
            }
          }, 100);
        }
        
        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          const themeSelector = document.querySelector('[title*="theme"]') as HTMLButtonElement;
          if (themeSelector) {
            const isDarkMode = document.documentElement.classList.contains('dark');
            if (e.matches && !isDarkMode) {
              themeSelector.click();
            } else if (!e.matches && isDarkMode) {
              themeSelector.click();
            }
          }
        });
      }
      
      return Story();
    },
    (Story) => {
      // Mock context providers for Storybook
      const MockNonceProvider = ({ children }: { children: React.ReactNode }) => children;
      const MockCookieConsentProvider = ({ children }: { children: React.ReactNode }) => children;
      const MockPHProvider = ({ children }: { children: React.ReactNode }) => children;
      
      return (
        <MockNonceProvider>
          <MockCookieConsentProvider>
            <MockPHProvider>
              <div className="min-h-screen bg-background text-foreground">
                <Story />
              </div>
            </MockPHProvider>
          </MockCookieConsentProvider>
        </MockNonceProvider>
      );
    },
  ],
};

export default preview;