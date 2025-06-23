import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useLocation, useMatches } from "@remix-run/react";
import type { ReactNode } from "react";

interface PHProviderProps {
  children: ReactNode;
}

export function PHProvider({ children }: PHProviderProps) {
  const location = useLocation();
  const matches = useMatches();

  useEffect(() => {
    // Only initialize PostHog if we have a valid API key
    const apiKey = process.env['POSTHOG_API_KEY'];
    if (apiKey && apiKey !== "YOUR_POSTHOG_API_KEY") {
      try {
        posthog.init(apiKey, {
          api_host: process.env['POSTHOG_API_HOST'] || "https://us.i.posthog.com",
          // Manually capture pageviews since we are in a single-page app
          capture_pageview: false, 
        });
        console.log('PostHog initialized successfully');
      } catch (error) {
        console.warn('PostHog initialization failed:', error);
      }
    } else {
      console.log('PostHog not initialized - no valid API key');
    }
  }, []);

  useEffect(() => {
    // Only proceed if PostHog is properly initialized
    if (!posthog.__loaded) {
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
  }, [location, matches]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
} 