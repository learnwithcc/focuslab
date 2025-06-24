import { useEffect } from "react";
import posthog from "posthog-js";
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

export function PHProvider({ children, env }: PHProviderProps) {
  const location = useLocation();
  const matches = useMatches();
  const isMounted = useIsMounted();

  useEffect(() => {
    // Only initialize PostHog on the client side
    if (!isMounted) return;

    // Only initialize PostHog if we have a valid API key
    const apiKey = env?.POSTHOG_API_KEY;
    const apiHost = env?.POSTHOG_API_HOST || "https://us.i.posthog.com";
    
    if (apiKey && apiKey !== "" && apiKey !== "YOUR_POSTHOG_API_KEY") {
      try {
        posthog.init(apiKey, {
          api_host: apiHost,
          // Manually capture pageviews since we are in a single-page app
          capture_pageview: false,
          // Add persistence and other production settings
          persistence: 'localStorage',
          autocapture: false, // Disable autocapture for better control
          loaded: (posthog) => {
            // Opt out users who haven't consented to cookies (SSR-safe)
            if (!safeLocalStorage.getItem('cookie-consent')) {
              posthog.opt_out_capturing();
            }
          },
        });
        console.log('PostHog initialized successfully');
      } catch (error) {
        console.warn('PostHog initialization failed:', error);
      }
    } else {
      console.log('PostHog not initialized - no valid API key');
    }
  }, [env?.POSTHOG_API_KEY, env?.POSTHOG_API_HOST, isMounted]);

  useEffect(() => {
    // Only proceed if mounted and PostHog is properly initialized
    if (!isMounted || !posthog.__loaded) {
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
      console.warn('PostHog tracking error:', error);
    }
  }, [location, matches, isMounted]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
} 