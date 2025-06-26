/**
 * SSR-Safe Utility Functions
 * 
 * These utilities help prevent hydration mismatches and handle browser API usage
 * safely in components that need to work both server-side and client-side.
 */
import { useEffect, useState } from 'react';

/**
 * Check if we're running in a browser environment
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Check if we're running on the server
 */
export const isServer = !isBrowser;

/**
 * Hook to detect if component is mounted (hydrated) on the client
 * This is useful for preventing hydration mismatches when components
 * need to render differently on server vs client
 */
export function useIsomorphicLayoutEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  if (isBrowser) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(effect, deps);
  }
}

/**
 * Hook to track if the component has mounted (hydrated) on the client
 * Returns false during SSR and initial render, true after hydration
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    console.log('useIsMounted - Setting mounted to true');
    setIsMounted(true);
  }, []);

  console.log('useIsMounted - Current state:', isMounted);
  return isMounted;
}

/**
 * Hook to safely access window properties
 * Returns undefined during SSR, actual value after hydration
 */
export function useWindowProperty<T>(
  getter: () => T,
  fallback?: T
): T | typeof fallback {
  const [value, setValue] = useState<T | typeof fallback>(fallback);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (isBrowser) {
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