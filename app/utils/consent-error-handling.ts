import { initTimer } from './ssr';
import type { CookieConsent } from '~/types/cookies';

export interface ConsentError extends Error {
  code: string;
  recoverable: boolean;
  timestamp: number;
}

export type ConsentErrorCode = 
  | 'INITIALIZATION_FAILED'
  | 'STORAGE_ACCESS_DENIED'
  | 'INVALID_CONSENT_DATA'
  | 'EVENT_DISPATCH_FAILED'
  | 'CONTEXT_NOT_FOUND'
  | 'UNEXPECTED_ERROR';

/**
 * Creates a structured consent error with metadata
 */
export function createConsentError(
  message: string,
  code: ConsentErrorCode,
  originalError?: Error,
  recoverable: boolean = true
): ConsentError {
  const error = new Error(message) as ConsentError;
  error.name = 'ConsentError';
  error.code = code;
  error.recoverable = recoverable;
  error.timestamp = Date.now();
  
  if (originalError) {
    error.stack = `${error.stack}\nCaused by: ${originalError.stack}`;
  }
  
  return error;
}

/**
 * Logs consent errors with structured data
 */
export function logConsentError(error: ConsentError, context?: Record<string, any>) {
  const errorData = {
    message: error.message,
    code: error.code,
    recoverable: error.recoverable,
    timestamp: error.timestamp,
    stack: error.stack,
    context,
  };

  initTimer.log('ConsentErrorHandler', 'Consent error logged', errorData);

  // Send to external error tracking if available
  if (typeof window !== 'undefined') {
    try {
      // Sentry integration
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          tags: {
            errorType: 'consent_error',
            errorCode: error.code,
            recoverable: error.recoverable.toString(),
          },
          extra: context,
        });
      }

      // PostHog integration (if consent allows)
      if (window.posthog && hasAnalyticsConsentSafe()) {
        window.posthog.capture('consent_error', {
          error_code: error.code,
          error_message: error.message,
          recoverable: error.recoverable,
          ...context,
        });
      }
    } catch (loggingError) {
      console.error('Failed to log consent error to external services:', loggingError);
    }
  }

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Consent Error:', errorData);
  }
}

/**
 * Safely checks for analytics consent without throwing errors
 */
function hasAnalyticsConsentSafe(): boolean {
  try {
    const consentData = localStorage.getItem('cookie-consent');
    if (!consentData) return false;
    
    const consent = JSON.parse(consentData);
    return consent?.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Attempts to recover from consent errors
 */
export async function attemptConsentRecovery(error: ConsentError): Promise<boolean> {
  initTimer.log('ConsentErrorHandler', 'Attempting recovery from error', {
    code: error.code,
    recoverable: error.recoverable,
  });

  if (!error.recoverable) {
    initTimer.log('ConsentErrorHandler', 'Error marked as non-recoverable, skipping recovery');
    return false;
  }

  try {
    switch (error.code) {
      case 'STORAGE_ACCESS_DENIED':
        return await recoverFromStorageError();
      
      case 'INVALID_CONSENT_DATA':
        return await recoverFromCorruptedData();
      
      case 'EVENT_DISPATCH_FAILED':
        return await recoverFromEventError();
      
      case 'INITIALIZATION_FAILED':
        return await recoverFromInitializationError();
      
      default:
        return await fallbackRecovery();
    }
  } catch (recoveryError) {
    initTimer.log('ConsentErrorHandler', 'Recovery attempt failed', { recoveryError });
    return false;
  }
}

/**
 * Recovery strategy for localStorage access issues
 */
async function recoverFromStorageError(): Promise<boolean> {
  initTimer.log('ConsentErrorHandler', 'Attempting storage error recovery');
  
  try {
    // Test localStorage access
    const testKey = '_consent_test_' + Date.now();
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    initTimer.log('ConsentErrorHandler', 'Storage access recovered');
    return true;
  } catch {
    // Try alternative storage methods
    try {
      // Use sessionStorage as fallback
      sessionStorage.setItem('_consent_fallback', 'true');
      sessionStorage.removeItem('_consent_fallback');
      
      initTimer.log('ConsentErrorHandler', 'Using sessionStorage as fallback');
      return true;
    } catch {
      initTimer.log('ConsentErrorHandler', 'All storage methods failed');
      return false;
    }
  }
}

/**
 * Recovery strategy for corrupted consent data
 */
async function recoverFromCorruptedData(): Promise<boolean> {
  initTimer.log('ConsentErrorHandler', 'Attempting corrupted data recovery');
  
  try {
    // Remove corrupted data
    localStorage.removeItem('cookie-consent');
    
    // Create fresh default consent
    const defaultConsent: CookieConsent = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      version: '1.0.0',
    };

    // Don't save immediately - let user make the choice
    initTimer.log('ConsentErrorHandler', 'Corrupted data cleared, ready for fresh consent');
    return true;
  } catch {
    initTimer.log('ConsentErrorHandler', 'Failed to clear corrupted data');
    return false;
  }
}

/**
 * Recovery strategy for event dispatch issues
 */
async function recoverFromEventError(): Promise<boolean> {
  initTimer.log('ConsentErrorHandler', 'Attempting event error recovery');
  
  try {
    // Test custom event dispatch
    const testEvent = new CustomEvent('_consent_test');
    window.dispatchEvent(testEvent);
    
    initTimer.log('ConsentErrorHandler', 'Event dispatch recovered');
    return true;
  } catch {
    initTimer.log('ConsentErrorHandler', 'Event dispatch still failing, using direct callbacks');
    return true; // We can work without events
  }
}

/**
 * Recovery strategy for initialization failures
 */
async function recoverFromInitializationError(): Promise<boolean> {
  initTimer.log('ConsentErrorHandler', 'Attempting initialization error recovery');
  
  try {
    // Clear any partial state
    try {
      localStorage.removeItem('cookie-consent');
    } catch {
      // Ignore storage errors here
    }

    // Force a clean restart
    if (typeof window !== 'undefined') {
      // Use a small delay to allow cleanup
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Fallback recovery for unknown errors
 */
async function fallbackRecovery(): Promise<boolean> {
  initTimer.log('ConsentErrorHandler', 'Attempting fallback recovery');
  
  try {
    // Basic functionality test
    const canUseDOM = typeof window !== 'undefined';
    const canUseStorage = canUseDOM && 'localStorage' in window;
    
    if (canUseDOM && canUseStorage) {
      initTimer.log('ConsentErrorHandler', 'Basic functionality available');
      return true;
    }
    
    initTimer.log('ConsentErrorHandler', 'Basic functionality not available');
    return false;
  } catch {
    return false;
  }
}

/**
 * Creates an emergency consent state when all else fails
 */
export function createEmergencyConsent(): CookieConsent {
  return {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
    version: '1.0.0',
  };
}

/**
 * Checks if the current environment supports consent functionality
 */
export function isConsentEnvironmentSupported(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      'localStorage' in window &&
      'CustomEvent' in window &&
      'addEventListener' in window
    );
  } catch {
    return false;
  }
}

// Global error handler setup
export function setupGlobalConsentErrorHandler() {
  if (typeof window === 'undefined') return;

  const originalConsoleError = console.error;
  
  console.error = (...args) => {
    // Check if this looks like a consent-related error
    const errorMessage = args.join(' ');
    if (
      errorMessage.includes('useCookieConsent') ||
      errorMessage.includes('CookieConsent') ||
      errorMessage.includes('cookie-consent')
    ) {
      const error = createConsentError(
        errorMessage,
        'UNEXPECTED_ERROR',
        args[0] instanceof Error ? args[0] : undefined
      );
      logConsentError(error, { source: 'global_handler' });
    }
    
    // Call original console.error
    originalConsoleError.apply(console, args);
  };

  // Handle unhandled promise rejections that might be consent-related
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason && typeof reason === 'string' && reason.includes('consent')) {
      const error = createConsentError(
        `Unhandled promise rejection: ${reason}`,
        'UNEXPECTED_ERROR'
      );
      logConsentError(error, { source: 'unhandled_rejection' });
    }
  });
}

// Extend Window interface for external services
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
    };
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
    };
  }
}