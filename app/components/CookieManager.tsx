import { useCookieConsent } from '~/contexts/CookieConsentContext';
import { CookieBanner } from './CookieBanner';
import { CookieConsentModal } from './CookieConsentModal';

// Simple debug utility to replace initTimer
const debug = {
  log: (component: string, message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.log(`[${component}] ${message}`, data);
    }
  },
  mark: (name: string) => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.performance) {
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

  // Always render the container to prevent layout shifts
  // Use CSS classes to control visibility and transitions
  return (
    <>
      {/* Cookie Banner with loading state and smooth animations */}
      <div 
        className={`
          cookie-banner-container 
          ${isInitialized ? 'initialized' : 'loading'}
          ${isInitialized && showBanner ? 'cookie-banner-enter' : 'cookie-banner-exit'}
          fixed bottom-0 left-0 right-0 z-50
        `}
        style={{
          // Additional inline styles for browsers that don't support CSS @layer
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transform: isInitialized && showBanner ? 'translateY(0)' : 'translateY(100%)',
          opacity: isInitialized && showBanner ? 1 : 0,
          pointerEvents: isInitialized && showBanner ? 'auto' : 'none',
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
        }}
        aria-hidden={!isInitialized || !showBanner}
        role={isInitialized && showBanner ? 'banner' : 'presentation'}
      >
        {/* Always render CookieBanner but control its visibility with props */}
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