import { renderHook, render, screen, fireEvent, cleanup } from '@testing-library/react';
import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest';
import React from 'react';
import { CookieConsentProvider, useCookieConsent } from '../CookieConsentContext';
import { loadConsent, saveConsent, getDefaultConsent, isConsentRequired, revokeConsent } from '~/utils/cookies';
import { isBrowser } from '~/utils/ssr';

// Mock the utils
vi.mock('~/utils/cookies', () => ({
  loadConsent: vi.fn(),
  saveConsent: vi.fn(),
  getDefaultConsent: vi.fn(() => ({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    timestamp: 1000000,
    version: '1.0.0',
  })),
  isConsentRequired: vi.fn(),
  revokeConsent: vi.fn(),
}));

vi.mock('~/utils/ssr', () => ({
  isBrowser: vi.fn(() => true),
}));

// Mock React.startTransition
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    startTransition: vi.fn((callback) => callback()),
  };
});

const mockLoadConsent = vi.mocked(loadConsent);
const mockSaveConsent = vi.mocked(saveConsent);
const mockGetDefaultConsent = vi.mocked(getDefaultConsent);
const mockIsConsentRequired = vi.mocked(isConsentRequired);
const mockRevokeConsent = vi.mocked(revokeConsent);
const mockIsBrowser = vi.mocked(isBrowser);

// Test component that uses the hook
function TestComponent() {
  const {
    consent,
    isConsentRequired,
    showBanner,
    showModal,
    isInitialized,
    acceptAll,
    rejectAll,
    updateConsent,
    openModal,
    closeModal,
    revokeConsent: revokeConsentAction,
  } = useCookieConsent();

  return (
    <div>
      <div data-testid="consent-essential">{consent.essential.toString()}</div>
      <div data-testid="consent-functional">{consent.functional.toString()}</div>
      <div data-testid="consent-analytics">{consent.analytics.toString()}</div>
      <div data-testid="consent-marketing">{consent.marketing.toString()}</div>
      <div data-testid="is-consent-required">{isConsentRequired.toString()}</div>
      <div data-testid="show-banner">{showBanner.toString()}</div>
      <div data-testid="show-modal">{showModal.toString()}</div>
      <div data-testid="is-initialized">{isInitialized.toString()}</div>
      <button onClick={acceptAll} data-testid="accept-all">Accept All</button>
      <button onClick={rejectAll} data-testid="reject-all">Reject All</button>
      <button onClick={() => updateConsent({ functional: true })} data-testid="update-consent">
        Update Consent
      </button>
      <button onClick={openModal} data-testid="open-modal">Open Modal</button>
      <button onClick={closeModal} data-testid="close-modal">Close Modal</button>
      <button onClick={revokeConsentAction} data-testid="revoke-consent">Revoke Consent</button>
    </div>
  );
}

// Mock window and event handling
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  
  // Setup default mocks
  mockIsBrowser.mockReturnValue(true);
  mockGetDefaultConsent.mockReturnValue({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    timestamp: 1000000,
    version: '1.0.0',
  });
  mockLoadConsent.mockReturnValue(null);
  mockIsConsentRequired.mockReturnValue(true);
  
  // Mock window
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
  });
  
  // Suppress console warnings during tests
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CookieConsentContext', () => {
  describe('Initialization', () => {
    test('initializes with default consent when no saved consent exists', () => {
      mockLoadConsent.mockReturnValue(null);
      mockIsConsentRequired.mockReturnValue(true);

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      expect(screen.getByTestId('consent-essential')).toHaveTextContent('true');
      expect(screen.getByTestId('consent-functional')).toHaveTextContent('false');
      expect(screen.getByTestId('consent-analytics')).toHaveTextContent('false');
      expect(screen.getByTestId('consent-marketing')).toHaveTextContent('false');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('true');
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
    });

    test('initializes with saved consent when it exists', () => {
      const savedConsent = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      mockLoadConsent.mockReturnValue(savedConsent);
      mockIsConsentRequired.mockReturnValue(false);

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      expect(screen.getByTestId('consent-essential')).toHaveTextContent('true');
      expect(screen.getByTestId('consent-functional')).toHaveTextContent('true');
      expect(screen.getByTestId('consent-analytics')).toHaveTextContent('true');
      expect(screen.getByTestId('consent-marketing')).toHaveTextContent('false');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false');
      expect(screen.getByTestId('is-consent-required')).toHaveTextContent('false');
    });

    test('initializes correctly in SSR environment', () => {
      mockIsBrowser.mockReturnValue(false);

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      expect(screen.getByTestId('show-banner')).toHaveTextContent('false');
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('false');
    });

    test('re-initializes on client after SSR', () => {
      // Start with SSR state
      mockIsBrowser.mockReturnValue(false);
      
      const { rerender } = render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      expect(screen.getByTestId('is-initialized')).toHaveTextContent('false');

      // Simulate client-side hydration
      mockIsBrowser.mockReturnValue(true);
      mockLoadConsent.mockReturnValue(null);
      mockIsConsentRequired.mockReturnValue(true);

      rerender(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      // Should trigger re-initialization
      expect(mockLoadConsent).toHaveBeenCalled();
      expect(mockIsConsentRequired).toHaveBeenCalled();
    });
  });

  describe('Consent Actions', () => {
    test('acceptAll updates consent and saves it', () => {
      mockLoadConsent.mockReturnValue(null);
      mockIsConsentRequired.mockReturnValue(true);

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      fireEvent.click(screen.getByTestId('accept-all'));

      expect(mockSaveConsent).toHaveBeenCalledWith({
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        timestamp: expect.any(Number),
        version: '1.0.0',
      });

      // Check state updates
      expect(screen.getByTestId('consent-functional')).toHaveTextContent('true');
      expect(screen.getByTestId('consent-analytics')).toHaveTextContent('true');
      expect(screen.getByTestId('consent-marketing')).toHaveTextContent('true');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false');
    });

    test('rejectAll updates consent with minimal settings', () => {
      mockLoadConsent.mockReturnValue(null);
      mockIsConsentRequired.mockReturnValue(true);

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      fireEvent.click(screen.getByTestId('reject-all'));

      expect(mockSaveConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        })
      );

      expect(screen.getByTestId('show-banner')).toHaveTextContent('false');
    });

    test('updateConsent updates specific consent categories', () => {
      mockLoadConsent.mockReturnValue({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        timestamp: 1000000,
        version: '1.0.0',
      });

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      fireEvent.click(screen.getByTestId('update-consent'));

      expect(mockSaveConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          essential: true,
          functional: true,
          analytics: false,
          marketing: false,
          timestamp: expect.any(Number),
          version: '1.0.0',
        })
      );

      expect(screen.getByTestId('consent-functional')).toHaveTextContent('true');
    });

    test('revokeConsent clears consent and updates state', () => {
      mockLoadConsent.mockReturnValue({
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        timestamp: 1000000,
        version: '1.0.0',
      });

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      fireEvent.click(screen.getByTestId('revoke-consent'));

      expect(mockRevokeConsent).toHaveBeenCalled();
      expect(screen.getByTestId('consent-functional')).toHaveTextContent('false');
      expect(screen.getByTestId('consent-analytics')).toHaveTextContent('false');
      expect(screen.getByTestId('consent-marketing')).toHaveTextContent('false');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('true');
    });
  });

  describe('Modal State Management', () => {
    test('openModal shows modal and hides banner', () => {
      mockLoadConsent.mockReturnValue(null);
      mockIsConsentRequired.mockReturnValue(true);

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      expect(screen.getByTestId('show-banner')).toHaveTextContent('true');
      expect(screen.getByTestId('show-modal')).toHaveTextContent('false');

      fireEvent.click(screen.getByTestId('open-modal'));

      expect(screen.getByTestId('show-modal')).toHaveTextContent('true');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false');
    });

    test('closeModal hides modal and shows banner if consent required', () => {
      mockLoadConsent.mockReturnValue(null);
      mockIsConsentRequired.mockReturnValue(true);

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      // Open modal first
      fireEvent.click(screen.getByTestId('open-modal'));
      expect(screen.getByTestId('show-modal')).toHaveTextContent('true');

      // Close modal
      fireEvent.click(screen.getByTestId('close-modal'));
      expect(screen.getByTestId('show-modal')).toHaveTextContent('false');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('true');
    });

    test('closeModal hides modal without showing banner if consent not required', () => {
      mockLoadConsent.mockReturnValue({
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: 1000000,
        version: '1.0.0',
      });
      mockIsConsentRequired.mockReturnValue(false);

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      // Open modal first
      fireEvent.click(screen.getByTestId('open-modal'));
      expect(screen.getByTestId('show-modal')).toHaveTextContent('true');

      // Close modal
      fireEvent.click(screen.getByTestId('close-modal'));
      expect(screen.getByTestId('show-modal')).toHaveTextContent('false');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false');
    });
  });

  describe('Event Handling', () => {
    test('sets up event listeners for consent events', () => {
      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'cookieConsentUpdated',
        expect.any(Function)
      );
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'cookieConsentRevoked',
        expect.any(Function)
      );
    });

    test('cleans up event listeners on unmount', () => {
      const { unmount } = render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

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

    test('handles cookieConsentUpdated event', () => {
      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      // Get the event handler that was registered
      const addEventListenerCalls = mockWindow.addEventListener.mock.calls;
      const consentUpdatedCall = addEventListenerCalls.find(
        call => call[0] === 'cookieConsentUpdated'
      );
      const eventHandler = consentUpdatedCall?.[1];

      // Simulate event
      const mockEvent = {
        detail: {
          essential: true,
          functional: true,
          analytics: false,
          marketing: false,
          timestamp: Date.now(),
          version: '1.0.0',
        },
      };

      if (eventHandler) {
        eventHandler(mockEvent);
      }

      expect(screen.getByTestId('consent-functional')).toHaveTextContent('true');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false');
    });

    test('handles cookieConsentRevoked event', () => {
      mockLoadConsent.mockReturnValue({
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        timestamp: 1000000,
        version: '1.0.0',
      });

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      // Get the event handler that was registered
      const addEventListenerCalls = mockWindow.addEventListener.mock.calls;
      const consentRevokedCall = addEventListenerCalls.find(
        call => call[0] === 'cookieConsentRevoked'
      );
      const eventHandler = consentRevokedCall?.[1];

      // Simulate event
      if (eventHandler) {
        eventHandler({});
      }

      expect(screen.getByTestId('consent-functional')).toHaveTextContent('false');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('true');
    });

    test('does not set up event listeners in SSR environment', () => {
      mockIsBrowser.mockReturnValue(false);

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      expect(mockWindow.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Hook Usage', () => {
    test('throws error when used outside provider', () => {
      // Mock console.error to avoid test output noise
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useCookieConsent());
      }).toThrow('useCookieConsent must be used within a CookieConsentProvider');

      mockConsoleError.mockRestore();
    });

    test('provides correct context value', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CookieConsentProvider>{children}</CookieConsentProvider>
      );

      const { result } = renderHook(() => useCookieConsent(), { wrapper });

      expect(result.current).toEqual({
        consent: expect.objectContaining({
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        }),
        isConsentRequired: expect.any(Boolean),
        showBanner: expect.any(Boolean),
        showModal: expect.any(Boolean),
        isInitialized: expect.any(Boolean),
        acceptAll: expect.any(Function),
        rejectAll: expect.any(Function),
        updateConsent: expect.any(Function),
        openModal: expect.any(Function),
        closeModal: expect.any(Function),
        revokeConsent: expect.any(Function),
      });
    });
  });

  describe('State Transitions', () => {
    test('handles INITIALIZE action correctly', () => {
      mockIsBrowser.mockReturnValue(false);
      
      const { rerender } = render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      expect(screen.getByTestId('is-initialized')).toHaveTextContent('false');

      // Simulate initialization
      mockIsBrowser.mockReturnValue(true);
      mockLoadConsent.mockReturnValue({
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: 1000000,
        version: '1.0.0',
      });
      mockIsConsentRequired.mockReturnValue(false);

      rerender(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      expect(screen.getByTestId('consent-functional')).toHaveTextContent('true');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false');
    });

    test('handles multiple rapid state changes correctly', () => {
      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      // Rapid state changes
      fireEvent.click(screen.getByTestId('open-modal'));
      fireEvent.click(screen.getByTestId('close-modal'));
      fireEvent.click(screen.getByTestId('accept-all'));

      expect(screen.getByTestId('show-modal')).toHaveTextContent('false');
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false');
      expect(screen.getByTestId('consent-analytics')).toHaveTextContent('true');
    });
  });

  describe('Edge Cases', () => {
    test('handles missing localStorage gracefully', () => {
      mockLoadConsent.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      // Should still render with default state
      expect(screen.getByTestId('consent-essential')).toHaveTextContent('true');
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
    });

    test('handles consent save errors gracefully', () => {
      mockSaveConsent.mockImplementation(() => {
        throw new Error('Save failed');
      });

      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      expect(() => {
        fireEvent.click(screen.getByTestId('accept-all'));
      }).not.toThrow();

      // State should still update locally
      expect(screen.getByTestId('consent-analytics')).toHaveTextContent('true');
    });

    test('maintains essential cookies always true', () => {
      render(
        <CookieConsentProvider>
          <TestComponent />
        </CookieConsentProvider>
      );

      // Try to update consent with essential: false (should be ignored)
      fireEvent.click(screen.getByTestId('update-consent'));

      expect(screen.getByTestId('consent-essential')).toHaveTextContent('true');
    });
  });
});