import { renderHook, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest';
import React from 'react';
import { useLocation, useMatches } from '@remix-run/react';
import {
  PHProvider,
  trackEvent,
  identifyUser,
  isPostHogReady,
  getAnalyticsConsentStatus,
} from '../posthog';

// Mock PostHog
const mockPostHog = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  __loaded: false,
};

// Mock posthog-js
vi.mock('posthog-js', () => ({
  default: mockPostHog,
}));

// Mock PostHogProvider
vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="posthog-provider">{children}</div>
  ),
}));

// Mock Remix hooks
vi.mock('@remix-run/react', () => ({
  useLocation: vi.fn(),
  useMatches: vi.fn(),
}));

// Mock SSR utilities
vi.mock('~/utils/ssr', () => ({
  useIsMounted: vi.fn(() => true),
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  isBrowser: true,
}));

const mockUseLocation = vi.mocked(useLocation);
const mockUseMatches = vi.mocked(useMatches);

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock window
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  location: { pathname: '/test' },
};

beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset PostHog mock state
  mockPostHog.__loaded = false;
  mockPostHog.init.mockImplementation((apiKey, config) => {
    // Simulate async initialization
    setTimeout(() => {
      mockPostHog.__loaded = true;
      if (config?.loaded) {
        config.loaded(mockPostHog);
      }
    }, 0);
  });
  
  // Setup default mocks
  mockUseLocation.mockReturnValue({ pathname: '/test' } as any);
  mockUseMatches.mockReturnValue([
    { id: 'root', data: null },
    { id: 'routes/test', data: null },
  ]);
  
  // Mock localStorage
  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
  
  // Mock window
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
  });
  
  // Mock console methods
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PostHog Integration', () => {
  describe('PHProvider Component', () => {
    test('renders children', () => {
      render(
        <PHProvider>
          <div data-testid="child">Test Child</div>
        </PHProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('posthog-provider')).toBeInTheDocument();
    });

    test('does not initialize PostHog without API key', () => {
      render(
        <PHProvider env={{}}>
          <div>Test</div>
        </PHProvider>
      );
      
      expect(mockPostHog.init).not.toHaveBeenCalled();
    });

    test('does not initialize PostHog with placeholder API key', () => {
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'YOUR_POSTHOG_API_KEY' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      expect(mockPostHog.init).not.toHaveBeenCalled();
    });

    test('does not initialize PostHog with empty API key', () => {
      render(
        <PHProvider env={{ POSTHOG_API_KEY: '' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      expect(mockPostHog.init).not.toHaveBeenCalled();
    });

    test('initializes PostHog with valid API key and no consent', async () => {
      mockLocalStorage.getItem.mockReturnValue(null); // No consent data
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalledWith('ph_test_key', {
          api_host: 'https://us.i.posthog.com',
          capture_pageview: false,
          persistence: 'localStorage',
          autocapture: false,
          opt_out_capturing_by_default: true, // No consent = opted out
          loaded: expect.any(Function),
        });
      });
    });

    test('initializes PostHog with analytics consent granted', async () => {
      const consentData = {
        essential: true,
        functional: false,
        analytics: true,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(consentData));
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalledWith('ph_test_key', {
          api_host: 'https://us.i.posthog.com',
          capture_pageview: false,
          persistence: 'localStorage',
          autocapture: false,
          opt_out_capturing_by_default: false, // Consent granted = opted in
          loaded: expect.any(Function),
        });
      });
    });

    test('uses custom API host when provided', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(
        <PHProvider 
          env={{ 
            POSTHOG_API_KEY: 'ph_test_key',
            POSTHOG_API_HOST: 'https://custom.posthog.com'
          }}
        >
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalledWith('ph_test_key', {
          api_host: 'https://custom.posthog.com',
          capture_pageview: false,
          persistence: 'localStorage',
          autocapture: false,
          opt_out_capturing_by_default: true,
          loaded: expect.any(Function),
        });
      });
    });

    test('captures initial pageview when consent is granted', async () => {
      const consentData = {
        essential: true,
        functional: false,
        analytics: true,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(consentData));
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalled();
      });
      
      // Simulate PostHog loaded callback
      const initCall = mockPostHog.init.mock.calls[0];
      const config = initCall[1];
      if (config?.loaded) {
        config.loaded(mockPostHog);
      }
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('$pageview', {
        $current_url: '/test',
        $screen_name: 'initial_load',
      });
    });

    test('does not capture initial pageview when consent is denied', async () => {
      const consentData = {
        essential: true,
        functional: false,
        analytics: false, // Analytics consent denied
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(consentData));
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalled();
      });
      
      // Simulate PostHog loaded callback
      const initCall = mockPostHog.init.mock.calls[0];
      const config = initCall[1];
      if (config?.loaded) {
        config.loaded(mockPostHog);
      }
      
      expect(mockPostHog.capture).not.toHaveBeenCalled();
    });

    test('handles consent system failure gracefully', async () => {
      // Mock consent system failure by making localStorage throw consistently
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalledWith('ph_test_key', {
          api_host: 'https://us.i.posthog.com',
          capture_pageview: false,
          persistence: 'localStorage',
          autocapture: false,
          opt_out_capturing_by_default: true, // Default to opted out for safety
          loaded: expect.any(Function),
        });
      });
      
      expect(console.warn).toHaveBeenCalledWith(
        'PostHog: Consent system failed to initialize, defaulting to opt-out'
      );
    });

    test('handles PostHog initialization errors', async () => {
      mockPostHog.init.mockImplementation(() => {
        throw new Error('PostHog init failed');
      });
      
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'PostHog: Initialization error:',
          expect.any(Error)
        );
      });
    });

    test('waits for consent system before initializing', async () => {
      let resolveConsent: (value: boolean) => void;
      const consentPromise = new Promise<boolean>((resolve) => {
        resolveConsent = resolve;
      });
      
      // Mock consent system that takes time to initialize
      mockLocalStorage.getItem
        .mockReturnValueOnce(null) // First few checks return null
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null)
        .mockReturnValue(JSON.stringify({ // Eventually returns consent
          essential: true,
          analytics: true,
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      // Should not initialize immediately
      expect(mockPostHog.init).not.toHaveBeenCalled();
      
      // Wait for retry logic to complete
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Consent Event Handling', () => {
    test('listens for consent update events', async () => {
      const consentData = {
        essential: true,
        analytics: false,
        functional: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(consentData));
      mockPostHog.__loaded = true;
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockWindow.addEventListener).toHaveBeenCalledWith(
          'cookieConsentUpdated',
          expect.any(Function)
        );
        expect(mockWindow.addEventListener).toHaveBeenCalledWith(
          'cookieConsentRevoked',
          expect.any(Function)
        );
      });
    });

    test('updates PostHog consent when consent event is fired', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        essential: true,
        analytics: false,
        functional: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      }));
      
      mockPostHog.__loaded = true;
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockWindow.addEventListener).toHaveBeenCalled();
      });
      
      // Simulate consent granted
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        essential: true,
        analytics: true, // Changed to true
        functional: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      }));
      
      // Get the event handler and call it
      const eventHandlers = mockWindow.addEventListener.mock.calls;
      const consentUpdateHandler = eventHandlers.find(
        call => call[0] === 'cookieConsentUpdated'
      )?.[1];
      
      if (consentUpdateHandler) {
        consentUpdateHandler();
      }
      
      expect(mockPostHog.opt_in_capturing).toHaveBeenCalled();
    });

    test('handles consent revocation events', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        essential: true,
        analytics: true,
        functional: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      }));
      
      mockPostHog.__loaded = true;
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockWindow.addEventListener).toHaveBeenCalled();
      });
      
      // Simulate consent revoked
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Get the event handler and call it
      const eventHandlers = mockWindow.addEventListener.mock.calls;
      const consentRevokeHandler = eventHandlers.find(
        call => call[0] === 'cookieConsentRevoked'
      )?.[1];
      
      if (consentRevokeHandler) {
        consentRevokeHandler();
      }
      
      expect(mockPostHog.opt_out_capturing).toHaveBeenCalled();
    });

    test('cleans up event listeners on unmount', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const { unmount } = render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockWindow.addEventListener).toHaveBeenCalled();
      });
      
      unmount();
      
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'cookieConsentUpdated',
        expect.any(Function)
      );
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'cookieConsentRevoked',
        expect.any(Function)
      );
    });

    test('handles consent update errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        essential: true,
        analytics: false,
        functional: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      }));
      
      mockPostHog.__loaded = true;
      mockPostHog.opt_in_capturing.mockImplementation(() => {
        throw new Error('PostHog opt-in failed');
      });
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockWindow.addEventListener).toHaveBeenCalled();
      });
      
      // Update consent to granted
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        essential: true,
        analytics: true,
        functional: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      }));
      
      const eventHandlers = mockWindow.addEventListener.mock.calls;
      const consentUpdateHandler = eventHandlers.find(
        call => call[0] === 'cookieConsentUpdated'
      )?.[1];
      
      if (consentUpdateHandler) {
        consentUpdateHandler();
      }
      
      expect(console.error).toHaveBeenCalledWith(
        'PostHog: Error updating consent state:',
        expect.any(Error)
      );
    });
  });

  describe('Route Tracking', () => {
    test('tracks route changes when consent is granted', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        essential: true,
        analytics: true,
        functional: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      }));
      
      mockPostHog.__loaded = true;
      
      const { rerender } = render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalled();
      });
      
      // Change route
      mockUseLocation.mockReturnValue({ pathname: '/new-route' } as any);
      mockUseMatches.mockReturnValue([
        { id: 'root', data: null },
        { id: 'routes/new-route', data: null },
      ]);
      
      rerender(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('$pageview', {
        $current_url: '/new-route',
        $screen_name: 'routes/new-route',
      });
    });

    test('does not track routes when consent is denied', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        essential: true,
        analytics: false, // Analytics denied
        functional: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      }));
      
      mockPostHog.__loaded = true;
      
      const { rerender } = render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalled();
      });
      
      // Clear previous calls
      mockPostHog.capture.mockClear();
      
      // Change route
      mockUseLocation.mockReturnValue({ pathname: '/new-route' } as any);
      
      rerender(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      expect(mockPostHog.capture).not.toHaveBeenCalled();
    });

    test('identifies user when user data is available', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        essential: true,
        analytics: true,
        functional: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      }));
      
      mockPostHog.__loaded = true;
      
      mockUseMatches.mockReturnValue([
        { 
          id: 'root', 
          data: { 
            user: { 
              id: 'user123', 
              email: 'test@example.com' 
            } 
          } 
        },
      ]);
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.identify).toHaveBeenCalledWith('user123', {
          email: 'test@example.com',
        });
      });
    });

    test('handles route tracking errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        essential: true,
        analytics: true,
        functional: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      }));
      
      mockPostHog.__loaded = true;
      mockPostHog.capture.mockImplementation(() => {
        throw new Error('Route tracking failed');
      });
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'PostHog: Route tracking error:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Helper Functions', () => {
    describe('trackEvent', () => {
      test('tracks event when PostHog is ready and consent is granted', () => {
        mockPostHog.__loaded = true;
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          essential: true,
          analytics: true,
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
        
        trackEvent('test_event', { property: 'value' });
        
        expect(mockPostHog.capture).toHaveBeenCalledWith('test_event', {
          property: 'value',
        });
      });

      test('does not track event when PostHog is not loaded', () => {
        mockPostHog.__loaded = false;
        
        trackEvent('test_event');
        
        expect(mockPostHog.capture).not.toHaveBeenCalled();
      });

      test('does not track event when consent is denied', () => {
        mockPostHog.__loaded = true;
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          essential: true,
          analytics: false, // Analytics denied
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
        
        trackEvent('test_event');
        
        expect(mockPostHog.capture).not.toHaveBeenCalled();
      });

      test('handles tracking errors gracefully', () => {
        mockPostHog.__loaded = true;
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          essential: true,
          analytics: true,
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
        
        mockPostHog.capture.mockImplementation(() => {
          throw new Error('Event tracking failed');
        });
        
        expect(() => trackEvent('test_event')).not.toThrow();
        
        expect(console.error).toHaveBeenCalledWith(
          'PostHog: Event tracking error:',
          expect.any(Error)
        );
      });
    });

    describe('identifyUser', () => {
      test('identifies user when conditions are met', () => {
        mockPostHog.__loaded = true;
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          essential: true,
          analytics: true,
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
        
        identifyUser('user123', { email: 'test@example.com' });
        
        expect(mockPostHog.identify).toHaveBeenCalledWith('user123', {
          email: 'test@example.com',
        });
      });

      test('does not identify user when consent is denied', () => {
        mockPostHog.__loaded = true;
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          essential: true,
          analytics: false,
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
        
        identifyUser('user123');
        
        expect(mockPostHog.identify).not.toHaveBeenCalled();
      });

      test('handles identification errors gracefully', () => {
        mockPostHog.__loaded = true;
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          essential: true,
          analytics: true,
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
        
        mockPostHog.identify.mockImplementation(() => {
          throw new Error('Identification failed');
        });
        
        expect(() => identifyUser('user123')).not.toThrow();
        
        expect(console.error).toHaveBeenCalledWith(
          'PostHog: User identification error:',
          expect.any(Error)
        );
      });
    });

    describe('isPostHogReady', () => {
      test('returns true when PostHog is loaded and consent is granted', () => {
        mockPostHog.__loaded = true;
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          essential: true,
          analytics: true,
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
        
        expect(isPostHogReady()).toBe(true);
      });

      test('returns false when PostHog is not loaded', () => {
        mockPostHog.__loaded = false;
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          essential: true,
          analytics: true,
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
        
        expect(isPostHogReady()).toBe(false);
      });

      test('returns false when consent is denied', () => {
        mockPostHog.__loaded = true;
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          essential: true,
          analytics: false,
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
        
        expect(isPostHogReady()).toBe(false);
      });
    });

    describe('getAnalyticsConsentStatus', () => {
      test('returns correct consent status', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          essential: true,
          analytics: true,
          functional: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        }));
        
        const status = getAnalyticsConsentStatus();
        
        expect(status).toEqual({
          hasConsent: true,
          isSystemReady: true,
        });
      });

      test('returns false consent when no data exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        
        const status = getAnalyticsConsentStatus();
        
        expect(status).toEqual({
          hasConsent: false,
          isSystemReady: false,
        });
      });

      test('handles localStorage errors', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        const status = getAnalyticsConsentStatus();
        
        expect(status).toEqual({
          hasConsent: false,
          isSystemReady: false,
        });
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles malformed consent data gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json{');
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalledWith('ph_test_key', {
          api_host: 'https://us.i.posthog.com',
          capture_pageview: false,
          persistence: 'localStorage',
          autocapture: false,
          opt_out_capturing_by_default: true, // Defaults to opted out for safety
          loaded: expect.any(Function),
        });
      });
    });

    test('handles PostHog __loaded property being undefined', () => {
      // @ts-ignore
      delete mockPostHog.__loaded;
      
      expect(isPostHogReady()).toBe(false);
      expect(() => trackEvent('test')).not.toThrow();
      expect(() => identifyUser('user123')).not.toThrow();
    });

    test('handles missing window object', async () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      // Should not throw during render
      expect(() => {
        render(
          <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
            <div>Test</div>
          </PHProvider>
        );
      }).not.toThrow();
      
      global.window = originalWindow;
    });

    test('handles consent system timeout gracefully', async () => {
      // Mock consent system that never resolves
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Persistent storage error');
      });
      
      render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      // Should eventually initialize with default settings
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalledWith('ph_test_key', {
          api_host: 'https://us.i.posthog.com',
          capture_pageview: false,
          persistence: 'localStorage',
          autocapture: false,
          opt_out_capturing_by_default: true,
          loaded: expect.any(Function),
        });
      }, { timeout: 2000 });
      
      expect(console.warn).toHaveBeenCalledWith(
        'PostHog: Consent system failed to initialize, defaulting to opt-out'
      );
    });

    test('prevents double initialization', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const { rerender } = render(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      await waitFor(() => {
        expect(mockPostHog.init).toHaveBeenCalledTimes(1);
      });
      
      // Re-render should not cause re-initialization
      rerender(
        <PHProvider env={{ POSTHOG_API_KEY: 'ph_test_key' }}>
          <div>Test</div>
        </PHProvider>
      );
      
      // Should still only be called once
      expect(mockPostHog.init).toHaveBeenCalledTimes(1);
    });
  });
});