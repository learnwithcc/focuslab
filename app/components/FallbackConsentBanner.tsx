import { useState, useEffect } from 'react';
import { initTimer } from '~/utils/ssr';
import type { CookieConsent } from '~/types/cookies';

interface FallbackConsentBannerProps {
  onAccept?: () => void;
  onReject?: () => void;
}

/**
 * Minimal fallback consent banner that works without any external dependencies.
 * Used when the main consent system fails to initialize.
 */
export function FallbackConsentBanner({ onAccept, onReject }: FallbackConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if consent already exists
    try {
      const existingConsent = localStorage.getItem('cookie-consent');
      if (!existingConsent) {
        setIsVisible(true);
        initTimer.log('FallbackConsentBanner', 'No existing consent found, showing banner');
      } else {
        initTimer.log('FallbackConsentBanner', 'Existing consent found, hiding banner');
      }
    } catch (error) {
      // If we can't even check localStorage, show the banner
      setIsVisible(true);
      initTimer.log('FallbackConsentBanner', 'Error checking consent, showing banner', { error });
    }
  }, []);

  const saveConsent = async (consent: CookieConsent) => {
    setIsSaving(true);
    
    try {
      // Try to save to localStorage
      localStorage.setItem('cookie-consent', JSON.stringify(consent));
      
      // Try to dispatch event
      try {
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
          detail: consent,
        }));
      } catch (eventError) {
        initTimer.log('FallbackConsentBanner', 'Failed to dispatch event', { eventError });
      }

      setIsVisible(false);
      initTimer.log('FallbackConsentBanner', 'Consent saved successfully', { consent });
      
      // Reload page to reinitialize with proper consent
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      initTimer.log('FallbackConsentBanner', 'Failed to save consent', { error });
      alert('Unable to save your cookie preferences. Please try again or contact support.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptAll = async () => {
    initTimer.log('FallbackConsentBanner', 'Accept all clicked');
    
    const consent: CookieConsent = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      version: '1.0.0',
    };

    await saveConsent(consent);
    onAccept?.();
  };

  const handleRejectAll = async () => {
    initTimer.log('FallbackConsentBanner', 'Reject all clicked');
    
    const consent: CookieConsent = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      version: '1.0.0',
    };

    await saveConsent(consent);
    onReject?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t-2 border-yellow-400 dark:border-yellow-600 shadow-lg"
      role="alert"
      aria-live="polite"
      aria-label="Cookie consent notice"
    >
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Cookie Notice (Emergency Mode)
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We use cookies to enhance your experience. Due to a technical issue, we're showing you a simplified consent option. 
              You can manage detailed preferences later.
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Essential cookies are always enabled. By clicking "Accept All", you also consent to functional, analytics, and marketing cookies.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleRejectAll}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Reject all non-essential cookies"
            >
              {isSaving ? 'Saving...' : 'Reject All'}
            </button>
            
            <button
              onClick={handleAcceptAll}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Accept all cookies"
            >
              {isSaving ? 'Saving...' : 'Accept All'}
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a>
          {' · '}
          <a href="/cookies" className="underline hover:no-underline">Cookie Policy</a>
        </div>
      </div>
    </div>
  );
}