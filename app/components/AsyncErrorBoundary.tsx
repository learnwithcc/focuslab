import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  operationName?: string;
  resetKeys?: Array<string | number>;
}

/**
 * Error boundary for components that perform async operations.
 * Handles loading states and provides retry mechanisms for async failures.
 */
export function AsyncErrorBoundary({ 
  children, 
  operationName, 
  resetKeys 
}: AsyncErrorBoundaryProps) {
  const fallback = (
    <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {operationName ? `${operationName} Failed` : 'Operation Failed'}
          </h3>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            The operation couldn't complete successfully. This might be due to a network issue or temporary server problem.
          </p>
          <div className="mt-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      level="component"
      name={operationName ? `async-${operationName}` : 'async-operation'}
      fallback={fallback}
      enableRetry={true}
      maxRetries={3}
      resetOnPropsChange={true}
      resetKeys={resetKeys || []}
    >
      {children}
    </ErrorBoundary>
  );
}