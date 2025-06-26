import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest';
import {
  loadConsent,
  saveConsent,
  getDefaultConsent,
  hasConsent,
  revokeConsent,
  isConsentRequired,
  getConsentStatus,
  COOKIE_CATEGORIES,
  COOKIE_DETAILS,
} from '../cookies';
import type { CookieConsent, CookieCategory } from '~/types/cookies';
import { safeLocalStorage, isBrowser, initTimer } from '~/utils/ssr';

// Mock the SSR utilities
vi.mock('~/utils/ssr', () => ({
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  isBrowser: vi.fn(() => true),
  initTimer: {
    log: vi.fn(),
    mark: vi.fn(),
  },
}));

const mockSafeLocalStorage = vi.mocked(safeLocalStorage);
const mockIsBrowser = vi.mocked(isBrowser);
const mockInitTimer = vi.mocked(initTimer);

// Mock window and document
const mockWindow = {
  dispatchEvent: vi.fn(),
  location: { hostname: 'example.com' },
};

const mockDocument = {
  cookie: '',
};

beforeEach(() => {
  vi.clearAllMocks();
  
  // Setup default mocks
  mockIsBrowser.mockReturnValue(true);
  mockSafeLocalStorage.getItem.mockReturnValue(null);
  mockSafeLocalStorage.setItem.mockReturnValue(true);
  mockSafeLocalStorage.removeItem.mockReturnValue(true);
  
  // Mock global objects
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
  });
  
  Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true,
  });
  
  // Reset document.cookie
  mockDocument.cookie = '';
  
  // Mock Date.now for consistent timestamps
  vi.spyOn(Date, 'now').mockReturnValue(1000000000);
  
  // Suppress console logs during tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Cookie Consent Utilities', () => {
  describe('getDefaultConsent', () => {
    test('returns correct default consent object', () => {
      const defaultConsent = getDefaultConsent();
      
      expect(defaultConsent).toEqual({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        timestamp: 1000000000,
        version: '1.0.0',
      });
    });

    test('always includes essential cookies as true', () => {
      const defaultConsent = getDefaultConsent();
      
      expect(defaultConsent.essential).toBe(true);
    });

    test('returns new object on each call', () => {
      const consent1 = getDefaultConsent();
      const consent2 = getDefaultConsent();
      
      expect(consent1).not.toBe(consent2); // Different object references
      expect(consent1).toEqual(consent2); // Same content
    });
  });

  describe('loadConsent', () => {
    test('returns null when no consent is stored', () => {
      mockSafeLocalStorage.getItem.mockReturnValue(null);
      
      const result = loadConsent();
      
      expect(result).toBeNull();
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'No stored consent found'
      );
    });

    test('returns parsed consent when valid consent exists', () => {
      const storedConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now() - 1000, // Recent timestamp
        version: '1.0.0',
      };
      
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(storedConsent));
      
      const result = loadConsent();
      
      expect(result).toEqual(storedConsent);
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Valid consent loaded successfully',
        { consent: storedConsent }
      );
    });

    test('returns null when consent version is outdated', () => {
      const outdatedConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
        version: '0.9.0', // Old version
      };
      
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(outdatedConsent));
      
      const result = loadConsent();
      
      expect(result).toBeNull();
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Consent version mismatch',
        { stored: '0.9.0', current: '1.0.0' }
      );
    });

    test('returns null when consent is expired (older than 1 year)', () => {
      const expiredConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now() - (366 * 24 * 60 * 60 * 1000), // Older than 1 year
        version: '1.0.0',
      };
      
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredConsent));
      
      const result = loadConsent();
      
      expect(result).toBeNull();
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Consent expired',
        expect.objectContaining({
          timestamp: expiredConsent.timestamp,
        })
      );
    });

    test('returns null and logs error when JSON parsing fails', () => {
      mockSafeLocalStorage.getItem.mockReturnValue('invalid-json{');
      
      const result = loadConsent();
      
      expect(result).toBeNull();
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Failed to load cookie consent',
        { error: expect.any(Error) }
      );
    });

    test('handles localStorage access errors gracefully', () => {
      mockSafeLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      
      const result = loadConsent();
      
      expect(result).toBeNull();
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Failed to load cookie consent',
        { error: expect.any(Error) }
      );
    });

    test('logs proper initialization timing', () => {
      mockSafeLocalStorage.getItem.mockReturnValue(null);
      
      loadConsent();
      
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'loadConsent called - accessing localStorage'
      );
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'localStorage access result',
        { stored: null, hasValue: false }
      );
    });
  });

  describe('saveConsent', () => {
    test('saves consent with proper metadata', () => {
      const consent: CookieConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: 500000, // Will be overridden
        version: '0.5.0', // Will be overridden
      };
      
      saveConsent(consent);
      
      const expectedConsent = {
        ...consent,
        essential: true, // Always forced to true
        timestamp: 1000000000, // Current timestamp
        version: '1.0.0', // Current version
      };
      
      expect(mockSafeLocalStorage.setItem).toHaveBeenCalledWith(
        'cookie-consent',
        JSON.stringify(expectedConsent)
      );
      
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Saving consent to localStorage',
        { consentWithMeta: expectedConsent }
      );
    });

    test('always forces essential cookies to true', () => {
      const consent: CookieConsent = {
        essential: false, // This should be forced to true
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: 1000000,
        version: '1.0.0',
      };
      
      saveConsent(consent);
      
      const savedData = JSON.parse(
        (mockSafeLocalStorage.setItem as any).mock.calls[0][1]
      );
      
      expect(savedData.essential).toBe(true);
    });

    test('dispatches custom event after saving', () => {
      const consent = getDefaultConsent();
      
      saveConsent(consent);
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cookieConsentUpdated',
          detail: expect.objectContaining({
            essential: true,
            timestamp: 1000000000,
            version: '1.0.0',
          }),
        })
      );
      
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Dispatching cookieConsentUpdated event'
      );
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Event dispatched successfully'
      );
    });

    test('skips saving in server environment', () => {
      mockIsBrowser.mockReturnValue(false);
      
      saveConsent(getDefaultConsent());
      
      expect(mockSafeLocalStorage.setItem).not.toHaveBeenCalled();
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Not in browser, skipping save'
      );
    });

    test('handles localStorage save errors gracefully', () => {
      mockSafeLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const consent = getDefaultConsent();
      
      expect(() => saveConsent(consent)).not.toThrow();
      
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Failed to save cookie consent',
        { error: expect.any(Error) }
      );
    });

    test('handles event dispatch errors gracefully', () => {
      mockWindow.dispatchEvent.mockImplementation(() => {
        throw new Error('Event dispatch failed');
      });
      
      const consent = getDefaultConsent();
      
      expect(() => saveConsent(consent)).not.toThrow();
      
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Failed to save cookie consent',
        { error: expect.any(Error) }
      );
    });
  });

  describe('hasConsent', () => {
    test('returns true for essential cookies always', () => {
      mockSafeLocalStorage.getItem.mockReturnValue(null);
      
      const result = hasConsent('essential');
      
      expect(result).toBe(true);
    });

    test('returns false when no consent is stored', () => {
      mockSafeLocalStorage.getItem.mockReturnValue(null);
      
      expect(hasConsent('functional')).toBe(false);
      expect(hasConsent('analytics')).toBe(false);
      expect(hasConsent('marketing')).toBe(false);
    });

    test('returns correct consent status for each category', () => {
      const consent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: true,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(consent));
      
      expect(hasConsent('essential')).toBe(true);
      expect(hasConsent('functional')).toBe(true);
      expect(hasConsent('analytics')).toBe(false);
      expect(hasConsent('marketing')).toBe(true);
    });

    test('handles invalid category gracefully', () => {
      const consent = getDefaultConsent();
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(consent));
      
      const result = hasConsent('invalid' as CookieCategory);
      
      expect(result).toBe(false);
    });
  });

  describe('revokeConsent', () => {
    test('removes consent from localStorage', () => {
      revokeConsent();
      
      expect(mockSafeLocalStorage.removeItem).toHaveBeenCalledWith('cookie-consent');
    });

    test('dispatches revocation event', () => {
      revokeConsent();
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cookieConsentRevoked',
        })
      );
    });

    test('clears non-essential cookies from document', () => {
      mockDocument.cookie = 'csrf-token=abc123; analytics-id=xyz789; marketing-tracker=def456';
      
      // Mock document.cookie setter to track cookie deletion attempts
      const cookieSetterSpy = vi.fn();
      Object.defineProperty(mockDocument, 'cookie', {
        get: () => 'csrf-token=abc123; analytics-id=xyz789; marketing-tracker=def456',
        set: cookieSetterSpy,
      });
      
      revokeConsent();
      
      // Should attempt to delete non-essential cookies
      expect(cookieSetterSpy).toHaveBeenCalledWith(
        expect.stringContaining('analytics-id=;expires=Thu, 01 Jan 1970 00:00:00 GMT')
      );
      expect(cookieSetterSpy).toHaveBeenCalledWith(
        expect.stringContaining('marketing-tracker=;expires=Thu, 01 Jan 1970 00:00:00 GMT')
      );
      
      // Should not delete essential cookies
      expect(cookieSetterSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('csrf-token=;expires=')
      );
    });

    test('skips cookie clearing in server environment', () => {
      mockIsBrowser.mockReturnValue(false);
      
      expect(() => revokeConsent()).not.toThrow();
      
      expect(mockSafeLocalStorage.removeItem).not.toHaveBeenCalled();
    });

    test('handles errors gracefully', () => {
      mockSafeLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => revokeConsent()).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to revoke cookie consent:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    test('clears cookies with domain variations', () => {
      mockDocument.cookie = 'user-pref=dark; session-id=abc123';
      
      const cookieSetterSpy = vi.fn();
      Object.defineProperty(mockDocument, 'cookie', {
        get: () => 'user-pref=dark; session-id=abc123',
        set: cookieSetterSpy,
      });
      
      revokeConsent();
      
      // Should try both path=/ and domain-specific deletion
      expect(cookieSetterSpy).toHaveBeenCalledWith(
        expect.stringContaining('user-pref=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/')
      );
      expect(cookieSetterSpy).toHaveBeenCalledWith(
        expect.stringContaining('user-pref=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=example.com')
      );
    });
  });

  describe('isConsentRequired', () => {
    test('returns true when no consent is stored', () => {
      mockSafeLocalStorage.getItem.mockReturnValue(null);
      
      const result = isConsentRequired();
      
      expect(result).toBe(true);
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Consent requirement check result',
        { required: true, hasConsent: false }
      );
    });

    test('returns false when valid consent exists', () => {
      const validConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(validConsent));
      
      const result = isConsentRequired();
      
      expect(result).toBe(false);
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Consent requirement check result',
        { required: false, hasConsent: true }
      );
    });

    test('returns true when stored consent is invalid/expired', () => {
      const expiredConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now() - (366 * 24 * 60 * 60 * 1000), // Expired
        version: '1.0.0',
      };
      
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredConsent));
      
      const result = isConsentRequired();
      
      expect(result).toBe(true);
    });

    test('logs timing information correctly', () => {
      isConsentRequired();
      
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'isConsentRequired called'
      );
    });
  });

  describe('getConsentStatus', () => {
    test('returns stored consent when available', () => {
      const storedConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: true,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(storedConsent));
      
      const result = getConsentStatus();
      
      expect(result).toEqual(storedConsent);
    });

    test('returns default consent when no consent is stored', () => {
      mockSafeLocalStorage.getItem.mockReturnValue(null);
      
      const result = getConsentStatus();
      
      expect(result).toEqual(getDefaultConsent());
    });

    test('returns default consent when stored consent is invalid', () => {
      mockSafeLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const result = getConsentStatus();
      
      expect(result).toEqual(getDefaultConsent());
    });
  });

  describe('Cookie Categories and Details', () => {
    test('COOKIE_CATEGORIES contains all required categories', () => {
      expect(COOKIE_CATEGORIES).toHaveProperty('essential');
      expect(COOKIE_CATEGORIES).toHaveProperty('functional');
      expect(COOKIE_CATEGORIES).toHaveProperty('analytics');
      expect(COOKIE_CATEGORIES).toHaveProperty('marketing');
      
      Object.values(COOKIE_CATEGORIES).forEach(category => {
        expect(category).toHaveProperty('title');
        expect(category).toHaveProperty('description');
        expect(typeof category.title).toBe('string');
        expect(typeof category.description).toBe('string');
        expect(category.title.length).toBeGreaterThan(0);
        expect(category.description.length).toBeGreaterThan(0);
      });
    });

    test('COOKIE_DETAILS contains valid cookie information', () => {
      expect(Array.isArray(COOKIE_DETAILS)).toBe(true);
      expect(COOKIE_DETAILS.length).toBeGreaterThan(0);
      
      COOKIE_DETAILS.forEach(cookie => {
        expect(cookie).toHaveProperty('name');
        expect(cookie).toHaveProperty('category');
        expect(cookie).toHaveProperty('description');
        expect(cookie).toHaveProperty('duration');
        expect(cookie).toHaveProperty('purpose');
        
        expect(typeof cookie.name).toBe('string');
        expect(['essential', 'functional', 'analytics', 'marketing']).toContain(cookie.category);
        expect(typeof cookie.description).toBe('string');
        expect(typeof cookie.duration).toBe('string');
        expect(typeof cookie.purpose).toBe('string');
      });
    });

    test('Essential cookies are properly categorized', () => {
      const essentialCookies = COOKIE_DETAILS.filter(
        cookie => cookie.category === 'essential'
      );
      
      expect(essentialCookies.length).toBeGreaterThan(0);
      
      const essentialCookieNames = essentialCookies.map(cookie => cookie.name);
      expect(essentialCookieNames).toContain('csrf-token');
      expect(essentialCookieNames).toContain('cookie-consent');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles malformed JSON in localStorage gracefully', () => {
      const malformedJson = '{"essential":true,"functional":true'; // Missing closing brace
      mockSafeLocalStorage.getItem.mockReturnValue(malformedJson);
      
      expect(() => loadConsent()).not.toThrow();
      expect(loadConsent()).toBeNull();
    });

    test('handles consent object with missing properties', () => {
      const incompleteConsent = {
        essential: true,
        // Missing other properties
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(incompleteConsent));
      
      const result = hasConsent('functional');
      expect(result).toBe(false); // Should handle gracefully
    });

    test('handles very old timestamps correctly', () => {
      const veryOldConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: 0, // Unix epoch
        version: '1.0.0',
      };
      
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(veryOldConsent));
      
      const result = loadConsent();
      expect(result).toBeNull(); // Should be considered expired
    });

    test('handles future timestamps correctly', () => {
      const futureConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year in future
        version: '1.0.0',
      };
      
      mockSafeLocalStorage.getItem.mockReturnValue(JSON.stringify(futureConsent));
      
      const result = loadConsent();
      expect(result).toEqual(futureConsent); // Should be valid
    });

    test('handles null window object gracefully', () => {
      // @ts-ignore
      delete global.window;
      
      expect(() => saveConsent(getDefaultConsent())).not.toThrow();
      expect(() => revokeConsent()).not.toThrow();
    });

    test('handles document.cookie access errors', () => {
      Object.defineProperty(mockDocument, 'cookie', {
        get: () => {
          throw new Error('Cookie access denied');
        },
        set: () => {
          throw new Error('Cookie write denied');
        },
      });
      
      expect(() => revokeConsent()).not.toThrow();
    });

    test('handles localStorage setItem quota exceeded error', () => {
      mockSafeLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      expect(() => saveConsent(getDefaultConsent())).not.toThrow();
      expect(mockInitTimer.log).toHaveBeenCalledWith(
        'cookies',
        'Failed to save cookie consent',
        { error: expect.any(Error) }
      );
    });
  });

  describe('Browser Compatibility', () => {
    test('works without CustomEvent constructor', () => {
      const originalCustomEvent = global.CustomEvent;
      // @ts-ignore
      delete global.CustomEvent;
      
      Object.defineProperty(mockWindow, 'CustomEvent', {
        value: undefined,
        writable: true,
      });
      
      // Should not throw even without CustomEvent
      expect(() => saveConsent(getDefaultConsent())).not.toThrow();
      
      global.CustomEvent = originalCustomEvent;
    });

    test('works without modern browser APIs', () => {
      const originalWindow = global.window;
      
      // Mock minimal window object
      Object.defineProperty(global, 'window', {
        value: {
          location: { hostname: 'test.com' },
          // Missing dispatchEvent and other modern APIs
        },
        writable: true,
      });
      
      expect(() => saveConsent(getDefaultConsent())).not.toThrow();
      expect(() => revokeConsent()).not.toThrow();
      
      global.window = originalWindow;
    });
  });
});