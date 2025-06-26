import { useEffect } from "react";
import * as posthogJs from "posthog-js";
const posthog = posthogJs.default;
import { PostHogProvider } from "posthog-js/react";
import { useLocation, useMatches } from "@remix-run/react";
import type { ReactNode } from "react";
import { useIsMounted, safeLocalStorage } from "~/utils/ssr";

interface PHProviderProps {
  children: ReactNode;
  env?: {
    POSTHOG_API_KEY?: string;
    POSTHOG_API_HOST?: string;
  };
}

// Helper function to check analytics consent
function hasAnalyticsConsent(): boolean {
  try {
    const consentData = safeLocalStorage.getItem('cookie-consent');
    if (!consentData) {
      console.log('PostHog: No consent data found - analytics disabled');
      return false;
    }
    
    const consent = JSON.parse(consentData);
    const hasConsent = consent?.analytics === true;
    console.log('PostHog: Analytics consent check -', hasConsent ? 'granted' : 'denied', consent);
    return hasConsent;
  } catch (error) {
    console.warn('PostHog: Error checking analytics consent:', error);
    return false;
  }
}

// Helper function to update PostHog consent state
function updatePostHogConsent() {
  if (!posthog.__loaded) {
    console.log('PostHog: Not loaded yet, skipping consent update');
    return;
  }
  
  if (hasAnalyticsConsent()) {
    posthog.opt_in_capturing();
    console.log('PostHog: Analytics consent granted - tracking enabled');
  } else {
    posthog.opt_out_capturing();
    console.log('PostHog: Analytics consent denied - tracking disabled');
  }
}

export function PHProvider({ children, env }: PHProviderProps) {
  const location = useLocation();
  const matches = useMatches();
  const isMounted = useIsMounted();

  // Initialize PostHog
  useEffect(() => {
    // Only initialize PostHog on the client side
    if (!isMounted) return;

    // Only initialize PostHog if we have a valid API key
    const apiKey = env?.POSTHOG_API_KEY;
    const apiHost = env?.POSTHOG_API_HOST || "https://us.i.posthog.com";
    
    console.log('PostHog: Initializing with API key:', apiKey ? 'present' : 'missing');
    console.log('PostHog: API Host:', apiHost);
    
    if (apiKey && apiKey !== "" && apiKey !== "YOUR_POSTHOG_API_KEY") {
      try {
        posthog.init(apiKey, {
          api_host: apiHost,
          // Manually capture pageviews since we are in a single-page app
          capture_pageview: false,
          // Add persistence and other production settings
          persistence: 'localStorage',
          autocapture: false, // Disable autocapture for better control
          loaded: (posthogInstance) => {
            console.log('PostHog: Initialized successfully');
            // Set initial consent state
            updatePostHogConsent();
            
            // Capture initial pageview if analytics is consented
            if (hasAnalyticsConsent()) {
              posthogInstance.capture("$pageview", {
                $current_url: window.location.pathname,
                $screen_name: 'initial_load',
              });
              console.log('PostHog: Initial pageview tracked for', window.location.pathname);
            }
          },
        });
      } catch (error) {
        console.warn('PostHog: Initialization failed:', error);
      }
    } else {
      console.log('PostHog: Not initialized - no valid API key provided');
    }
  }, [env?.POSTHOG_API_KEY, env?.POSTHOG_API_HOST, isMounted]);

  // Listen for consent changes
  useEffect(() => {
    if (!isMounted) return;

    const handleConsentUpdate = (event: Event) => {
      console.log('PostHog: Consent update event received:', event.type);
      updatePostHogConsent();
    };

    // Listen for cookie consent events
    window.addEventListener('cookieConsentUpdated', handleConsentUpdate);
    window.addEventListener('cookieConsentRevoked', handleConsentUpdate);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
      window.removeEventListener('cookieConsentRevoked', handleConsentUpdate);
    };
  }, [isMounted]);

  // Handle route changes for pageview tracking
  useEffect(() => {
    // Only proceed if mounted and PostHog is properly initialized
    if (!isMounted || !posthog.__loaded) {
      return;
    }

    // Only track if analytics consent is granted
    if (!hasAnalyticsConsent()) {
      console.log('PostHog: Skipping pageview tracking - no analytics consent');
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
          console.log('PostHog: User identified -', user.id);
        }
        
        // Capture pageview on route change
        posthog.capture("$pageview", {
          $current_url: location.pathname,
          $screen_name: id,
        });
        
        console.log('PostHog: Pageview tracked for', location.pathname);
      }
    } catch (error) {
      console.warn('PostHog: Tracking error:', error);
    }
  }, [location, matches, isMounted]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

// Export helper functions for manual event tracking
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!posthog.__loaded) {
    console.log('PostHog: Not loaded, skipping event:', eventName);
    return;
  }
  
  if (!hasAnalyticsConsent()) {
    console.log('PostHog: No analytics consent, skipping event:', eventName);
    return;
  }
  
  try {
    posthog.capture(eventName, properties);
    console.log('PostHog: Event tracked -', eventName, properties);
  } catch (error) {
    console.warn('PostHog: Event tracking error:', error);
  }
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!posthog.__loaded) {
    console.log('PostHog: Not loaded, skipping user identification');
    return;
  }
  
  if (!hasAnalyticsConsent()) {
    console.log('PostHog: No analytics consent, skipping user identification');
    return;
  }
  
  try {
    posthog.identify(userId, properties);
    console.log('PostHog: User identified -', userId);
  } catch (error) {
    console.warn('PostHog: User identification error:', error);
  }
} 