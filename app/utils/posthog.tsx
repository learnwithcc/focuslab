import { useEffect, useRef, useState, useCallback } from "react";
import posthogImport from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useLocation, useMatches } from "@remix-run/react";
import type { ReactNode } from "react";
import { useIsMounted, safeLocalStorage, isBrowser } from "~/utils/ssr";

// Ensure PostHog is properly available with fallback handling
const posthog = posthogImport || (typeof window !== 'undefined' ? (window as any).posthog : null);

// Add debugging to verify PostHog is available
if (isBrowser && !posthog) {
  console.error('PostHog: Failed to import posthog-js module');
} else if (isBrowser) {
  console.log('PostHog: Module imported successfully');
}

interface PHProviderProps {
  children: ReactNode;
  env?: {
    POSTHOG_API_KEY?: string;
    POSTHOG_API_HOST?: string;
  };
}

// Constants for retry logic
const CONSENT_CHECK_MAX_RETRIES = 10;
const CONSENT_CHECK_RETRY_DELAY = 100; // ms

// Helper function to check if consent system is initialized
function isConsentSystemReady(): boolean {
  if (!isBrowser) return false;
  
  try {
    // Check if localStorage is accessible
    const testKey = '__posthog_consent_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    
    // Check if consent data exists (even if it's a rejection)
    const consentData = localStorage.getItem('cookie-consent');
    return consentData !== null;
  } catch {
    return false;
  }
}

// Helper function to check analytics consent with proper error handling
function hasAnalyticsConsent(): boolean {
  try {
    const consentData = safeLocalStorage.getItem('cookie-consent');
    
    if (!consentData) {
      // No consent data means consent not given yet
      return false;
    }
    
    const consent = JSON.parse(consentData);
    return consent?.analytics === true;
  } catch (error) {
    // If we can't parse consent, assume no consent for safety
    return false;
  }
}

// Helper function to wait for consent system with retry logic
async function waitForConsentSystem(): Promise<boolean> {
  for (let i = 0; i < CONSENT_CHECK_MAX_RETRIES; i++) {
    if (isConsentSystemReady()) {
      return true;
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, CONSENT_CHECK_RETRY_DELAY));
  }
  
  // Consent system failed to initialize after retries
  return false;
}

// Helper function to update PostHog consent state
function updatePostHogConsent() {
  if (!posthog || !posthog.__loaded) {
    return;
  }
  
  if (hasAnalyticsConsent()) {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
}

export function PHProvider({ children, env }: PHProviderProps) {
  const location = useLocation();
  const matches = useMatches();
  const isMounted = useIsMounted();
  
  // Track initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  const [consentSystemFailed, setConsentSystemFailed] = useState(false);
  const initAttemptedRef = useRef(false);

  // Initialize PostHog with consent awareness
  useEffect(() => {
    // Only proceed if mounted and not already attempted
    if (!isMounted || initAttemptedRef.current) {
      return;
    }

    const apiKey = env?.POSTHOG_API_KEY;
    const apiHost = env?.POSTHOG_API_HOST || "https://us.i.posthog.com";
    
    // Validate API key and PostHog availability
    if (!apiKey || apiKey === "" || apiKey === "YOUR_POSTHOG_API_KEY") {
      return;
    }

    if (!posthog) {
      console.error('PostHog: Module not available, cannot initialize');
      return;
    }

    // Mark that we've attempted initialization
    initAttemptedRef.current = true;

    // Async initialization with consent check
    const initializePostHog = async () => {
      try {
        // Wait for consent system to be ready
        const consentReady = await waitForConsentSystem();
        
        if (!consentReady) {
          // Consent system failed - initialize PostHog with opt-out by default
          console.warn('PostHog: Consent system failed to initialize, defaulting to opt-out');
          setConsentSystemFailed(true);
          
          posthog.init(apiKey, {
            api_host: apiHost,
            capture_pageview: false,
            persistence: 'localStorage',
            autocapture: false,
            opt_out_capturing_by_default: true, // Default to opted out for GDPR compliance
            loaded: () => {
              setIsInitialized(true);
              // Don't capture anything if consent system failed
            },
          });
          return;
        }

        // Consent system is ready - check if we have consent
        const hasConsent = hasAnalyticsConsent();
        
        posthog.init(apiKey, {
          api_host: apiHost,
          capture_pageview: false,
          persistence: 'localStorage',
          autocapture: false,
          opt_out_capturing_by_default: !hasConsent, // Respect initial consent state
          loaded: (posthogInstance) => {
            setIsInitialized(true);
            
            // Only capture initial pageview if we have consent
            if (hasConsent) {
              posthogInstance.capture("$pageview", {
                $current_url: window.location.pathname,
                $screen_name: 'initial_load',
              });
            }
          },
        });
      } catch (error) {
        console.error('PostHog: Initialization error:', error);
        setConsentSystemFailed(true);
      }
    };

    initializePostHog();
  }, [isMounted, env?.POSTHOG_API_KEY, env?.POSTHOG_API_HOST]);

  // Listen for consent changes with optimized handling
  const handleConsentUpdate = useCallback(() => {
    // Only update if PostHog is initialized
    if (!isInitialized || !posthog.__loaded) {
      return;
    }

    try {
      updatePostHogConsent();
    } catch (error) {
      console.error('PostHog: Error updating consent state:', error);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!isMounted || !isInitialized) {
      return;
    }

    // Listen for cookie consent events
    window.addEventListener('cookieConsentUpdated', handleConsentUpdate);
    window.addEventListener('cookieConsentRevoked', handleConsentUpdate);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
      window.removeEventListener('cookieConsentRevoked', handleConsentUpdate);
    };
  }, [isMounted, isInitialized, handleConsentUpdate]);

  // Handle route changes for pageview tracking
  useEffect(() => {
    // Only proceed if everything is properly initialized
    if (!isMounted || !isInitialized || !posthog.__loaded) {
      return;
    }

    // Only track if analytics consent is granted and consent system is working
    if (consentSystemFailed || !hasAnalyticsConsent()) {
      return;
    }

    try {
      if (matches.length > 0) {
        const { id, data } = matches[matches.length - 1];
        
        // Safely extract user data with null checking
        const user = data && typeof data === 'object' && 'user' in data 
          ? (data as { user?: { id: string; email?: string } }).user 
          : undefined;
        
        if (user) {
          posthog.identify(user.id, { email: user.email });
        }
        
        // Capture pageview on route change
        posthog.capture("$pageview", {
          $current_url: location.pathname,
          $screen_name: id,
        });
      }
    } catch (error) {
      console.error('PostHog: Route tracking error:', error);
    }
  }, [location, matches, isMounted, isInitialized, consentSystemFailed]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

// Export helper functions for manual event tracking
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // Check if PostHog is available, loaded and consent is granted
  if (!posthog || !posthog.__loaded || !hasAnalyticsConsent()) {
    return;
  }
  
  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error('PostHog: Event tracking error:', error);
  }
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  // Check if PostHog is available, loaded and consent is granted
  if (!posthog || !posthog.__loaded || !hasAnalyticsConsent()) {
    return;
  }
  
  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.error('PostHog: User identification error:', error);
  }
}

// Export function to check if PostHog is ready and consent is granted
export function isPostHogReady(): boolean {
  return posthog && posthog.__loaded && hasAnalyticsConsent();
}

// Export function to get current consent status
export function getAnalyticsConsentStatus(): {
  hasConsent: boolean;
  isSystemReady: boolean;
} {
  return {
    hasConsent: hasAnalyticsConsent(),
    isSystemReady: isConsentSystemReady(),
  };
} 