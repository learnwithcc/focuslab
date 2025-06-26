# Cookie Consent Error Handling System

This document describes the comprehensive error handling system implemented for the cookie consent functionality in the Focus Lab website.

## Overview

The consent error handling system provides multiple layers of protection to ensure that users can always manage their cookie preferences, even when the main consent system experiences issues.

## Architecture

### 1. Error Boundary Layer

**Component**: `ConsentErrorBoundary`
- **Purpose**: Catches all React errors within the consent system
- **Features**:
  - Automatic retry with exponential backoff (up to 3 attempts)
  - Manual retry option for users
  - Emergency consent fallback
  - Comprehensive error logging to Sentry
  - Development-friendly error details

**Key Features**:
```tsx
<ConsentErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling
  }}
>
  {/* Consent system components */}
</ConsentErrorBoundary>
```

### 2. Safe Context Provider

**Component**: `SafeCookieConsentProvider`
- **Purpose**: Provides error-resilient consent context
- **Features**:
  - Comprehensive try-catch blocks around all operations
  - Structured error creation and logging
  - Automatic error recovery attempts
  - Fallback to emergency consent state
  - Safe event handling

**Error Types Handled**:
- `INITIALIZATION_FAILED` - Consent system startup errors
- `STORAGE_ACCESS_DENIED` - localStorage access issues
- `INVALID_CONSENT_DATA` - Corrupted consent data
- `EVENT_DISPATCH_FAILED` - Custom event problems
- `CONTEXT_NOT_FOUND` - Missing React context
- `UNEXPECTED_ERROR` - Catch-all for unknown issues

### 3. Fallback UI Components

**Components**: `FallbackConsentBanner`, `SafeCookieManager`
- **Purpose**: Provide minimal consent UI when main system fails
- **Features**:
  - GDPR-compliant emergency consent collection
  - Works without complex dependencies
  - Clear error messaging for users
  - Recovery mechanisms
  - Accessible design

### 4. Error Handling Utilities

**Module**: `consent-error-handling.ts`
- **Purpose**: Centralized error management
- **Features**:
  - Structured error creation
  - Comprehensive logging to multiple services
  - Automatic recovery strategies
  - Environment support detection
  - Global error handler setup

## Error Recovery Strategies

### 1. Storage Error Recovery
```typescript
// Handles localStorage access issues
async function recoverFromStorageError(): Promise<boolean> {
  try {
    // Test localStorage access
    localStorage.setItem('_test', 'test');
    localStorage.removeItem('_test');
    return true;
  } catch {
    // Fallback to sessionStorage
    try {
      sessionStorage.setItem('_test', 'test');
      sessionStorage.removeItem('_test');
      return true;
    } catch {
      return false;
    }
  }
}
```

### 2. Corrupted Data Recovery
```typescript
// Clears corrupted consent data
async function recoverFromCorruptedData(): Promise<boolean> {
  try {
    localStorage.removeItem('cookie-consent');
    return true; // Let user make fresh choice
  } catch {
    return false;
  }
}
```

### 3. Event System Recovery
```typescript
// Handles custom event dispatch issues
async function recoverFromEventError(): Promise<boolean> {
  try {
    // Test event dispatch
    window.dispatchEvent(new CustomEvent('_test'));
    return true;
  } catch {
    return true; // Can work without events
  }
}
```

## Integration with External Services

### Sentry Integration
- Automatic error capture with structured context
- Component stack traces for debugging
- Tagged errors for easy filtering
- Production and development mode handling

### PostHog Integration
- Safe analytics consent checking
- Error event tracking (when consent allows)
- Graceful degradation when PostHog fails
- Protected user identification

## User Experience During Errors

### Recoverable Errors
Users see a notification with:
- Clear explanation of the issue
- Options to accept essential cookies or all cookies
- Retry mechanism
- Fallback to simplified consent collection

### Non-Recoverable Errors
Users get:
- Emergency consent banner
- Essential-only cookie acceptance
- Page reload to attempt fresh initialization
- Contact information for persistent issues

## Development Features

### Error Details in Development
```tsx
{process.env.NODE_ENV === 'development' && error && (
  <details className="mt-2">
    <summary>Error details</summary>
    <pre>{error.message}</pre>
    <pre>{error.stack}</pre>
  </details>
)}
```

### Comprehensive Logging
```typescript
initTimer.log('ConsentErrorHandler', 'Consent error logged', {
  message: error.message,
  code: error.code,
  recoverable: error.recoverable,
  timestamp: error.timestamp,
  stack: error.stack,
  context,
});
```

## Testing Strategy

### Unit Tests
- Error boundary behavior
- Fallback UI functionality
- Recovery mechanism testing
- Accessibility compliance
- Edge case handling

### Integration Tests
- Full error scenario testing
- Cross-browser compatibility
- Storage error simulation
- Network failure handling

## Accessibility Compliance

### ARIA Attributes
```tsx
<div
  role="alert"
  aria-live="assertive"
  aria-label="Cookie consent system error"
>
```

### Keyboard Navigation
- All error UI elements are keyboard accessible
- Proper tab order maintained
- Clear focus indicators

### Screen Reader Support
- Descriptive error messages
- Status updates announced
- Action button labels

## GDPR Compliance During Errors

### Essential Cookies Only
- Always provides option for essential-only consent
- Clear explanation of what's included
- No tracking without explicit consent

### Data Protection
- No user data collected during error states
- Minimal information stored
- Transparent about limitations

### User Rights
- Clear recovery instructions
- Contact information provided
- Alternative consent mechanisms

## Monitoring and Alerting

### Error Metrics
- Error frequency tracking
- Recovery success rates
- User abandonment during errors
- Performance impact measurement

### Alert Thresholds
- High error rates trigger alerts
- Failed recovery attempts monitored
- User experience impact tracked

## Configuration Options

### Error Boundary Settings
```typescript
interface ConsentErrorBoundaryProps {
  maxRetries?: number;        // Default: 3
  retryDelay?: number;        // Default: 1000ms
  enableAutoRetry?: boolean;  // Default: true
  onError?: (error, info) => void;
}
```

### Recovery Settings
```typescript
interface RecoveryOptions {
  enableStorageFallback?: boolean;  // Default: true
  enableEventFallback?: boolean;    // Default: true
  enablePageReload?: boolean;       // Default: true
  maxRecoveryAttempts?: number;     // Default: 3
}
```

## Best Practices

### Error Handling
1. Always provide fallback UI
2. Log errors with context
3. Attempt automatic recovery
4. Give users manual options
5. Maintain GDPR compliance

### User Communication
1. Use clear, non-technical language
2. Explain what happened
3. Provide actionable options
4. Show progress during recovery
5. Offer alternative contact methods

### Development
1. Test all error scenarios
2. Use structured error types
3. Include recovery mechanisms
4. Monitor error rates
5. Document error handling

## Future Enhancements

### Planned Improvements
- Enhanced recovery strategies
- Better error prediction
- Improved user messaging
- Extended monitoring
- Performance optimizations

### Monitoring Improvements
- Real-time error dashboards
- Automated recovery testing
- User experience metrics
- Browser-specific error tracking