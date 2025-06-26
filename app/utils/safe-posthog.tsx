import { useEffect } from "react";
import * as posthogJs from "posthog-js";
const posthog = posthogJs.default;
import { PostHogProvider } from "posthog-js/react";
import { useLocation, useMatches } from "@remix-run/react";
import type { ReactNode } from "react";
import { useIsMounted, safeLocalStorage, initTimer } from "~/utils/ssr";
import { createConsentError, logConsentError } from "~/utils/consent-error-handling";

interface SafePHProviderProps {
  children: ReactNode;
  env?: {
    POSTHOG_API_KEY?: string;
    POSTHOG_API_HOST?: string;
  };
}

// Safe helper function to check analytics consent with error handling
function safeHasAnalyticsConsent(): boolean {
  initTimer.log('SafePostHog', 'Checking analytics consent safely');
  
  try {
    const consentData = safeLocalStorage.getItem('cookie-consent');
    initTimer.log('SafePostHog', 'Raw consent data from localStorage', { consentData });
    
    if (!consentData) {
      initTimer.log('SafePostHog', 'No consent data found - analytics disabled');
      return false;
    }
    
    const consent = JSON.parse(consentData);
    if (!consent || typeof consent !== 'object') {
      initTimer.log('SafePostHog', 'Invalid consent data format - analytics disabled');
      return false;
    }
    
    const hasConsent = consent.analytics === true;
    initTimer.log('SafePostHog', 'Analytics consent check result', { hasConsent, consent });
    return hasConsent;
  } catch (error) {
    const consentError = createConsentError(
      'Failed to check analytics consent for PostHog',
      'STORAGE_ACCESS_DENIED',
      error instanceof Error ? error : new Error(String(error))
    );
    logConsentError(consentError, { component: 'SafePostHog' });
    return false; // Fail safe - no consent assumed
  }
}

// Safe helper function to update PostHog consent state with error handling
function safeUpdatePostHogConsent() {
  initTimer.log('SafePostHog', 'Updating PostHog consent state safely');
  
  try {
    if (!posthog || !posthog.__loaded) {
      initTimer.log('SafePostHog', 'PostHog not loaded yet, skipping consent update');
      return;
    }
    
    initTimer.log('SafePostHog', 'PostHog is loaded, checking consent safely');
    
    if (safeHasAnalyticsConsent()) {
      posthog.opt_in_capturing();
      initTimer.log('SafePostHog', 'Analytics consent granted - tracking enabled');
    } else {
      posthog.opt_out_capturing();
      initTimer.log('SafePostHog', 'Analytics consent denied - tracking disabled');
    }
  } catch (error) {
    const consentError = createConsentError(
      'Failed to update PostHog consent state',
      'UNEXPECTED_ERROR',
      error instanceof Error ? error : new Error(String(error))
    );
    logConsentError(consentError, { component: 'SafePostHog' });
    
    // Fail safe - disable tracking
    try {
      if (posthog && posthog.__loaded) {
        posthog.opt_out_capturing();
      }
    } catch {
      // Even the fail safe failed, just log
      initTimer.log('SafePostHog', 'Failed to disable tracking as fallback');
    }
  }
}

export function SafePHProvider({ children, env }: SafePHProviderProps) {
  initTimer.log('SafePHProvider', 'Component function called');
  
  const location = useLocation();
  const matches = useMatches();
  const isMounted = useIsMounted();

  // Safe PostHog initialization
  useEffect(() => {
    initTimer.log('SafePHProvider', 'PostHog initialization useEffect triggered', { isMounted });
    
    if (!isMounted) {
      initTimer.log('SafePHProvider', 'Not mounted yet, skipping PostHog initialization');
      return;
    }

    const initializePostHog = async () => {
      try {
        initTimer.mark('SAFE_POSTHOG_INITIALIZATION_START');
        
        const apiKey = env?.POSTHOG_API_KEY;
        const apiHost = env?.POSTHOG_API_HOST || "https://us.i.posthog.com";
        
        initTimer.log('SafePHProvider', 'PostHog configuration', {
          hasApiKey: !!apiKey,
          apiKeyLength: apiKey?.length,
          apiHost,
        });
        
        if (!apiKey || apiKey === "" || apiKey === "YOUR_POSTHOG_API_KEY") {
          initTimer.log('SafePHProvider', 'No valid API key provided, skipping PostHog initialization');
          return;
        }

        initTimer.log('SafePHProvider', 'Valid API key found, initializing PostHog safely');
        
        posthog.init(apiKey, {
          api_host: apiHost,
          capture_pageview: false,
          persistence: 'localStorage',
          autocapture: false,
          loaded: (posthogInstance) => {
            try {
              initTimer.mark('SAFE_POSTHOG_LOADED_CALLBACK');
              initTimer.log('SafePHProvider', 'PostHog loaded callback executed safely');
              
              // Set initial consent state safely
              safeUpdatePostHogConsent();
              
              // Capture initial pageview if analytics is consented
              if (safeHasAnalyticsConsent()) {
                try {
                  posthogInstance.capture("$pageview", {
                    $current_url: window.location.pathname,
                    $screen_name: 'initial_load',
                  });
                  initTimer.log('SafePHProvider', 'Initial pageview tracked safely');
                } catch (pageviewError) {
                  logConsentError(createConsentError(
                    'Failed to capture initial pageview',
                    'UNEXPECTED_ERROR',
                    pageviewError instanceof Error ? pageviewError : new Error(String(pageviewError))
                  ));
                }
              }
              
              initTimer.mark('SAFE_POSTHOG_INITIALIZATION_COMPLETE');
            } catch (callbackError) {
              logConsentError(createConsentError(
                'PostHog loaded callback failed',
                'INITIALIZATION_FAILED',
                callbackError instanceof Error ? callbackError : new Error(String(callbackError))
              ));
            }
          },
        });
        
        initTimer.log('SafePHProvider', 'PostHog.init() called successfully');
      } catch (error) {
        logConsentError(createConsentError(
          'PostHog initialization failed',
          'INITIALIZATION_FAILED',
          error instanceof Error ? error : new Error(String(error))
        ));
      }
    };

    initializePostHog();
  }, [env?.POSTHOG_API_KEY, env?.POSTHOG_API_HOST, isMounted]);

  // Safe consent change listener
  useEffect(() => {
    initTimer.log('SafePHProvider', 'Consent listener useEffect triggered', { isMounted });
    
    if (!isMounted) {
      initTimer.log('SafePHProvider', 'Not mounted, skipping consent event listeners');
      return;
    }

    const handleConsentUpdate = (event: Event) => {
      try {
        initTimer.log('SafePHProvider', 'Consent update event received safely', { type: event.type });
        safeUpdatePostHogConsent();
      } catch (error) {
        logConsentError(createConsentError(
          'Failed to handle consent update event',
          'EVENT_DISPATCH_FAILED',
          error instanceof Error ? error : new Error(String(error))
        ));
      }
    };

    try {
      initTimer.log('SafePHProvider', 'Adding consent event listeners safely');
      window.addEventListener('cookieConsentUpdated', handleConsentUpdate);
      window.addEventListener('cookieConsentRevoked', handleConsentUpdate);
      initTimer.log('SafePHProvider', 'Consent event listeners added successfully');

      return () => {
        try {
          initTimer.log('SafePHProvider', 'Cleaning up consent event listeners safely');
          window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
          window.removeEventListener('cookieConsentRevoked', handleConsentUpdate);
        } catch (error) {
          initTimer.log('SafePHProvider', 'Error cleaning up event listeners', { error });
        }
      };
    } catch (error) {
      logConsentError(createConsentError(
        'Failed to setup consent event listeners',
        'EVENT_DISPATCH_FAILED',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }, [isMounted]);

  // Safe route change tracking
  useEffect(() => {
    initTimer.log('SafePHProvider', 'Route change useEffect triggered safely', {
      isMounted,
      posthogLoaded: posthog?.__loaded,
      pathname: location.pathname
    });
    
    if (!isMounted) {
      initTimer.log('SafePHProvider', 'Not mounted, skipping route tracking');
      return;
    }

    const trackPageview = async () => {
      try {
        // Check if PostHog is ready
        if (!posthog || !posthog.__loaded) {
          initTimer.log('SafePHProvider', 'PostHog not ready, skipping route tracking');
          return;
        }

        // Check consent
        if (!safeHasAnalyticsConsent()) {
          initTimer.log('SafePHProvider', 'No analytics consent, skipping pageview tracking');
          return;
        }

        initTimer.log('SafePHProvider', 'Processing route change for tracking safely');
        
        if (matches.length > 0) {
          const { id, data } = matches[matches.length - 1];
          
          // Safely extract user data
          let user: { id: string; email?: string } | undefined;
          try {
            if (data && typeof data === 'object' && 'user' in data) {
              const userData = (data as { user?: any }).user;
              if (userData && typeof userData === 'object' && 'id' in userData) {
                user = userData as { id: string; email?: string };
              }
            }
          } catch (userError) {
            initTimer.log('SafePHProvider', 'Error extracting user data, continuing without identification', { userError });
          }
          
          // Identify user if available
          if (user) {
            try {
              posthog.identify(user.id, { email: user.email });
              initTimer.log('SafePHProvider', 'User identified safely');
            } catch (identifyError) {
              initTimer.log('SafePHProvider', 'Error identifying user, continuing with pageview', { identifyError });
            }
          }
          
          // Capture pageview
          try {
            posthog.capture("$pageview", {
              $current_url: location.pathname,
              $screen_name: id,
            });
            initTimer.log('SafePHProvider', 'Pageview tracked safely');
          } catch (pageviewError) {
            logConsentError(createConsentError(
              'Failed to capture pageview',
              'UNEXPECTED_ERROR',
              pageviewError instanceof Error ? pageviewError : new Error(String(pageviewError))
            ));
          }
        }
      } catch (error) {
        logConsentError(createConsentError(
          'Route tracking failed',
          'UNEXPECTED_ERROR',
          error instanceof Error ? error : new Error(String(error))
        ));
      }
    };

    trackPageview();
  }, [location, matches, isMounted]);

  // Safe PostHog provider wrapper
  try {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
  } catch (error) {
    logConsentError(createConsentError(
      'PostHogProvider failed to render',
      'UNEXPECTED_ERROR',
      error instanceof Error ? error : new Error(String(error))
    ));
    
    // Fallback: render children without PostHog
    initTimer.log('SafePHProvider', 'Rendering fallback without PostHog due to error');
    return <>{children}</>;
  }
}

// Safe export helper functions for manual event tracking
export function safeTrackEvent(eventName: string, properties?: Record<string, any>) {
  try {
    if (!posthog || !posthog.__loaded) {
      initTimer.log('SafePostHog', 'PostHog not loaded, skipping event:', eventName);
      return;
    }
    
    if (!safeHasAnalyticsConsent()) {
      initTimer.log('SafePostHog', 'No analytics consent, skipping event:', eventName);
      return;
    }
    
    posthog.capture(eventName, properties);
    initTimer.log('SafePostHog', 'Event tracked safely:', eventName);
  } catch (error) {
    logConsentError(createConsentError(
      `Failed to track event: ${eventName}`,
      'UNEXPECTED_ERROR',
      error instanceof Error ? error : new Error(String(error))
    ));
  }
}

export function safeIdentifyUser(userId: string, properties?: Record<string, any>) {
  try {
    if (!posthog || !posthog.__loaded) {
      initTimer.log('SafePostHog', 'PostHog not loaded, skipping user identification');
      return;
    }
    
    if (!safeHasAnalyticsConsent()) {
      initTimer.log('SafePostHog', 'No analytics consent, skipping user identification');
      return;
    }
    
    posthog.identify(userId, properties);
    initTimer.log('SafePostHog', 'User identified safely');
  } catch (error) {
    logConsentError(createConsentError(
      'Failed to identify user',
      'UNEXPECTED_ERROR',
      error instanceof Error ? error : new Error(String(error))
    ));
  }
}