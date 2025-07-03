import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import { RouteErrorBoundary } from '../RouteErrorBoundary';
import { FeatureErrorBoundary } from '../FeatureErrorBoundary';
import { FormErrorBoundary } from '../FormErrorBoundary';
import { AsyncErrorBoundary } from '../AsyncErrorBoundary';
import { AnalyticsErrorBoundary } from '../AnalyticsErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console methods
const originalError = console.error;
const originalWarn = console.warn;
const originalGroup = console.group;
const originalGroupEnd = console.groupEnd;

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.group = vi.fn();
  console.groupEnd = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.group = originalGroup;
  console.groupEnd = originalGroupEnd;
});

describe('ErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render fallback when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Component unavailable/)).toBeInTheDocument();
    expect(screen.getByText('retry')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should reset on resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Component unavailable/)).toBeInTheDocument();

    // Change reset key - should reset the error boundary
    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});

describe('RouteErrorBoundary', () => {
  it('should render route-level fallback', () => {
    render(
      <RouteErrorBoundary routeName="test-route">
        <ThrowError />
      </RouteErrorBoundary>
    );

    expect(screen.getByText('Page Error')).toBeInTheDocument();
    expect(screen.getByText(/This page encountered an error/)).toBeInTheDocument();
  });

  it('should have retry and home buttons', () => {
    render(
      <RouteErrorBoundary>
        <ThrowError />
      </RouteErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });
});

describe('FeatureErrorBoundary', () => {
  it('should render feature-level fallback with feature name', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Test Feature Temporarily Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/This section is experiencing technical difficulties/)).toBeInTheDocument();
  });

  it('should render default feature name when not provided', () => {
    render(
      <FeatureErrorBoundary featureName="">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Temporarily Unavailable')).toBeInTheDocument();
  });
});

describe('FormErrorBoundary', () => {
  it('should render form-specific error message', () => {
    render(
      <FormErrorBoundary formName="contact">
        <ThrowError />
      </FormErrorBoundary>
    );

    expect(screen.getByText('contact Error')).toBeInTheDocument();
    expect(screen.getByText(/The form encountered an error/)).toBeInTheDocument();
  });

  it('should have refresh and contact support buttons', () => {
    render(
      <FormErrorBoundary>
        <ThrowError />
      </FormErrorBoundary>
    );

    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });
});

describe('AsyncErrorBoundary', () => {
  it('should render async operation error message', () => {
    render(
      <AsyncErrorBoundary operationName="Data Loading">
        <ThrowError />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Data Loading Failed')).toBeInTheDocument();
    expect(screen.getByText(/The operation couldn't complete successfully/)).toBeInTheDocument();
  });

  it('should reset when resetKeys change', () => {
    const { rerender } = render(
      <AsyncErrorBoundary resetKeys={['key1']}>
        <ThrowError />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText(/Operation Failed/)).toBeInTheDocument();

    // Change reset key - should reset the error boundary
    rerender(
      <AsyncErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});

describe('AnalyticsErrorBoundary', () => {
  it('should fail silently and render nothing', () => {
    const { container } = render(
      <AnalyticsErrorBoundary service="test-analytics">
        <ThrowError />
      </AnalyticsErrorBoundary>
    );

    // Should render nothing (null fallback)
    expect(container.firstChild).toBeNull();
  });

  it('should log warning to console', () => {
    render(
      <AnalyticsErrorBoundary service="test-analytics">
        <ThrowError />
      </AnalyticsErrorBoundary>
    );

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Analytics service (test-analytics) failed:'),
      'Test error'
    );
  });
});

describe('Error Boundary Integration', () => {
  it('should handle nested error boundaries', () => {
    render(
      <ErrorBoundary level="app">
        <RouteErrorBoundary routeName="test">
          <FeatureErrorBoundary featureName="Test Feature">
            <ThrowError />
          </FeatureErrorBoundary>
        </RouteErrorBoundary>
      </ErrorBoundary>
    );

    // Should be caught by the most specific boundary (FeatureErrorBoundary)
    expect(screen.getByText('Test Feature Temporarily Unavailable')).toBeInTheDocument();
  });

  it('should escalate to parent boundary when child boundary fails', () => {
    const FailingErrorBoundary = () => {
      throw new Error('Error boundary itself failed');
    };

    render(
      <ErrorBoundary level="app">
        <FailingErrorBoundary />
      </ErrorBoundary>
    );

    // Should be caught by the app-level boundary
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});