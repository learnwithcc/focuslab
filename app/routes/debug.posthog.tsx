import { json, type MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { Button } from '~/components/Button';
import { trackEvent, identifyUser } from '~/utils/posthog';
import { useCookieConsent } from '~/contexts/CookieConsentContext';

export const meta: MetaFunction = () => {
  return [
    { title: 'PostHog Debug - Focus Lab' },
    { name: 'description', content: 'Debug page for PostHog analytics setup' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
};

export async function loader() {
  return json({
    env: {
      POSTHOG_API_KEY: process.env['POSTHOG_API_KEY'] || '',
      POSTHOG_API_HOST: process.env['POSTHOG_API_HOST'] || 'https://us.i.posthog.com',
    },
  });
}

export default function PostHogDebug() {
  const { env } = useLoaderData<typeof loader>();
  const cookieContext = useCookieConsent();
  const { consent, showBanner, showModal, isInitialized, isConsentRequired } = cookieContext;

  // Debug logging
  useEffect(() => {
    console.log('PostHog Debug - Cookie Context:', {
      consent,
      showBanner,
      showModal,
      isInitialized,
      isConsentRequired,
      fullContext: cookieContext
    });
  }, [consent, showBanner, showModal, isInitialized, isConsentRequired, cookieContext]);
  const [posthogStatus, setPosthogStatus] = useState<{
    loaded: boolean;
    apiKey: string;
    host: string;
    isOptedIn: boolean;
    distinctId: string;
  }>({
    loaded: false,
    apiKey: '',
    host: '',
    isOptedIn: false,
    distinctId: '',
  });

  const [debugInfo, setDebugInfo] = useState<{
    localStorageConsent: string | null;
    consentRequired: boolean;
    showBanner: boolean;
    showModal: boolean;
    isInitialized: boolean;
  }>({
    localStorageConsent: null,
    consentRequired: false,
    showBanner: false,
    showModal: false,
    isInitialized: false,
  });

  useEffect(() => {
    // Check PostHog status on client side
    if (typeof window !== 'undefined') {
      import('posthog-js').then((posthogModule) => {
        const posthog = posthogModule.default;
        
        setPosthogStatus({
          loaded: posthog.__loaded || false,
          apiKey: (posthog.config as any)?.api_key || 'Not initialized',
          host: (posthog.config as any)?.api_host || 'Not initialized',
          isOptedIn: !posthog.has_opted_out_capturing(),
          distinctId: posthog.get_distinct_id() || 'Not available',
        });
      });

      // Check debug info
      setDebugInfo({
        localStorageConsent: localStorage.getItem('cookie-consent'),
        consentRequired: localStorage.getItem('cookie-consent') === null,
        showBanner,
        showModal,
        isInitialized,
      });
    }
  }, []);

  const testEvent = () => {
    trackEvent('debug_test_event', {
      timestamp: Date.now(),
      page: 'debug',
      test_property: 'test_value',
    });
    alert('Test event sent! Check PostHog console logs and dashboard.');
  };

  const testIdentify = () => {
    identifyUser('debug-user-' + Date.now(), {
      email: 'debug@example.com',
      name: 'Debug User',
      source: 'debug_page',
    });
    alert('User identification sent! Check PostHog console logs and dashboard.');
  };

  const clearConsent = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cookie-consent');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            PostHog Debug Page
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Debug information for PostHog analytics setup
          </p>
        </div>

        <div className="space-y-8">
          {/* Environment Variables */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Environment Variables
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">POSTHOG_API_KEY:</span>{' '}
                <span className="text-gray-900 dark:text-white">
                  {env.POSTHOG_API_KEY ? 
                    `${env.POSTHOG_API_KEY.substring(0, 10)}...` : 
                    'Not set'
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">POSTHOG_API_HOST:</span>{' '}
                <span className="text-gray-900 dark:text-white">{env.POSTHOG_API_HOST}</span>
              </div>
            </div>
          </div>

          {/* Cookie Consent Status */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Cookie Consent Status
            </h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-2">Analytics Consent:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  consent.analytics 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {consent.analytics ? 'Granted' : 'Denied'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Timestamp: {new Date(consent.timestamp).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Version: {consent.version}
              </div>
              <div className="mt-4">
                <Button onClick={clearConsent} variant="outline" size="sm">
                  Clear Consent & Reload
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  This will force the cookie banner to show again
                </span>
              </div>
            </div>
          </div>

          {/* Cookie Banner Debug */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Cookie Banner Debug
            </h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-2">Consent Required:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  isConsentRequired 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {isConsentRequired ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-2">Show Banner:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  showBanner 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {showBanner ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-2">Show Modal:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  showModal 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {showModal ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-2">Context Initialized:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  isInitialized 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {isInitialized ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                LocalStorage Value: {debugInfo.localStorageConsent || 'null'}
              </div>
            </div>
          </div>

          {/* PostHog Status */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              PostHog Status
            </h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-2">Loaded:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  posthogStatus.loaded 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {posthogStatus.loaded ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-2">Opted In:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  posthogStatus.isOptedIn 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {posthogStatus.isOptedIn ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                API Key: {posthogStatus.apiKey}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                API Host: {posthogStatus.host}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                Distinct ID: {posthogStatus.distinctId}
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Actions
            </h2>
            <div className="space-y-4">
              <div>
                <Button onClick={testEvent} className="mr-4">
                  Send Test Event
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Sends a 'debug_test_event' to PostHog
                </span>
              </div>
              <div>
                <Button onClick={testIdentify} variant="outline">
                  Test User Identification
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                  Identifies a test user in PostHog
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
              Debugging Instructions
            </h2>
            <div className="text-blue-800 dark:text-blue-200 space-y-2">
              <p>1. <strong>Check Analytics Consent:</strong> Make sure analytics consent is granted above.</p>
              <p>2. <strong>Verify PostHog Status:</strong> PostHog should be loaded and opted in.</p>
              <p>3. <strong>Open Browser Console:</strong> Check for PostHog logs and any errors.</p>
              <p>4. <strong>Test Events:</strong> Use the test buttons above to send events.</p>
              <p>5. <strong>Check PostHog Dashboard:</strong> Log into your PostHog dashboard to see if events are appearing.</p>
              <p>6. <strong>Network Tab:</strong> Check browser dev tools Network tab for PostHog API calls.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 