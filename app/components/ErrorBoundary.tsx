import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'app' | 'route' | 'feature' | 'component';
  name?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  retryCount: number;
  lastResetKeys: Array<string | number>;
}

/**
 * Comprehensive error boundary component that provides different levels of error containment.
 * Supports automatic retry, graceful degradation, and different fallback strategies.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private readonly maxRetries: number;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.maxRetries = props.maxRetries ?? 3;
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: 0,
      lastResetKeys: props.resetKeys ?? [],
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error,
      eventId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps, 
    state: ErrorBoundaryState
  ): Partial<ErrorBoundaryState> | null {
    const { resetKeys = [], resetOnPropsChange = true } = props;
    
    if (resetOnPropsChange && state.hasError) {
      // Check if any reset keys have changed
      const hasResetKeyChanged = resetKeys.length !== state.lastResetKeys.length ||
        resetKeys.some((key, idx) => key !== state.lastResetKeys[idx]);
      
      if (hasResetKeyChanged) {
        return { 
          hasError: false, 
          error: null, 
          errorInfo: null,
          retryCount: 0,
          lastResetKeys: resetKeys 
        };
      }
    }
    
    // Always update resetKeys to current props
    if (resetKeys.length !== state.lastResetKeys.length ||
        resetKeys.some((key, idx) => key !== state.lastResetKeys[idx])) {
      return { lastResetKeys: resetKeys };
    }
    
    return null;
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level = 'component', name, onError } = this.props;
    
    console.group(`🚨 ErrorBoundary [${level}${name ? `:${name}` : ''}]`);
    console.error('Error caught:', error);
    console.error('Error info:', errorInfo);
    console.groupEnd();

    // Store error info in state
    this.setState({ errorInfo });

    // Call parent error handler if provided
    onError?.(error, errorInfo);

    // Report to external error tracking
    this.reportError(error, errorInfo);

    // Schedule retry if enabled
    if (this.props.enableRetry !== false && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const { level = 'component', name } = this.props;
    
    // Report to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      const eventId = window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
          errorBoundary: {
            level,
            name: name || 'unnamed',
          },
        },
        tags: {
          errorBoundary: true,
          level,
        },
      });
      this.setState({ eventId });
    }

    // Report to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error in ${level} error boundary${name ? ` (${name})` : ''}:`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  };

  private scheduleRetry = () => {
    const delay = 1000 * Math.pow(2, this.state.retryCount); // Exponential backoff
    
    this.retryTimeoutId = setTimeout(() => {
      console.log(`🔄 Auto-retrying error boundary (attempt ${this.state.retryCount + 1}/${this.maxRetries})`);
      this.retry();
    }, delay);
  };

  private retry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private handleManualRetry = () => {
    // Cancel any pending automatic retry
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    console.log('👤 Manual retry triggered');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  private renderFallback(): ReactNode {
    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }

    return this.renderDefaultFallback();
  }

  private renderDefaultFallback(): ReactNode {
    const { level = 'component' } = this.props;

    // Different fallback strategies based on error boundary level
    switch (level) {
      case 'app':
        return this.renderAppLevelFallback();
      case 'route':
        return this.renderRouteLevelFallback();
      case 'feature':
        return this.renderFeatureLevelFallback();
      case 'component':
      default:
        return this.renderComponentLevelFallback();
    }
  }

  private renderAppLevelFallback(): ReactNode {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full text-center p-6">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We apologize for the inconvenience. The application encountered an unexpected error.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Reload Page
            </button>
            <a
              href="/"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  private renderRouteLevelFallback(): ReactNode {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="max-w-lg w-full text-center p-6">
          <div className="mb-4">
            <svg className="mx-auto h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Page Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This page encountered an error and couldn't load properly.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={this.handleManualRetry}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Try Again
            </button>
            <a
              href="/"
              className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  private renderFeatureLevelFallback(): ReactNode {
    const { name } = this.props;
    
    return (
      <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {name ? `${name} Unavailable` : 'Feature Unavailable'}
            </h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              This feature is temporarily unavailable. Please try again later.
            </p>
            <div className="mt-2">
              <button
                onClick={this.handleManualRetry}
                className="text-sm bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/70 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderComponentLevelFallback(): ReactNode {
    return (
      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Component unavailable</span>
          <button
            onClick={this.handleManualRetry}
            className="ml-2 text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
          >
            retry
          </button>
        </div>
      </div>
    );
  }

  override render() {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => string;
    };
  }
}