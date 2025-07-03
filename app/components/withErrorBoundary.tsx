import { ComponentType, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface ErrorBoundaryOptions {
  level?: 'app' | 'route' | 'feature' | 'component';
  name?: string;
  fallback?: ReactNode;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  onError?: (error: Error) => void;
}

/**
 * Higher-order component that wraps any component with an error boundary.
 * Makes it easy to add error handling to existing components.
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: ErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      level={options.level}
      name={options.name || Component.displayName || Component.name}
      fallback={options.fallback}
      enableRetry={options.enableRetry}
      maxRetries={options.maxRetries}
      resetOnPropsChange={options.resetOnPropsChange}
      resetKeys={options.resetKeys}
      onError={options.onError}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  // Preserve component name for debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Utility function to create error boundary HOCs with preset configurations
 */
export const withErrorBoundaryPresets = {
  /**
   * Wrap a component with feature-level error boundary
   */
  feature: <P extends object>(Component: ComponentType<P>, name?: string) =>
    withErrorBoundary(Component, {
      level: 'feature',
      name,
      enableRetry: true,
      maxRetries: 3,
    }),

  /**
   * Wrap a component with route-level error boundary
   */
  route: <P extends object>(Component: ComponentType<P>, name?: string) =>
    withErrorBoundary(Component, {
      level: 'route',
      name,
      enableRetry: true,
      maxRetries: 2,
      resetOnPropsChange: true,
    }),

  /**
   * Wrap a component with component-level error boundary
   */
  component: <P extends object>(Component: ComponentType<P>, name?: string) =>
    withErrorBoundary(Component, {
      level: 'component',
      name,
      enableRetry: true,
      maxRetries: 1,
    }),

  /**
   * Wrap an analytics component that should fail silently
   */
  analytics: <P extends object>(Component: ComponentType<P>, service?: string) =>
    withErrorBoundary(Component, {
      level: 'component',
      name: `analytics-${service || 'unknown'}`,
      fallback: null, // Silent failure
      enableRetry: false,
      onError: (error) => {
        console.warn(`Analytics component failed:`, error.message);
      },
    }),

  /**
   * Wrap a form component with form-specific error handling
   */
  form: <P extends object>(Component: ComponentType<P>, formName?: string) =>
    withErrorBoundary(Component, {
      level: 'component',
      name: `form-${formName || 'unknown'}`,
      enableRetry: false, // Forms shouldn't auto-retry
      resetOnPropsChange: true,
    }),
};