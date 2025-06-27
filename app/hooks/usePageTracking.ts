import { useEffect } from 'react';
import { useLocation } from '@remix-run/react';
import { trackEvent } from '~/utils/posthog';

interface PageTrackingOptions {
  /** Custom page name override */
  pageName?: string;
  /** Additional properties to track */
  properties?: Record<string, any>;
  /** Track page engagement time when component unmounts */
  trackEngagement?: boolean;
}

export function usePageTracking(options: PageTrackingOptions = {}) {
  const location = useLocation();
  const { pageName, properties = {}, trackEngagement = false } = options;

  useEffect(() => {
    const startTime = Date.now();
    
    // Track page view on mount
    trackEvent('page_visit', {
      page: pageName || location.pathname,
      pathname: location.pathname,
      search: location.search,
      referrer: document.referrer,
      timestamp: startTime,
      ...properties,
    });

    // Track engagement time on unmount if enabled
    if (trackEngagement) {
      return () => {
        const endTime = Date.now();
        const engagementTime = endTime - startTime;
        
        if (engagementTime > 1000) { // Only track if user stayed for more than 1 second
          trackEvent('page_engagement', {
            page: pageName || location.pathname,
            pathname: location.pathname,
            engagement_time_ms: engagementTime,
            engagement_time_seconds: Math.round(engagementTime / 1000),
            timestamp: endTime,
            ...properties,
          });
        }
      };
    }
  }, [location.pathname, location.search, pageName, properties, trackEngagement]);
}