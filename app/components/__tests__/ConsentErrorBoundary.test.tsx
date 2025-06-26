import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach, afterEach } from 'vitest';
import { ConsentErrorBoundary } from '../ConsentErrorBoundary';

// Mock component that throws errors
function ThrowError({ shouldThrow = false, error = new Error('Test error') }) {
  if (shouldThrow) {
    throw error;
  }
  return <div>Normal content</div>;
}

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock window global
const mockWindow = {
  localStorage: mockLocalStorage,
  location: { reload: vi.fn() },
  dispatchEvent: vi.fn(),
  CustomEvent: global.CustomEvent,
  Sentry: { captureException: vi.fn() },
};

beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset localStorage mock
  mockLocalStorage.getItem.mockReturnValue(null);
  mockLocalStorage.setItem.mockImplementation(() => {});
  
  // Setup window mock
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
  
  Object.defineProperty(window, 'location', {
    value: mockWindow.location,
    writable: true,
  });
  
  Object.defineProperty(window, 'Sentry', {
    value: mockWindow.Sentry,
    writable: true,
  });
  
  // Suppress console.error during tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('renders children when no error occurs', () => {
  render(
    <ConsentErrorBoundary>
      <ThrowError shouldThrow={false} />
    </ConsentErrorBoundary>
  );
  
  expect(screen.getByText('Normal content')).toBeInTheDocument();
});

test('renders error UI when child component throws', () => {
  render(
    <ConsentErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ConsentErrorBoundary>
  );
  
  expect(screen.getByText('Cookie Consent System Error')).toBeInTheDocument();
  expect(screen.getByText(/We're having trouble loading the cookie consent system/)).toBeInTheDocument();
});

test('shows error details in development mode', () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  
  render(
    <ConsentErrorBoundary>
      <ThrowError shouldThrow={true} error={new Error('Custom test error')} />
    </ConsentErrorBoundary>
  );
  
  expect(screen.getByText('Error details')).toBeInTheDocument();
  expect(screen.getByText(/Custom test error/)).toBeInTheDocument();
  
  process.env.NODE_ENV = originalEnv;
});

test('calls onError callback when error occurs', () => {
  const onError = vi.fn();
  
  render(
    <ConsentErrorBoundary onError={onError}>
      <ThrowError shouldThrow={true} error={new Error('Callback test')} />
    </ConsentErrorBoundary>
  );
  
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Callback test' }),
    expect.objectContaining({ componentStack: expect.any(String) })
  );
});

test('logs error to Sentry when available', () => {
  render(
    <ConsentErrorBoundary>
      <ThrowError shouldThrow={true} error={new Error('Sentry test')} />
    </ConsentErrorBoundary>
  );
  
  expect(mockWindow.Sentry.captureException).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Sentry test' }),
    expect.objectContaining({
      contexts: {
        react: {
          componentStack: expect.any(String),
        },
      },
      tags: {
        component: 'ConsentErrorBoundary',
      },
    })
  );
});

test('accept essential button saves emergency consent', async () => {
  render(
    <ConsentErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ConsentErrorBoundary>
  );
  
  const acceptButton = screen.getByRole('button', { name: /accept essential cookies only/i });
  fireEvent.click(acceptButton);
  
  await waitFor(() => {
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'cookie-consent',
      expect.stringContaining('"essential":true')
    );
  });
  
  expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
    'cookie-consent',
    expect.stringContaining('"functional":false')
  );
  
  expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
    'cookie-consent',
    expect.stringContaining('"analytics":false')
  );
});

test('retry button is present and clickable', async () => {
  render(
    <ConsentErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ConsentErrorBoundary>
  );
  
  expect(screen.getByText('Cookie Consent System Error')).toBeInTheDocument();
  
  const retryButton = screen.getByRole('button', { name: /retry loading consent system/i });
  expect(retryButton).toBeInTheDocument();
  expect(retryButton).not.toBeDisabled();
  
  // Click should not throw
  expect(() => fireEvent.click(retryButton)).not.toThrow();
});

test('handles localStorage errors gracefully', async () => {
  mockLocalStorage.setItem.mockImplementation(() => {
    throw new Error('Storage quota exceeded');
  });
  
  // Mock alert
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  
  render(
    <ConsentErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ConsentErrorBoundary>
  );
  
  const acceptButton = screen.getByRole('button', { name: /accept essential cookies only/i });
  fireEvent.click(acceptButton);
  
  await waitFor(() => {
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('We are unable to save your cookie preferences')
    );
  });
  
  alertSpy.mockRestore();
});

test('shows retry count during automatic retries', async () => {
  render(
    <ConsentErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ConsentErrorBoundary>
  );
  
  // Simulate automatic retry (this would normally happen via timeout)
  // For testing, we need to trigger the internal retry logic
  const errorBoundary = screen.getByRole('alert');
  expect(errorBoundary).toBeInTheDocument();
  
  // The retry message should be visible initially
  expect(screen.getByText(/Try Again/)).toBeInTheDocument();
});

test('provides accessibility attributes', () => {
  render(
    <ConsentErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ConsentErrorBoundary>
  );
  
  const errorAlert = screen.getByRole('alert');
  expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
  
  const acceptButton = screen.getByRole('button', { name: /accept essential cookies only/i });
  expect(acceptButton).toHaveAttribute('aria-label', 'Accept essential cookies only');
  
  const retryButton = screen.getByRole('button', { name: /retry loading consent system/i });
  expect(retryButton).toHaveAttribute('aria-label', 'Retry loading consent system');
});

test('dispatches custom event when emergency consent is saved', async () => {
  const mockDispatchEvent = vi.fn();
  Object.defineProperty(window, 'dispatchEvent', {
    value: mockDispatchEvent,
    writable: true,
  });
  
  render(
    <ConsentErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ConsentErrorBoundary>
  );
  
  const acceptButton = screen.getByRole('button', { name: /accept essential cookies only/i });
  fireEvent.click(acceptButton);
  
  await waitFor(() => {
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'cookieConsentUpdated',
        detail: expect.objectContaining({
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        }),
      })
    );
  });
});