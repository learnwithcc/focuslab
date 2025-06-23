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
    // This is the client-side initialization
    posthog.init(process.env['POSTHOG_API_KEY'] || "YOUR_POSTHOG_API_KEY", {
      api_host: process.env['POSTHOG_API_HOST'] || "https://us.i.posthog.com",
      // Manually capture pageviews since we are in a single-page app
      capture_pageview: false, 
    });
  }, []);

  useEffect(() => {
    if (matches.length > 0) {
      const { id, data } = matches[matches.length - 1];
      const { user } = data as { user?: { id: string; email?: string } };
      
      if (user) {
        posthog.identify(user.id, { email: user.email });
      }
      
      // Capture pageview on route change
      posthog.capture("$pageview", {
        $current_url: location.pathname,
        $screen_name: id,
      });
    }
  }, [location, matches]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
} 