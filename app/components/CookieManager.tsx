import { useCookieConsent } from '~/contexts/CookieConsentContext';
import { CookieBanner } from './CookieBanner';
import { CookieConsentModal } from './CookieConsentModal';

export function CookieManager() {
  const {
    showBanner,
    showModal,
    acceptAll,
    rejectAll,
    updateConsent,
    openModal,
    closeModal,
  } = useCookieConsent();

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