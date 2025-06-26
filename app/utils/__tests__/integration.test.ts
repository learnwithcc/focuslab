import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest';
import {
  loadConsent,
  saveConsent,
  getDefaultConsent,
  hasConsent,
  revokeConsent,
  isConsentRequired,
} from '../cookies';
import {
  useIsMounted,
  safeLocalStorage,
  isBrowser,
} from '../ssr';

// Mock environment for integration testing
const createMockEnvironment = () => {
  const mockLocalStorage = {
    data: new Map<string, string>(),
    getItem: vi.fn((key: string) => mockLocalStorage.data.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      mockLocalStorage.data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      mockLocalStorage.data.delete(key);
    }),
    clear: vi.fn(() => {
      mockLocalStorage.data.clear();
    }),
  };

  const mockWindow = {
    localStorage: mockLocalStorage,
    dispatchEvent: vi.fn(),
    location: { hostname: 'example.com' },
  };

  const mockDocument = {
    cookie: '',
  };

  return { mockLocalStorage, mockWindow, mockDocument };
};

// Mock the SSR utilities
vi.mock('../ssr', () => ({
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
  useIsMounted: vi.fn(() => true),
}));

const mockSafeLocalStorage = vi.mocked(safeLocalStorage);
const mockIsBrowser = vi.mocked(isBrowser);

beforeEach(() => {
  vi.clearAllMocks();
  mockIsBrowser.mockReturnValue(true);
  
  // Reset localStorage behavior
  const storage = new Map<string, string>();
  mockSafeLocalStorage.getItem.mockImplementation((key) => storage.get(key) || null);
  mockSafeLocalStorage.setItem.mockImplementation((key, value) => {
    storage.set(key, value);
    return true;
  });
  mockSafeLocalStorage.removeItem.mockImplementation((key) => {
    storage.delete(key);
    return true;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Consent System Integration Tests', () => {
  describe('Full Consent Lifecycle', () => {
    test('complete consent flow from default to acceptance', () => {
      // 1. Start with no consent
      expect(isConsentRequired()).toBe(true);
      expect(loadConsent()).toBeNull();

      // 2. Save full consent
      const fullConsent = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      saveConsent(fullConsent);

      // 3. Verify consent is saved and loaded correctly
      const savedConsent = loadConsent();
      expect(savedConsent).toEqual(expect.objectContaining({
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        version: '1.0.0',
      }));

      // 4. Verify consent checks work
      expect(hasConsent('essential')).toBe(true);
      expect(hasConsent('functional')).toBe(true);
      expect(hasConsent('analytics')).toBe(true);
      expect(hasConsent('marketing')).toBe(true);

      // 5. Verify consent is no longer required
      expect(isConsentRequired()).toBe(false);
    });

    test('partial consent acceptance flow', () => {
      // Accept only essential and functional cookies
      const partialConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      saveConsent(partialConsent);

      // Verify partial consent
      expect(hasConsent('essential')).toBe(true);
      expect(hasConsent('functional')).toBe(true);
      expect(hasConsent('analytics')).toBe(false);
      expect(hasConsent('marketing')).toBe(false);
      expect(isConsentRequired()).toBe(false);
    });

    test('consent rejection flow', () => {
      // Save minimal consent (only essential)
      const minimalConsent = getDefaultConsent();
      saveConsent(minimalConsent);

      // Verify only essential cookies are allowed
      expect(hasConsent('essential')).toBe(true);
      expect(hasConsent('functional')).toBe(false);
      expect(hasConsent('analytics')).toBe(false);
      expect(hasConsent('marketing')).toBe(false);
      expect(isConsentRequired()).toBe(false);
    });

    test('consent revocation flow', () => {
      // First, establish consent
      const fullConsent = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      saveConsent(fullConsent);
      expect(isConsentRequired()).toBe(false);

      // Then revoke it
      revokeConsent();

      // Verify consent is cleared
      expect(loadConsent()).toBeNull();
      expect(isConsentRequired()).toBe(true);
      expect(hasConsent('functional')).toBe(false);
      expect(hasConsent('analytics')).toBe(false);
      expect(hasConsent('marketing')).toBe(false);
      // Essential cookies should still return true
      expect(hasConsent('essential')).toBe(true);
    });
  });

  describe('Consent Validation and Expiration', () => {
    test('handles expired consent correctly', () => {
      // Save consent with old timestamp (older than 1 year)
      const expiredConsent = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        timestamp: Date.now() - (366 * 24 * 60 * 60 * 1000), // 366 days ago
        version: '1.0.0',
      };

      // Manually save expired consent
      mockSafeLocalStorage.setItem('cookie-consent', JSON.stringify(expiredConsent));

      // Should be treated as no consent
      expect(loadConsent()).toBeNull();
      expect(isConsentRequired()).toBe(true);
      expect(hasConsent('analytics')).toBe(false);
    });

    test('handles version mismatch correctly', () => {
      // Save consent with old version
      const oldVersionConsent = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        timestamp: Date.now(),
        version: '0.9.0', // Old version
      };

      mockSafeLocalStorage.setItem('cookie-consent', JSON.stringify(oldVersionConsent));

      // Should be treated as no consent
      expect(loadConsent()).toBeNull();
      expect(isConsentRequired()).toBe(true);
    });

    test('handles malformed consent data', () => {
      // Save malformed JSON
      mockSafeLocalStorage.setItem('cookie-consent', '{"invalid":json}');

      // Should be treated as no consent
      expect(loadConsent()).toBeNull();
      expect(isConsentRequired()).toBe(true);
    });
  });

  describe('SSR Environment Handling', () => {
    test('handles server environment gracefully', () => {
      mockIsBrowser.mockReturnValue(false);

      // Should return safe defaults
      expect(loadConsent()).toBeNull();
      expect(isConsentRequired()).toBe(true);

      // Save operations should not throw
      expect(() => {
        saveConsent(getDefaultConsent());
      }).not.toThrow();

      // Revoke operations should not throw
      expect(() => {
        revokeConsent();
      }).not.toThrow();
    });
  });

  describe('Storage Error Handling', () => {
    test('handles localStorage read errors', () => {
      mockSafeLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      // Should handle errors gracefully
      expect(loadConsent()).toBeNull();
      expect(isConsentRequired()).toBe(true);
      expect(hasConsent('analytics')).toBe(false);
    });

    test('handles localStorage write errors', () => {
      mockSafeLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw on save errors
      expect(() => {
        saveConsent(getDefaultConsent());
      }).not.toThrow();
    });

    test('handles localStorage remove errors', () => {
      mockSafeLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      // Should not throw on remove errors
      expect(() => {
        revokeConsent();
      }).not.toThrow();
    });
  });

  describe('Consent Update Flow', () => {
    test('allows updating existing consent', () => {
      // Start with minimal consent
      const initialConsent = getDefaultConsent();
      saveConsent(initialConsent);

      expect(hasConsent('analytics')).toBe(false);

      // Update to include analytics
      const updatedConsent = {
        ...initialConsent,
        analytics: true,
        timestamp: Date.now(),
      };

      saveConsent(updatedConsent);

      // Verify update
      expect(hasConsent('analytics')).toBe(true);
      expect(hasConsent('essential')).toBe(true);
      expect(hasConsent('marketing')).toBe(false);
    });

    test('always forces essential cookies to true', () => {
      // Try to save consent with essential: false
      const invalidConsent = {
        essential: false, // This should be forced to true
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      saveConsent(invalidConsent);

      // Essential should still be true
      expect(hasConsent('essential')).toBe(true);
      
      // Verify the saved data has essential: true
      const saved = loadConsent();
      expect(saved?.essential).toBe(true);
    });
  });

  describe('Default Consent Behavior', () => {
    test('getDefaultConsent returns correct structure', () => {
      const defaultConsent = getDefaultConsent();

      expect(defaultConsent).toEqual({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        timestamp: expect.any(Number),
        version: '1.0.0',
      });

      expect(typeof defaultConsent.timestamp).toBe('number');
      expect(defaultConsent.timestamp).toBeGreaterThan(0);
    });

    test('default consent satisfies basic requirements', () => {
      const defaultConsent = getDefaultConsent();

      // Essential should always be true
      expect(defaultConsent.essential).toBe(true);
      
      // Non-essential should be false
      expect(defaultConsent.functional).toBe(false);
      expect(defaultConsent.analytics).toBe(false);
      expect(defaultConsent.marketing).toBe(false);

      // Should have current version
      expect(defaultConsent.version).toBe('1.0.0');

      // Should have valid timestamp
      expect(defaultConsent.timestamp).toBeCloseTo(Date.now(), -3); // Within ~1000ms
    });
  });

  describe('Category-Specific Consent Checks', () => {
    test('hasConsent works for all categories', () => {
      const mixedConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: true,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      saveConsent(mixedConsent);

      // Test each category
      expect(hasConsent('essential')).toBe(true);
      expect(hasConsent('functional')).toBe(true);
      expect(hasConsent('analytics')).toBe(false);
      expect(hasConsent('marketing')).toBe(true);
    });

    test('essential cookies always return true regardless of stored value', () => {
      // Even with no saved consent, essential should be true
      expect(hasConsent('essential')).toBe(true);

      // Save consent without essential (shouldn't be possible, but test anyway)
      mockSafeLocalStorage.setItem('cookie-consent', JSON.stringify({
        essential: false,
        functional: false,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      }));

      // Essential should still return true
      expect(hasConsent('essential')).toBe(true);
    });

    test('handles invalid category gracefully', () => {
      const mixedConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: true,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      saveConsent(mixedConsent);

      // Invalid category should return false
      expect(hasConsent('invalid' as any)).toBe(false);
    });
  });

  describe('Timestamp and Version Management', () => {
    test('saveConsent updates timestamp automatically', () => {
      const consent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: 1000000, // Old timestamp
        version: '0.5.0', // Old version
      };

      const beforeSave = Date.now();
      saveConsent(consent);
      const afterSave = Date.now();

      const saved = loadConsent();
      
      // Timestamp should be updated
      expect(saved?.timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(saved?.timestamp).toBeLessThanOrEqual(afterSave);
      
      // Version should be updated
      expect(saved?.version).toBe('1.0.0');
    });

    test('validates consent within acceptable time range', () => {
      const recentConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
        version: '1.0.0',
      };

      mockSafeLocalStorage.setItem('cookie-consent', JSON.stringify(recentConsent));

      // Should be valid
      expect(loadConsent()).not.toBeNull();
      expect(isConsentRequired()).toBe(false);
    });
  });
});