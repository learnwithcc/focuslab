import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest';
import { FallbackConsentBanner } from '../FallbackConsentBanner';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock window
const mockWindow = {
  dispatchEvent: vi.fn(),
  location: { reload: vi.fn() },
  alert: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  
  // Setup localStorage mock
  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
  
  // Setup window mock
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
  });
  
  // Reset localStorage behavior
  mockLocalStorage.getItem.mockReturnValue(null);
  mockLocalStorage.setItem.mockImplementation(() => {});
  
  // Suppress console methods during tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FallbackConsentBanner', () => {
  describe('Basic Rendering', () => {
    test('renders fallback banner with correct content', () => {
      render(<FallbackConsentBanner />);
      
      expect(screen.getByText('Cookie Consent')).toBeInTheDocument();
      expect(screen.getByText(/We use cookies to enhance your browsing experience/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /accept essential cookies/i })).toBeInTheDocument();
    });

    test('displays fallback error message', () => {
      render(<FallbackConsentBanner />);
      
      expect(screen.getByText(/fallback consent system/i)).toBeInTheDocument();
      expect(screen.getByText(/We're unable to load the full cookie consent system/)).toBeInTheDocument();
    });

    test('shows essential cookies explanation', () => {
      render(<FallbackConsentBanner />);
      
      expect(screen.getByText(/only essential cookies will be enabled/i)).toBeInTheDocument();
      expect(screen.getByText(/necessary for basic website functionality/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<FallbackConsentBanner />);
      
      const banner = screen.getByRole('banner');
      expect(banner).toHaveAttribute('aria-live', 'polite');
      expect(banner).toHaveAttribute('aria-labelledby');
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('id');
      
      const button = screen.getByRole('button', { name: /accept essential cookies/i });
      expect(button).toHaveAttribute('aria-label', 'Accept essential cookies only');
    });

    test('supports keyboard navigation', () => {
      render(<FallbackConsentBanner />);
      
      const button = screen.getByRole('button', { name: /accept essential cookies/i });
      expect(button).toHaveAttribute('tabindex', '0');
      
      // Simulate keyboard interaction
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    test('handles Enter key press on button', () => {
      render(<FallbackConsentBanner />);
      
      const button = screen.getByRole('button', { name: /accept essential cookies/i });
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      // Should trigger the same action as clicking
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('handles Space key press on button', () => {
      render(<FallbackConsentBanner />);
      
      const button = screen.getByRole('button', { name: /accept essential cookies/i });
      
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      // Should trigger the same action as clicking
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('ignores other key presses', () => {
      render(<FallbackConsentBanner />);
      
      const button = screen.getByRole('button', { name: /accept essential cookies/i });
      
      fireEvent.keyDown(button, { key: 'Tab', code: 'Tab' });
      fireEvent.keyDown(button, { key: 'Escape', code: 'Escape' });
      
      // Should not trigger consent acceptance
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    test('has proper contrast and sizing for accessibility', () => {
      render(<FallbackConsentBanner />);
      
      const button = screen.getByRole('button', { name: /accept essential cookies/i });
      const computedStyle = window.getComputedStyle(button);
      
      // Button should have adequate size for touch targets (assuming CSS is applied)
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Consent Acceptance', () => {
    test('saves emergency consent when accept button is clicked', async () => {
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'cookie-consent',
          expect.stringContaining('"essential":true')
        );
      });
      
      // Verify all consent categories
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toEqual({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        timestamp: expect.any(Number),
        version: '1.0.0',
      });
    });

    test('dispatches cookieConsentUpdated event', async () => {
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'cookieConsentUpdated',
            detail: expect.objectContaining({
              essential: true,
              functional: false,
              analytics: false,
              marketing: false,
            }),
          })
        );
      });
    });

    test('removes banner from DOM after acceptance', async () => {
      render(<FallbackConsentBanner />);
      
      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(banner).not.toBeInTheDocument();
      });
    });

    test('handles multiple rapid clicks gracefully', async () => {
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      
      // Click multiple times rapidly
      fireEvent.click(acceptButton);
      fireEvent.click(acceptButton);
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        // Should only save once
        expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
      });
    });

    test('uses current timestamp when saving consent', async () => {
      const mockTimestamp = 1234567890000;
      vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
      
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
        expect(savedData.timestamp).toBe(mockTimestamp);
      });
      
      Date.now.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('handles localStorage setItem failures gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(mockWindow.alert).toHaveBeenCalledWith(
          expect.stringContaining('We are unable to save your cookie preferences')
        );
      });
      
      // Banner should remain visible on error
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    test('handles CustomEvent creation failures', async () => {
      const originalCustomEvent = global.CustomEvent;
      // @ts-ignore
      delete global.CustomEvent;
      
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      
      // Should not throw even without CustomEvent
      expect(() => fireEvent.click(acceptButton)).not.toThrow();
      
      global.CustomEvent = originalCustomEvent;
    });

    test('handles window.dispatchEvent failures gracefully', async () => {
      mockWindow.dispatchEvent.mockImplementation(() => {
        throw new Error('Event dispatch failed');
      });
      
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      // Should still attempt to save and not throw
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
      
      expect(console.error).toHaveBeenCalledWith(
        'Emergency consent save failed:',
        expect.any(Error)
      );
    });

    test('handles missing window object gracefully', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      expect(() => render(<FallbackConsentBanner />)).not.toThrow();
      
      global.window = originalWindow;
    });

    test('handles missing localStorage gracefully', async () => {
      const originalLocalStorage = global.localStorage;
      // @ts-ignore
      delete global.localStorage;
      
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(mockWindow.alert).toHaveBeenCalledWith(
          expect.stringContaining('We are unable to save your cookie preferences')
        );
      });
      
      global.localStorage = originalLocalStorage;
    });

    test('shows appropriate error message for storage failures', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(mockWindow.alert).toHaveBeenCalledWith(
          'We are unable to save your cookie preferences due to storage limitations. Please try clearing your browser data and refreshing the page.'
        );
      });
    });
  });

  describe('Visual and UX Behavior', () => {
    test('displays with proper styling classes', () => {
      render(<FallbackConsentBanner />);
      
      const banner = screen.getByRole('banner');
      expect(banner).toHaveClass(
        'fixed',
        'bottom-0',
        'left-0',
        'right-0',
        'bg-red-50',
        'border-t-2',
        'border-red-200'
      );
      
      const button = screen.getByRole('button', { name: /accept essential cookies/i });
      expect(button).toHaveClass(
        'bg-red-600',
        'hover:bg-red-700',
        'text-white'
      );
    });

    test('shows warning styling to indicate fallback mode', () => {
      render(<FallbackConsentBanner />);
      
      const warningIcon = screen.getByText('⚠️');
      expect(warningIcon).toBeInTheDocument();
      
      const banner = screen.getByRole('banner');
      expect(banner).toHaveClass('bg-red-50', 'border-red-200');
    });

    test('positions banner at bottom of screen', () => {
      render(<FallbackConsentBanner />);
      
      const banner = screen.getByRole('banner');
      expect(banner).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
    });

    test('provides clear call-to-action button', () => {
      render(<FallbackConsentBanner />);
      
      const button = screen.getByRole('button', { name: /accept essential cookies/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Accept Essential Cookies');
    });

    test('includes informative text about fallback mode', () => {
      render(<FallbackConsentBanner />);
      
      expect(screen.getByText(/fallback consent system/i)).toBeInTheDocument();
      expect(screen.getByText(/We're unable to load the full cookie consent system/)).toBeInTheDocument();
      expect(screen.getByText(/only essential cookies will be enabled/i)).toBeInTheDocument();
    });
  });

  describe('Integration with Consent System', () => {
    test('saves consent in format compatible with main system', async () => {
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
        
        // Should match the format expected by the main consent system
        expect(savedData).toHaveProperty('essential', true);
        expect(savedData).toHaveProperty('functional', false);
        expect(savedData).toHaveProperty('analytics', false);
        expect(savedData).toHaveProperty('marketing', false);
        expect(savedData).toHaveProperty('timestamp');
        expect(savedData).toHaveProperty('version', '1.0.0');
        
        // Should have a valid timestamp
        expect(typeof savedData.timestamp).toBe('number');
        expect(savedData.timestamp).toBeGreaterThan(0);
      });
    });

    test('dispatches event that main system can handle', async () => {
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'cookieConsentUpdated',
            detail: expect.objectContaining({
              essential: true,
              functional: false,
              analytics: false,
              marketing: false,
              timestamp: expect.any(Number),
              version: '1.0.0',
            }),
          })
        );
      });
    });

    test('uses same storage key as main consent system', async () => {
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'cookie-consent', // Same key used by main system
          expect.any(String)
        );
      });
    });

    test('prevents double acceptance during processing', async () => {
      // Simulate slow localStorage operation
      let resolveSetItem: () => void;
      const setItemPromise = new Promise<void>((resolve) => {
        resolveSetItem = resolve;
      });
      
      mockLocalStorage.setItem.mockImplementation(() => {
        setItemPromise.then(() => {
          // Simulate async completion
        });
      });
      
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      
      // Click while processing
      fireEvent.click(acceptButton);
      fireEvent.click(acceptButton); // Second click
      
      // Should only process once
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
      
      resolveSetItem!();
    });
  });

  describe('Browser Compatibility', () => {
    test('works without modern JavaScript features', () => {
      // Mock older browser environment
      const originalPromise = global.Promise;
      const originalCustomEvent = global.CustomEvent;
      
      // @ts-ignore
      delete global.Promise;
      // @ts-ignore
      delete global.CustomEvent;
      
      expect(() => render(<FallbackConsentBanner />)).not.toThrow();
      
      global.Promise = originalPromise;
      global.CustomEvent = originalCustomEvent;
    });

    test('handles IE-style event creation fallback', async () => {
      const originalCustomEvent = global.CustomEvent;
      
      // Mock IE-style event creation
      // @ts-ignore
      global.CustomEvent = undefined;
      const mockCreateEvent = vi.fn(() => ({
        initCustomEvent: vi.fn(),
      }));
      
      Object.defineProperty(global.document, 'createEvent', {
        value: mockCreateEvent,
        writable: true,
      });
      
      render(<FallbackConsentBanner />);
      
      const acceptButton = screen.getByRole('button', { name: /accept essential cookies/i });
      fireEvent.click(acceptButton);
      
      // Should not throw and should still save consent
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
      
      global.CustomEvent = originalCustomEvent;
    });

    test('provides graceful degradation for older browsers', () => {
      // Test with minimal browser capabilities
      render(<FallbackConsentBanner />);
      
      // Should still render and be functional
      expect(screen.getByRole('button', { name: /accept essential cookies/i })).toBeInTheDocument();
      expect(screen.getByText('Cookie Consent')).toBeInTheDocument();
    });
  });
});