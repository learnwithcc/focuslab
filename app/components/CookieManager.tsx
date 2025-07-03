import { useCookieConsent } from '~/contexts/CookieConsentContext';
import { CookieBanner } from './CookieBanner';
import { CookieConsentModal } from './CookieConsentModal';

// Simple debug utility to replace initTimer
const debug = {
  log: (component: string, message: string, data?: any) => {
    if (typeof window !== 'undefined' && window.ENV?.NODE_ENV === 'development') {
      console.log(`[${component}] ${message}`, data);
    }
  },
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.ENV?.NODE_ENV === 'development' && window.performance) {
      window.performance.mark(name);
    }
  }
};

export function CookieManager() {
  console.log('🎯 CookieManager: Component rendering');
  
  const {
    showBanner,
    showModal,
    isInitialized,
    acceptAll,
    rejectAll,
    updateConsent,
    openModal,
    closeModal,
  } = useCookieConsent();
  
  console.log('🎯 CookieManager: Context values', {
    showBanner,
    showModal,
    isInitialized
  });

  debug.log('CookieManager', 'Rendering cookie manager components', {
    willRenderBanner: showBanner,
    willRenderModal: showModal,
    isInitialized
  });
  
  if (showBanner) {
    debug.mark('COOKIE_BANNER_RENDER');
  }
  
  if (showModal) {
    debug.mark('COOKIE_MODAL_RENDER');
  }

  // Always render the container to prevent layout shifts during hydration
  // Start hidden and only show after initialization to prevent flash
  return (
    <>
      {/* Cookie Banner - hidden by default, shown after initialization */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 ${
          !isInitialized || !showBanner 
            ? 'translate-y-full opacity-0 pointer-events-none' 
            : 'translate-y-0 opacity-100 pointer-events-auto'
        } ${isInitialized ? 'transition-all duration-300 ease-out' : ''}`}
        aria-hidden={!isInitialized || !showBanner}
        suppressHydrationWarning
      >
        {/* Always render CookieBanner to maintain consistent DOM structure */}
        <CookieBanner
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onCustomize={openModal}
          isVisible={isInitialized && showBanner}
        />
      </div>
      
      {/* Modal doesn't need special handling as it's overlay */}
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