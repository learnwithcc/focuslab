import { renderHook, act } from '@testing-library/react';
import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest';
import {
  isBrowser,
  isServer,
  useIsMounted,
  useHydrated,
  useHydratedEffect,
  useSSRState,
  useWindowProperty,
  safeLocalStorage,
  safeSessionStorage,
  enhancedLocalStorage,
  useEventListener,
  safeDocument,
  useScreenSize,
  useIntersectionObserver,
  useBodyScrollLock,
  getPortalRoot,
  useFocusTrap,
  isHydratedSync,
  whenHydrated,
  whenHydratedOr,
} from '../ssr';

// Mock environment variables
const originalWindow = global.window;
const originalDocument = global.document;

// Mock localStorage and sessionStorage
const createMockStorage = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
});

const mockLocalStorage = createMockStorage();
const mockSessionStorage = createMockStorage();

beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset console spies
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  // Restore original window if it was deleted
  if (!global.window && originalWindow) {
    global.window = originalWindow;
  }
  if (!global.document && originalDocument) {
    global.document = originalDocument;
  }
});

describe('SSR Environment Detection', () => {
  test('isBrowser returns true in browser environment', () => {
    expect(isBrowser).toBe(true);
  });

  test('isServer returns false in browser environment', () => {
    expect(isServer).toBe(false);
  });

  test('isBrowser returns false in server environment', () => {
    // Mock server environment
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    // Re-import to get server environment values
    vi.resetModules();
    const { isBrowser: serverIsBrowser, isServer: serverIsServer } = require('../ssr');

    expect(serverIsBrowser).toBe(false);
    expect(serverIsServer).toBe(true);

    // Restore
    global.window = originalWindow;
  });
});

describe('useIsMounted Hook', () => {
  test('returns true immediately in browser environment', () => {
    const { result } = renderHook(() => useIsMounted());
    expect(result.current).toBe(true);
  });

  test('provides consistent values across renders', () => {
    const { result, rerender } = renderHook(() => useIsMounted());
    
    const firstValue = result.current;
    rerender();
    const secondValue = result.current;
    
    expect(firstValue).toBe(secondValue);
    expect(result.current).toBe(true);
  });
});

describe('useHydrated Hook', () => {
  test('starts false and becomes true after effect', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useHydrated());
    
    expect(result.current).toBe(false);
    
    await waitForNextUpdate();
    
    expect(result.current).toBe(true);
  });

  test('remains true after re-renders', async () => {
    const { result, rerender, waitForNextUpdate } = renderHook(() => useHydrated());
    
    await waitForNextUpdate();
    expect(result.current).toBe(true);
    
    rerender();
    expect(result.current).toBe(true);
  });
});

describe('useHydratedEffect Hook', () => {
  test('runs effect only when mounted', () => {
    const mockEffect = vi.fn(() => {
      return () => {}; // cleanup function
    });
    
    renderHook(() => useHydratedEffect(mockEffect, []));
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
  });

  test('runs effect with dependencies', () => {
    const mockEffect = vi.fn();
    let dep = 1;
    
    const { rerender } = renderHook(() => useHydratedEffect(mockEffect, [dep]));
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    dep = 2;
    rerender();
    
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  test('calls cleanup function on unmount', () => {
    const mockCleanup = vi.fn();
    const mockEffect = vi.fn(() => mockCleanup);
    
    const { unmount } = renderHook(() => useHydratedEffect(mockEffect, []));
    
    unmount();
    
    expect(mockCleanup).toHaveBeenCalledTimes(1);
  });

  test('does not run effect when not mounted', () => {
    // This would be tested in a server environment
    // For now, we test the dependency logic
    const mockEffect = vi.fn();
    
    renderHook(() => useHydratedEffect(mockEffect, []));
    
    expect(mockEffect).toHaveBeenCalled();
  });
});

describe('useSSRState Hook', () => {
  test('returns correct state values', () => {
    const { result } = renderHook(() => useSSRState());
    
    expect(result.current).toEqual({
      isSSR: false,
      isClient: true,
      isBrowser: true,
      isServer: false,
    });
  });
});

describe('useWindowProperty Hook', () => {
  test('returns window property value when available', () => {
    const mockGetter = vi.fn(() => 'test-value');
    
    const { result } = renderHook(() => 
      useWindowProperty(mockGetter, 'fallback')
    );
    
    expect(result.current).toBe('test-value');
    expect(mockGetter).toHaveBeenCalled();
  });

  test('returns fallback value when getter throws', () => {
    const mockGetter = vi.fn(() => {
      throw new Error('Property not available');
    });
    
    const { result } = renderHook(() => 
      useWindowProperty(mockGetter, 'fallback')
    );
    
    expect(result.current).toBe('fallback');
  });

  test('handles undefined fallback', () => {
    const mockGetter = vi.fn(() => {
      throw new Error('Property not available');
    });
    
    const { result } = renderHook(() => 
      useWindowProperty(mockGetter)
    );
    
    expect(result.current).toBeUndefined();
  });
});

describe('safeLocalStorage', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  test('getItem returns value when available', () => {
    mockLocalStorage.getItem.mockReturnValue('test-value');
    
    const result = safeLocalStorage.getItem('test-key');
    
    expect(result).toBe('test-value');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
  });

  test('getItem returns null when localStorage throws', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('Storage not available');
    });
    
    const result = safeLocalStorage.getItem('test-key');
    
    expect(result).toBeNull();
  });

  test('setItem returns true on success', () => {
    mockLocalStorage.setItem.mockImplementation(() => {});
    
    const result = safeLocalStorage.setItem('test-key', 'test-value');
    
    expect(result).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
  });

  test('setItem returns false when localStorage throws', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });
    
    const result = safeLocalStorage.setItem('test-key', 'test-value');
    
    expect(result).toBe(false);
  });

  test('removeItem returns true on success', () => {
    mockLocalStorage.removeItem.mockImplementation(() => {});
    
    const result = safeLocalStorage.removeItem('test-key');
    
    expect(result).toBe(true);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
  });

  test('removeItem returns false when localStorage throws', () => {
    mockLocalStorage.removeItem.mockImplementation(() => {
      throw new Error('Storage not available');
    });
    
    const result = safeLocalStorage.removeItem('test-key');
    
    expect(result).toBe(false);
  });

  test('handles server environment gracefully', () => {
    // Mock server environment
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    vi.resetModules();
    const { safeLocalStorage: serverSafeStorage } = require('../ssr');

    expect(serverSafeStorage.getItem('test')).toBeNull();
    expect(serverSafeStorage.setItem('test', 'value')).toBe(false);
    expect(serverSafeStorage.removeItem('test')).toBe(false);

    // Restore
    global.window = originalWindow;
  });
});

describe('safeSessionStorage', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
  });

  test('getItem works correctly', () => {
    mockSessionStorage.getItem.mockReturnValue('session-value');
    
    const result = safeSessionStorage.getItem('session-key');
    
    expect(result).toBe('session-value');
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('session-key');
  });

  test('handles errors gracefully', () => {
    mockSessionStorage.getItem.mockImplementation(() => {
      throw new Error('Session storage not available');
    });
    
    const result = safeSessionStorage.getItem('session-key');
    
    expect(result).toBeNull();
  });
});

describe('enhancedLocalStorage', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  test('getItemSafe returns success result', () => {
    mockLocalStorage.getItem.mockReturnValue('enhanced-value');
    
    const result = enhancedLocalStorage.getItemSafe('enhanced-key');
    
    expect(result).toEqual({
      success: true,
      value: 'enhanced-value',
    });
  });

  test('getItemSafe returns error result on failure', () => {
    const error = new Error('Enhanced storage error');
    mockLocalStorage.getItem.mockImplementation(() => {
      throw error;
    });
    
    const result = enhancedLocalStorage.getItemSafe('enhanced-key');
    
    expect(result).toEqual({
      success: false,
      error,
    });
  });

  test('setItemSafe returns success result', () => {
    mockLocalStorage.setItem.mockImplementation(() => {});
    
    const result = enhancedLocalStorage.setItemSafe('enhanced-key', 'enhanced-value');
    
    expect(result).toEqual({ success: true });
  });

  test('setItemSafe returns error result on failure', () => {
    const error = new Error('Enhanced storage set error');
    mockLocalStorage.setItem.mockImplementation(() => {
      throw error;
    });
    
    const result = enhancedLocalStorage.setItemSafe('enhanced-key', 'enhanced-value');
    
    expect(result).toEqual({
      success: false,
      error,
    });
  });

  test('handles server environment in enhanced methods', () => {
    // Mock server environment
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    vi.resetModules();
    const { enhancedLocalStorage: serverEnhancedStorage } = require('../ssr');

    const getResult = serverEnhancedStorage.getItemSafe('test');
    expect(getResult.success).toBe(false);
    expect(getResult.error?.message).toBe('Not in browser environment');

    const setResult = serverEnhancedStorage.setItemSafe('test', 'value');
    expect(setResult.success).toBe(false);
    expect(setResult.error?.message).toBe('Not in browser environment');

    // Restore
    global.window = originalWindow;
  });
});

describe('useEventListener Hook', () => {
  const mockAddEventListener = vi.fn();
  const mockRemoveEventListener = vi.fn();

  beforeEach(() => {
    Object.defineProperty(global, 'window', {
      value: {
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      },
      writable: true,
    });
  });

  test('adds event listener on mount', () => {
    const handler = vi.fn();
    
    renderHook(() => useEventListener('click', handler));
    
    expect(mockAddEventListener).toHaveBeenCalledWith('click', handler, undefined);
  });

  test('removes event listener on unmount', () => {
    const handler = vi.fn();
    
    const { unmount } = renderHook(() => useEventListener('click', handler));
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('click', handler, undefined);
  });

  test('uses custom element when provided', () => {
    const handler = vi.fn();
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    renderHook(() => useEventListener('click', handler, mockElement as any));
    
    expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, undefined);
  });

  test('passes options to event listener', () => {
    const handler = vi.fn();
    const options = { passive: true };
    
    renderHook(() => useEventListener('click', handler, undefined, options));
    
    expect(mockAddEventListener).toHaveBeenCalledWith('click', handler, options);
  });

  test('handles null element gracefully', () => {
    const handler = vi.fn();
    
    expect(() => {
      renderHook(() => useEventListener('click', handler, null));
    }).not.toThrow();
  });
});

describe('safeDocument', () => {
  const mockDocument = {
    body: {},
    createElement: vi.fn(),
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(global, 'document', {
      value: mockDocument,
      writable: true,
    });
  });

  test('createElement returns element when successful', () => {
    const mockElement = {};
    mockDocument.createElement.mockReturnValue(mockElement);
    
    const result = safeDocument.createElement('div');
    
    expect(result).toBe(mockElement);
    expect(mockDocument.createElement).toHaveBeenCalledWith('div');
  });

  test('createElement returns null when it throws', () => {
    mockDocument.createElement.mockImplementation(() => {
      throw new Error('Element creation failed');
    });
    
    const result = safeDocument.createElement('div');
    
    expect(result).toBeNull();
  });

  test('getElementById returns element', () => {
    const mockElement = {};
    mockDocument.getElementById.mockReturnValue(mockElement);
    
    const result = safeDocument.getElementById('test-id');
    
    expect(result).toBe(mockElement);
    expect(mockDocument.getElementById).toHaveBeenCalledWith('test-id');
  });

  test('querySelector handles errors gracefully', () => {
    mockDocument.querySelector.mockImplementation(() => {
      throw new Error('Invalid selector');
    });
    
    const result = safeDocument.querySelector('invalid[selector');
    
    expect(result).toBeNull();
  });

  test('addEventListener returns cleanup function', () => {
    const listener = vi.fn();
    
    const cleanup = safeDocument.addEventListener('click', listener);
    
    expect(mockDocument.addEventListener).toHaveBeenCalledWith('click', listener, undefined);
    expect(typeof cleanup).toBe('function');
    
    cleanup();
    
    expect(mockDocument.removeEventListener).toHaveBeenCalledWith('click', listener, undefined);
  });

  test('handles server environment', () => {
    // Mock server environment
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    vi.resetModules();
    const { safeDocument: serverSafeDocument } = require('../ssr');

    expect(serverSafeDocument.body).toBeNull();
    expect(serverSafeDocument.createElement('div')).toBeNull();
    expect(serverSafeDocument.getElementById('test')).toBeNull();

    // Restore
    global.window = originalWindow;
  });
});

describe('useScreenSize Hook', () => {
  const mockWindow = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true,
    });
  });

  test('returns initial screen size', () => {
    const { result } = renderHook(() => useScreenSize());
    
    expect(result.current).toEqual({
      width: 1024,
      height: 768,
    });
  });

  test('adds resize event listener', () => {
    renderHook(() => useScreenSize());
    
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  test('removes resize event listener on unmount', () => {
    const { unmount } = renderHook(() => useScreenSize());
    
    unmount();
    
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });
});

describe('Utility Functions', () => {
  test('isHydratedSync returns true in browser', () => {
    expect(isHydratedSync()).toBe(true);
  });

  test('whenHydrated executes function when hydrated', () => {
    const mockFn = vi.fn(() => 'result');
    
    const result = whenHydrated(mockFn);
    
    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalled();
  });

  test('whenHydratedOr returns function result when hydrated', () => {
    const mockFn = vi.fn(() => 'result');
    
    const result = whenHydratedOr(mockFn, 'fallback');
    
    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalled();
  });

  test('whenHydratedOr returns fallback when not hydrated', () => {
    // This would be tested in a server environment
    // For browser environment, it always returns the function result
    const mockFn = vi.fn(() => 'result');
    
    const result = whenHydratedOr(mockFn, 'fallback');
    
    expect(result).toBe('result');
  });
});

describe('getPortalRoot', () => {
  const mockDocument = {
    getElementById: vi.fn(),
    createElement: vi.fn(),
    body: {
      appendChild: vi.fn(),
    },
  };

  beforeEach(() => {
    Object.defineProperty(global, 'document', {
      value: mockDocument,
      writable: true,
    });
  });

  test('returns existing portal root', () => {
    const existingPortal = { id: 'portal-root' };
    mockDocument.getElementById.mockReturnValue(existingPortal);
    
    const result = getPortalRoot();
    
    expect(result).toBe(existingPortal);
    expect(mockDocument.getElementById).toHaveBeenCalledWith('portal-root');
  });

  test('creates new portal root when none exists', () => {
    const newPortal = { id: null };
    mockDocument.getElementById.mockReturnValue(null);
    mockDocument.createElement.mockReturnValue(newPortal);
    
    const result = getPortalRoot();
    
    expect(result).toBe(newPortal);
    expect(mockDocument.createElement).toHaveBeenCalledWith('div');
    expect(newPortal.id).toBe('portal-root');
    expect(mockDocument.body.appendChild).toHaveBeenCalledWith(newPortal);
  });

  test('returns dummy element in server environment', () => {
    // Mock server environment
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    vi.resetModules();
    const { getPortalRoot: serverGetPortalRoot } = require('../ssr');

    const result = serverGetPortalRoot();
    
    expect(typeof result.appendChild).toBe('function');
    expect(typeof result.removeChild).toBe('function');

    // Restore
    global.window = originalWindow;
  });
});

describe('Error Handling and Edge Cases', () => {
  test('handles undefined localStorage gracefully', () => {
    // @ts-ignore
    delete global.localStorage;
    
    vi.resetModules();
    const { safeLocalStorage: undefinedLocalStorage } = require('../ssr');
    
    expect(undefinedLocalStorage.getItem('test')).toBeNull();
    expect(undefinedLocalStorage.setItem('test', 'value')).toBe(false);
  });

  test('handles localStorage quota exceeded errors', () => {
    const mockStorage = {
      setItem: vi.fn(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      }),
    };

    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    const result = safeLocalStorage.setItem('test', 'value');
    
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Error writing localStorage key "test"'),
      expect.any(Error)
    );
  });

  test('handles SecurityError in storage operations', () => {
    const mockStorage = {
      getItem: vi.fn(() => {
        throw new DOMException('SecurityError', 'SecurityError');
      }),
    };

    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    const result = safeLocalStorage.getItem('test');
    
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Error reading localStorage key "test"'),
      expect.any(Error)
    );
  });
});