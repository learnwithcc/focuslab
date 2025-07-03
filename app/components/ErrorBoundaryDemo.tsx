import { useState } from 'react';
import { 
  ErrorBoundary, 
  RouteErrorBoundary, 
  FeatureErrorBoundary, 
  FormErrorBoundary, 
  AsyncErrorBoundary, 
  AnalyticsErrorBoundary 
} from './';

// Component that can be made to throw errors on demand
const TestComponent = ({ 
  shouldThrow, 
  errorType 
}: { 
  shouldThrow: boolean; 
  errorType: string;
}) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'render':
        throw new Error('Render error: Component failed to render');
      case 'async':
        throw new Error('Async error: Data loading failed');
      case 'form':
        throw new Error('Form error: Validation failed');
      case 'analytics':
        throw new Error('Analytics error: Tracking failed');
      default:
        throw new Error('Generic error: Something went wrong');
    }
  }
  
  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
      <p className="text-green-800 dark:text-green-200">
        ✅ Component is working correctly ({errorType} test)
      </p>
    </div>
  );
};

interface ErrorBoundaryDemoProps {
  className?: string;
}

/**
 * Demo component for testing error boundaries in development.
 * Only renders in development mode for testing purposes.
 */
export function ErrorBoundaryDemo({ className = '' }: ErrorBoundaryDemoProps) {
  const [activeErrors, setActiveErrors] = useState({
    basic: false,
    route: false,
    feature: false,
    form: false,
    async: false,
    analytics: false,
  });

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const toggleError = (errorType: keyof typeof activeErrors) => {
    setActiveErrors(prev => ({
      ...prev,
      [errorType]: !prev[errorType]
    }));
  };

  const resetAll = () => {
    setActiveErrors({
      basic: false,
      route: false,
      feature: false,
      form: false,
      async: false,
      analytics: false,
    });
  };

  return (
    <div className={`space-y-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Error Boundary Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Test different error boundary levels and recovery mechanisms
        </p>
        <button
          onClick={resetAll}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Error Boundary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Basic Error Boundary
            </h3>
            <button
              onClick={() => toggleError('basic')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeErrors.basic
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {activeErrors.basic ? 'Fix Error' : 'Trigger Error'}
            </button>
          </div>
          <ErrorBoundary level="component" name="demo-basic">
            <TestComponent shouldThrow={activeErrors.basic} errorType="render" />
          </ErrorBoundary>
        </div>

        {/* Route Error Boundary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Route Error Boundary
            </h3>
            <button
              onClick={() => toggleError('route')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeErrors.route
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {activeErrors.route ? 'Fix Error' : 'Trigger Error'}
            </button>
          </div>
          <RouteErrorBoundary routeName="demo-route">
            <TestComponent shouldThrow={activeErrors.route} errorType="render" />
          </RouteErrorBoundary>
        </div>

        {/* Feature Error Boundary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Feature Error Boundary
            </h3>
            <button
              onClick={() => toggleError('feature')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeErrors.feature
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {activeErrors.feature ? 'Fix Error' : 'Trigger Error'}
            </button>
          </div>
          <FeatureErrorBoundary featureName="Demo Feature">
            <TestComponent shouldThrow={activeErrors.feature} errorType="render" />
          </FeatureErrorBoundary>
        </div>

        {/* Form Error Boundary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Form Error Boundary
            </h3>
            <button
              onClick={() => toggleError('form')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeErrors.form
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {activeErrors.form ? 'Fix Error' : 'Trigger Error'}
            </button>
          </div>
          <FormErrorBoundary formName="demo">
            <TestComponent shouldThrow={activeErrors.form} errorType="form" />
          </FormErrorBoundary>
        </div>

        {/* Async Error Boundary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Async Error Boundary
            </h3>
            <button
              onClick={() => toggleError('async')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeErrors.async
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {activeErrors.async ? 'Fix Error' : 'Trigger Error'}
            </button>
          </div>
          <AsyncErrorBoundary operationName="Data Loading" resetKeys={[String(activeErrors.async)]}>
            <TestComponent shouldThrow={activeErrors.async} errorType="async" />
          </AsyncErrorBoundary>
        </div>

        {/* Analytics Error Boundary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analytics Error Boundary
            </h3>
            <button
              onClick={() => toggleError('analytics')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeErrors.analytics
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {activeErrors.analytics ? 'Fix Error' : 'Trigger Error'}
            </button>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Analytics component (fails silently):
            </p>
            <AnalyticsErrorBoundary service="demo">
              <TestComponent shouldThrow={activeErrors.analytics} errorType="analytics" />
            </AnalyticsErrorBoundary>
            {activeErrors.analytics && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                Check console for analytics error warning
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Testing Instructions:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Click "Trigger Error" to test each error boundary type</li>
          <li>• Observe different fallback UI styles and recovery options</li>
          <li>• Check browser console for error logging</li>
          <li>• Test retry mechanisms where available</li>
          <li>• Analytics errors should fail silently (no UI change)</li>
        </ul>
      </div>
    </div>
  );
}