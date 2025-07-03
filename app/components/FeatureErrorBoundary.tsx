import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  isolate?: boolean;
}

/**
 * Feature-level error boundary for major sections of the application.
 * Provides graceful degradation when features fail while maintaining overall functionality.
 */
export function FeatureErrorBoundary({ 
  children, 
  featureName, 
  fallback,
  isolate = true 
}: FeatureErrorBoundaryProps) {
  const customFallback = fallback || (
    <div className="p-6 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200">
            {featureName} Temporarily Unavailable
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            This section is experiencing technical difficulties. The rest of the site remains fully functional.
          </p>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/70 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      level="feature"
      name={featureName}
      fallback={customFallback}
      enableRetry={true}
      maxRetries={3}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
}