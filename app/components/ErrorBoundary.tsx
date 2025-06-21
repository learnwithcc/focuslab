import React, { Component, ReactNode } from 'react';
import type { BaseComponentProps } from './types';
import { buildComponentClasses } from './utils/styles';
import { Button } from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the error callback if provided
    this.props.onError?.(error, errorInfo);

    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetOnPropsChange !== resetOnPropsChange) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => prevProps.resetKeys![index] !== key
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false
      });
    }, 100);
  };

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  override render() {
    const { hasError, error } = this.state;
    const { fallback, children, className = '', 'data-testid': testId } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <DefaultErrorFallback
          {...(error && { error })}
          onReset={this.resetErrorBoundary}
          className={className}
          {...(testId && { 'data-testid': testId })}
        />
      );
    }

    return children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error?: Error;
  onReset: () => void;
  className?: string;
  'data-testid'?: string;
}

export const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  onReset,
  className = '',
  'data-testid': testId,
}) => {
  const fallbackClasses = buildComponentClasses(
    'flex flex-col items-center justify-center',
    'p-8 bg-red-50 border border-red-200 rounded-lg',
    'text-center',
    className
  );

  return (
    <div
      className={fallbackClasses}
      role="alert"
      aria-live="assertive"
      data-testid={testId}
    >
      <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      
      <h3 className="mb-2 text-lg font-semibold text-red-900">
        Something went wrong
      </h3>
      
      <p className="mb-4 text-sm text-red-700">
        An unexpected error occurred while rendering this component.
      </p>
      
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4 text-xs text-left">
          <summary className="cursor-pointer text-red-800 hover:text-red-900">
            Error details (development only)
          </summary>
          <pre className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 overflow-auto">
            {error.message}
            {error.stack && (
              <>
                {'\n\n'}
                {error.stack}
              </>
            )}
          </pre>
        </details>
      )}
      
      <Button
        variant="primary"
        size="sm"
        onClick={onReset}
        className="bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
      >
        Try again
      </Button>
    </div>
  );
};

// Hook for using error boundaries functionally
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// Component-specific error boundary wrapper
export interface ComponentErrorBoundaryProps extends ErrorBoundaryProps {
  componentName?: string;
}

export const ComponentErrorBoundary: React.FC<ComponentErrorBoundaryProps> = ({
  componentName = 'Component',
  children,
  ...props
}) => {
  const customFallback = (
    <div
      className="p-4 bg-yellow-50 border border-yellow-200 rounded-md"
      role="alert"
    >
      <div className="flex items-center">
        <svg
          className="w-5 h-5 text-yellow-400 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm font-medium text-yellow-800">
          {componentName} failed to render
        </p>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={customFallback} {...props}>
      {children}
    </ErrorBoundary>
  );
}; 