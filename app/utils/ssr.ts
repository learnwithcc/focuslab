/**
 * SSR-Safe Utility Functions
 * 
 * These utilities help prevent hydration mismatches and handle browser API usage
 * safely in components that need to work both server-side and client-side.
 */
import { useEffect, useState, useLayoutEffect, useSyncExternalStore } from 'react';

/**
 * Check if we're running in a browser environment
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Check if we're running on the server
 */
export const isServer = !isBrowser;

/**
 * Hook that runs effects immediately on client, skips on server
 * Similar to useLayoutEffect but SSR-safe
 */
export const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

/**
 * Global hydration state for immediate detection
 * This provides synchronous hydration state without delays
 */
let isHydrated = false;

// Mark hydration complete only after DOM is ready on client
if (isBrowser) {
  // Use a more reliable check for hydration readiness
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      isHydrated = true;
    });
  } else {
    // Document already loaded
    isHydrated = true;
  }
}

/**
 * Subscribe to hydration state changes
 */
function subscribe(callback: () => void) {
  // Hydration only happens once, so no need for actual subscription
  return () => {};
}

/**
 * Get current hydration state
 */
function getSnapshot() {
  return isHydrated;
}

/**
 * Get server snapshot (always false during SSR)
 */
function getServerSnapshot() {
  return false;
}

/**
 * Hook to track if the component has mounted (hydrated) on the client
 * This version provides IMMEDIATE hydration detection using React 18's useSyncExternalStore
 * Returns false only during SSR, true immediately on client
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}

/**
 * Alternative hook for hydration detection with useEffect
 * Use this only when you need to trigger side effects after hydration
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

/**
 * Hook to run a callback only after hydration
 * Useful for effects that should only run on the client after mount
 */
export function useHydratedEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const isMounted = useIsMounted();
  
  useEffect(() => {
    if (isMounted) {
      return effect();
    }
  }, [isMounted, ...(deps || [])]);
}

/**
 * Hook that provides both SSR and hydration state
 * Useful for components that need to know both states
 */
export function useSSRState() {
  const isMounted = useIsMounted();
  
  return {
    isSSR: !isMounted,
    isClient: isMounted,
    isBrowser,
    isServer,
  };
}

/**
 * Hook to safely access window properties
 * Returns fallback during SSR, actual value after hydration
 */
export function useWindowProperty<T>(
  getter: () => T,
  fallback?: T
): T | typeof fallback {
  const [value, setValue] = useState<T | typeof fallback>(fallback);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (isMounted && isBrowser) {
      try {
        setValue(getter());
      } catch (error) {
        console.warn('Error accessing window property:', error);
        setValue(fallback);
      }
    }
  }, [getter, fallback, isMounted]);

  return isMounted ? value : fallback;
}

/**
 * Safely access localStorage with SSR support
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    if (!isBrowser) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    if (!isBrowser) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  },
};

/**
 * Safely access sessionStorage with SSR support
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    if (!isBrowser) return false;
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Error writing sessionStorage key "${key}":`, error);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    if (!isBrowser) return false;
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
      return false;
    }
  },
};

/**
 * Safely add event listeners with cleanup
 */
export function useEventListener<T extends keyof WindowEventMap>(
  eventName: T,
  handler: (event: WindowEventMap[T]) => void,
  element?: Window | Element | null,
  options?: boolean | AddEventListenerOptions
) {
  useEffect(() => {
    if (!isBrowser) return;

    const targetElement = element || window;
    if (!targetElement?.addEventListener) return;

    targetElement.addEventListener(eventName as string, handler as EventListener, options);

    return () => {
      targetElement.removeEventListener(eventName as string, handler as EventListener, options);
    };
  }, [eventName, handler, element, options]);
}

/**
 * Safely manipulate document properties
 */
export const safeDocument = {
  body: isBrowser ? document.body : null,
  
  createElement: (tagName: string): HTMLElement | null => {
    if (!isBrowser) return null;
    try {
      return document.createElement(tagName);
    } catch (error) {
      console.warn(`Error creating element "${tagName}":`, error);
      return null;
    }
  },
  
  getElementById: (id: string): HTMLElement | null => {
    if (!isBrowser) return null;
    return document.getElementById(id);
  },
  
  querySelector: (selector: string): Element | null => {
    if (!isBrowser) return null;
    try {
      return document.querySelector(selector);
    } catch (error) {
      console.warn(`Error with querySelector "${selector}":`, error);
      return null;
    }
  },
  
  addEventListener: (
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    if (!isBrowser) return () => {};
    
    document.addEventListener(type, listener, options);
    return () => document.removeEventListener(type, listener, options);
  },
};

/**
 * Hook to safely detect screen size changes
 */
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!isBrowser) return;

    const updateSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return screenSize;
}

/**
 * Hook to safely create intersection observer
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!isBrowser || !elementRef.current) return;

    const obs = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    obs.observe(elementRef.current);
    setObserver(obs);

    return () => {
      obs.disconnect();
      setObserver(null);
    };
  }, [elementRef, options]);

  return { isIntersecting, observer };
}

/**
 * Hook to safely handle body scroll locking
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isBrowser) return;

    if (isLocked) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isLocked]);
}

/**
 * Create a portal-safe root element for modals
 */
export function getPortalRoot(): HTMLElement {
  if (!isBrowser) {
    // Return a dummy element for SSR
    return { appendChild: () => {}, removeChild: () => {} } as any;
  }

  let portalRoot = document.getElementById('portal-root');
  
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    document.body.appendChild(portalRoot);
  }
  
  return portalRoot;
}

/**
 * Hook to safely handle focus trapping for modals
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isBrowser || !isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [isActive, containerRef]);
}

// =============================================================================
// TypeScript Types for SSR Utilities
// =============================================================================

/**
 * SSR State interface for better type safety
 */
export interface SSRState {
  isSSR: boolean;
  isClient: boolean;
  isBrowser: boolean;
  isServer: boolean;
}

/**
 * Storage operation result
 */
export interface StorageResult<T = string> {
  success: boolean;
  value?: T;
  error?: Error;
}

/**
 * Enhanced storage interface with better error handling
 */
export interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): boolean;
  removeItem(key: string): boolean;
  getItemSafe<T = string>(key: string): StorageResult<T>;
  setItemSafe(key: string, value: string): StorageResult<void>;
}

// =============================================================================
// Enhanced Storage Utilities
// =============================================================================

/**
 * Enhanced localStorage with detailed error reporting
 */
export const enhancedLocalStorage: SafeStorage = {
  ...safeLocalStorage,
  
  getItemSafe<T = string>(key: string): StorageResult<T> {
    if (!isBrowser) {
      return { success: false, error: new Error('Not in browser environment') };
    }
    
    try {
      const value = localStorage.getItem(key);
      return { 
        success: true, 
        value: value as T 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error as Error 
      };
    }
  },
  
  setItemSafe(key: string, value: string): StorageResult<void> {
    if (!isBrowser) {
      return { success: false, error: new Error('Not in browser environment') };
    }
    
    try {
      localStorage.setItem(key, value);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error as Error 
      };
    }
  },
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if hydration is complete (synchronous)
 */
export function isHydratedSync(): boolean {
  return isHydrated;
}

/**
 * Execute a function only if hydrated
 */
export function whenHydrated<T>(fn: () => T): T | null {
  return isHydrated ? fn() : null;
}

/**
 * Execute a function only if hydrated, with fallback
 */
export function whenHydratedOr<T>(fn: () => T, fallback: T): T {
  return isHydrated ? fn() : fallback;
}

// =============================================================================
// Backward Compatibility (Deprecated - will be removed)
// =============================================================================

/**
 * @deprecated Use console.log directly or remove debug logging
 * Minimal timer for backward compatibility
 */
export const initTimer = {
  log: (component: string, event: string, data?: any) => {
    // No-op in production, could be enabled for debugging
    if (isBrowser && (window as any).ENV?.NODE_ENV === 'development') {
      console.log(`[${component}] ${event}`, data);
    }
  },
  mark: (label: string) => {
    // No-op in production, could be enabled for debugging
    if (isBrowser && (window as any).ENV?.NODE_ENV === 'development') {
      console.log(`[MARK] ${label}`);
    }
  },
};