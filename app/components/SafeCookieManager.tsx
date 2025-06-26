import { useSafeCookieConsent } from '~/contexts/SafeCookieConsentContext';
import { CookieBanner } from './CookieBanner';
import { CookieConsentModal } from './CookieConsentModal';
import { FallbackConsentBanner } from './FallbackConsentBanner';
import { initTimer } from '~/utils/ssr';

export function SafeCookieManager() {
  initTimer.log('SafeCookieManager', 'Component function called');
  
  const {
    showBanner,
    showModal,
    isInitialized,
    hasError,
    error,
    acceptAll,
    rejectAll,
    updateConsent,
    openModal,
    closeModal,
    retryInitialization,
  } = useSafeCookieConsent();
  
  initTimer.log('SafeCookieManager', 'Safe cookie consent context values', {
    showBanner,
    showModal,
    isInitialized,
    hasError,
    errorCode: error?.code,
  });

  // If there's an error and the error is not recoverable, show fallback
  if (hasError && error && !error.recoverable) {
    initTimer.log('SafeCookieManager', 'Non-recoverable error detected, showing fallback');
    
    return (
      <FallbackConsentBanner
        onAccept={acceptAll}
        onReject={rejectAll}
      />
    );
  }

  // If there's a recoverable error, show the recovery option
  if (hasError && error && error.recoverable) {
    initTimer.log('SafeCookieManager', 'Recoverable error detected, showing recovery UI');
    
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-orange-50 dark:bg-orange-900/20 border-t border-orange-200 dark:border-orange-800"
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                Cookie System Issue
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                We're experiencing a temporary issue with the cookie consent system. You can try again or use the simplified options.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Error: {error.code} - {error.message}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={rejectAll}
                className="px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-gray-700 border border-orange-300 dark:border-orange-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                aria-label="Reject all non-essential cookies"
              >
                Essential Only
              </button>
              
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                aria-label="Accept all cookies"
              >
                Accept All
              </button>
              
              <button
                onClick={retryInitialization}
                className="px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-gray-700 border border-orange-300 dark:border-orange-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                aria-label="Retry consent system initialization"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything until the consent system is initialized
  if (!isInitialized) {
    initTimer.log('SafeCookieManager', 'Not initialized yet - returning null');
    return null;
  }
  
  initTimer.log('SafeCookieManager', 'Rendering normal cookie manager components', {
    willRenderBanner: showBanner,
    willRenderModal: showModal
  });
  
  return (
    <>
      {showBanner && (
        <CookieBanner
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onCustomize={openModal}
        />
      )}
      
      <CookieConsentModal
        isOpen={showModal}
        onClose={closeModal}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
        onCustomize={updateConsent}
      />
    </>
  );
}