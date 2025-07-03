import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';

interface AnalyticsErrorBoundaryProps {
  children: ReactNode;
  service?: string;
}

/**
 * Specialized error boundary for analytics and tracking components.
 * Ensures analytics failures don't affect the main application functionality.
 */
export function AnalyticsErrorBoundary({ children, service }: AnalyticsErrorBoundaryProps) {
  // Analytics failures should be completely invisible to users
  // The fallback renders nothing, effectively hiding the failed analytics component
  const fallback = null;

  const handleError = (error: Error) => {
    // Log analytics errors but don't show them to users
    console.warn(`Analytics service${service ? ` (${service})` : ''} failed:`, error.message);
    
    // Report to error tracking but with lower priority
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: 'analytics',
          service: service || 'unknown',
          severity: 'low'
        },
        level: 'warning'
      });
    }
  };

  return (
    <ErrorBoundary
      level="component"
      name={`analytics${service ? `-${service}` : ''}`}
      fallback={fallback}
      enableRetry={false} // Analytics shouldn't retry automatically
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => string;
    };
  }
}