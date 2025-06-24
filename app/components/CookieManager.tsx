import { useCookieConsent } from '~/contexts/CookieConsentContext';
import { CookieBanner } from './CookieBanner';
import { CookieConsentModal } from './CookieConsentModal';

export function CookieManager() {
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

  // Don't render anything until the consent system is initialized
  // This prevents hydration mismatches
  if (!isInitialized) {
    return null;
  }

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