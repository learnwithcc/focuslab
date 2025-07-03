import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  routeName?: string;
  fallback?: ReactNode;
}

/**
 * Route-level error boundary that provides page-specific error handling.
 * Wraps entire route components to prevent route-level failures from affecting the app.
 */
export function RouteErrorBoundary({ children, routeName, fallback }: RouteErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="route"
      name={routeName}
      fallback={fallback}
      enableRetry={true}
      maxRetries={2}
      resetOnPropsChange={true}
      resetKeys={[routeName]}
    >
      {children}
    </ErrorBoundary>
  );
}