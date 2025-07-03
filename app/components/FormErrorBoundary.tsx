import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';

interface FormErrorBoundaryProps {
  children: ReactNode;
  formName?: string;
  onError?: (error: Error) => void;
}

/**
 * Specialized error boundary for form components.
 * Provides form-specific error handling while preserving form state when possible.
 */
export function FormErrorBoundary({ children, formName, onError }: FormErrorBoundaryProps) {
  const fallback = (
    <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {formName ? `${formName} Error` : 'Form Error'}
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            The form encountered an error and couldn't be displayed. Please try refreshing the page.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Refresh Page
            </button>
            <a
              href="/contact"
              className="bg-white dark:bg-gray-800 text-red-800 dark:text-red-200 px-3 py-1.5 rounded text-xs font-medium border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      level="component"
      name={formName ? `form-${formName}` : 'form'}
      fallback={fallback}
      enableRetry={false} // Forms typically shouldn't auto-retry
      onError={onError}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
}