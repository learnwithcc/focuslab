import { Component, type ReactNode, type ErrorInfo } from 'react';
import { initTimer } from '~/utils/ssr';
import type { CookieConsent } from '~/types/cookies';

interface ConsentErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ConsentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Error boundary component specifically for the cookie consent system.
 * Provides fallback UI and recovery mechanisms when consent system fails.
 */
export class ConsentErrorBoundary extends Component<ConsentErrorBoundaryProps, ConsentErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  constructor(props: ConsentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ConsentErrorBoundaryState> {
    initTimer.log('ConsentErrorBoundary', 'Error caught by boundary', { error: error.message });
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    initTimer.log('ConsentErrorBoundary', 'Error details captured', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call parent error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external error tracking if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          component: 'ConsentErrorBoundary',
        },
      });
    }

    // Store error info in state
    this.setState({ errorInfo });

    // Attempt automatic retry with exponential backoff
    this.scheduleRetry();
  }

  override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  scheduleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      initTimer.log('ConsentErrorBoundary', 'Max retries reached, not scheduling another retry');
      return;
    }

    const delay = this.retryDelay * Math.pow(2, this.state.retryCount);
    initTimer.log('ConsentErrorBoundary', 'Scheduling automatic retry', {
      retryCount: this.state.retryCount,
      delay,
    });

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  handleRetry = () => {
    initTimer.log('ConsentErrorBoundary', 'Attempting retry', {
      retryCount: this.state.retryCount,
    });

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleManualRetry = () => {
    initTimer.log('ConsentErrorBoundary', 'Manual retry triggered');
    
    // Cancel any pending automatic retry
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    // Reset retry count for manual retry
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  handleAcceptEssential = () => {
    initTimer.log('ConsentErrorBoundary', 'Emergency accept essential cookies');
    
    try {
      // Minimal consent object - only essential cookies
      const emergencyConsent: CookieConsent = {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      // Try to save to localStorage directly
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('cookie-consent', JSON.stringify(emergencyConsent));
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
          detail: emergencyConsent,
        }));

        // Reload the page to reinitialize
        window.location.reload();
      }
    } catch (error) {
      initTimer.log('ConsentErrorBoundary', 'Failed to save emergency consent', { error });
      // Even this failed, show a message to the user
      alert('We are unable to save your cookie preferences. Please try refreshing the page or contact support if the issue persists.');
    }
  };

  override render() {
    if (this.state.hasError) {
      const isRetrying = this.state.retryCount > 0 && this.state.retryCount < this.maxRetries;

      return (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-screen-xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                  Cookie Consent System Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  We're having trouble loading the cookie consent system. 
                  {isRetrying && ` Retrying automatically... (${this.state.retryCount}/${this.maxRetries})`}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                      Error details
                    </summary>
                    <pre className="text-xs mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded overflow-auto">
                      {this.state.error.message}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={this.handleAcceptEssential}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  aria-label="Accept essential cookies only"
                >
                  Accept Essential Only
                </button>
                
                <button
                  onClick={this.handleManualRetry}
                  disabled={isRetrying}
                  className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-gray-700 border border-red-300 dark:border-red-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Retry loading consent system"
                >
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </button>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-red-600 dark:text-red-400">
              <p>
                By continuing to use this site with essential cookies only, you agree to our 
                {' '}
                <a href="/privacy" className="underline hover:no-underline">
                  Privacy Policy
                </a>
                . Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
    };
  }
}