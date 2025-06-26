import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { CookieConsent } from '~/types/cookies';
import { 
  loadConsent, 
  saveConsent, 
  getDefaultConsent, 
  isConsentRequired,
  revokeConsent,
} from '~/utils/cookies';
import { useIsMounted, initTimer } from '~/utils/ssr';
import {
  createConsentError,
  logConsentError,
  attemptConsentRecovery,
  createEmergencyConsent,
  isConsentEnvironmentSupported,
  type ConsentError,
} from '~/utils/consent-error-handling';
import { FallbackConsentBanner } from '~/components/FallbackConsentBanner';

interface SafeCookieConsentContextType {
  consent: CookieConsent;
  isConsentRequired: boolean;
  showBanner: boolean;
  showModal: boolean;
  isInitialized: boolean;
  hasError: boolean;
  error: ConsentError | null;
  acceptAll: () => void;
  rejectAll: () => void;
  updateConsent: (newConsent: Partial<CookieConsent>) => void;
  openModal: () => void;
  closeModal: () => void;
  revokeConsent: () => void;
  retryInitialization: () => void;
}

const SafeCookieConsentContext = createContext<SafeCookieConsentContextType | null>(null);

export function useSafeCookieConsent() {
  const context = useContext(SafeCookieConsentContext);
  if (!context) {
    // Create a safe error instead of throwing
    const error = createConsentError(
      'useSafeCookieConsent must be used within a SafeCookieConsentProvider',
      'CONTEXT_NOT_FOUND',
      undefined,
      false
    );
    logConsentError(error);
    
    // Return emergency fallback context
    return {
      consent: createEmergencyConsent(),
      isConsentRequired: true,
      showBanner: false,
      showModal: false,
      isInitialized: false,
      hasError: true,
      error,
      acceptAll: () => {},
      rejectAll: () => {},
      updateConsent: () => {},
      openModal: () => {},
      closeModal: () => {},
      revokeConsent: () => {},
      retryInitialization: () => {},
    };
  }
  return context;
}

interface SafeCookieConsentProviderProps {
  children: ReactNode;
  fallbackMode?: boolean;
}

export function SafeCookieConsentProvider({ children, fallbackMode = false }: SafeCookieConsentProviderProps) {
  initTimer.log('SafeCookieConsentProvider', 'Component function called', { fallbackMode });
  
  const [consent, setConsent] = useState<CookieConsent>(() => {
    try {
      return getDefaultConsent();
    } catch (error) {
      logConsentError(createConsentError(
        'Failed to get default consent',
        'INITIALIZATION_FAILED',
        error instanceof Error ? error : new Error(String(error))
      ));
      return createEmergencyConsent();
    }
  });
  
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(!isConsentEnvironmentSupported());
  const [error, setError] = useState<ConsentError | null>(null);

  const isMounted = useIsMounted();

  const handleError = useCallback((consentError: ConsentError) => {
    setError(consentError);
    setHasError(true);
    logConsentError(consentError, { component: 'SafeCookieConsentProvider' });
  }, []);

  const retryInitialization = useCallback(async () => {
    initTimer.log('SafeCookieConsentProvider', 'Retrying initialization');
    
    if (error) {
      const recovered = await attemptConsentRecovery(error);
      if (recovered) {
        setError(null);
        setHasError(false);
        // Trigger re-initialization
        setIsInitialized(false);
      }
    }
  }, [error]);

  // Safe initialization with comprehensive error handling
  useEffect(() => {
    if (!isMounted || fallbackMode) {
      initTimer.log('SafeCookieConsentProvider', 'Skipping initialization', { isMounted, fallbackMode });
      return;
    }

    const initializeConsent = async () => {
      try {
        initTimer.mark('SAFE_COOKIE_CONSENT_INITIALIZATION_START');
        initTimer.log('SafeCookieConsentProvider', 'Starting safe initialization');

        // Check environment support
        if (!isConsentEnvironmentSupported()) {
          throw createConsentError(
            'Consent system not supported in this environment',
            'INITIALIZATION_FAILED',
            undefined,
            false
          );
        }

        // Load consent with error handling
        let savedConsent: CookieConsent | null = null;
        try {
          savedConsent = loadConsent();
          initTimer.log('SafeCookieConsentProvider', 'Consent loaded', { savedConsent });
        } catch (loadError) {
          throw createConsentError(
            'Failed to load saved consent',
            'STORAGE_ACCESS_DENIED',
            loadError instanceof Error ? loadError : new Error(String(loadError))
          );
        }

        // Check if consent is required
        let required: boolean;
        try {
          required = isConsentRequired();
          initTimer.log('SafeCookieConsentProvider', 'Consent requirement checked', { required });
        } catch (requiredError) {
          initTimer.log('SafeCookieConsentProvider', 'Failed to check requirement, assuming required', { requiredError });
          required = true; // Fail safe - assume consent is required
        }

        // Update state based on loaded data
        if (savedConsent) {
          setConsent(savedConsent);
          setShowBanner(false);
        } else {
          setShowBanner(required);
        }

        setIsRequired(required);
        setIsInitialized(true);
        
        initTimer.mark('SAFE_COOKIE_CONSENT_INITIALIZATION_COMPLETE');
        initTimer.log('SafeCookieConsentProvider', 'Safe initialization complete');

      } catch (initError) {
        if (initError instanceof Error && 'code' in initError) {
          handleError(initError as ConsentError);
        } else {
          handleError(createConsentError(
            'Unexpected initialization error',
            'INITIALIZATION_FAILED',
            initError instanceof Error ? initError : new Error(String(initError))
          ));
        }
      }
    };

    initializeConsent();
  }, [isMounted, fallbackMode, handleError]);

  // Safe event handlers
  const handleConsentUpdated = useCallback((event: CustomEvent<CookieConsent>) => {
    try {
      initTimer.log('SafeCookieConsentProvider', 'Consent updated event received', { detail: event.detail });
      setConsent(event.detail);
      setShowBanner(false);
      setShowModal(false);
      setIsRequired(false);
    } catch (error) {
      handleError(createConsentError(
        'Failed to handle consent update',
        'EVENT_DISPATCH_FAILED',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }, [handleError]);

  const handleConsentRevoked = useCallback(() => {
    try {
      initTimer.log('SafeCookieConsentProvider', 'Consent revoked event received');
      setConsent(getDefaultConsent());
      setShowBanner(true);
      setShowModal(false);
      setIsRequired(true);
    } catch (error) {
      handleError(createConsentError(
        'Failed to handle consent revocation',
        'EVENT_DISPATCH_FAILED',
        error instanceof Error ? error : new Error(String(error))
      ));
      // Fallback to emergency consent
      setConsent(createEmergencyConsent());
    }
  }, [handleError]);

  // Safe event listener setup
  useEffect(() => {
    if (!isMounted || hasError) {
      return;
    }

    try {
      const handleConsentUpdatedEvent = handleConsentUpdated as EventListener;
      const handleConsentRevokedEvent = handleConsentRevoked as EventListener;

      window.addEventListener('cookieConsentUpdated', handleConsentUpdatedEvent);
      window.addEventListener('cookieConsentRevoked', handleConsentRevokedEvent);

      return () => {
        window.removeEventListener('cookieConsentUpdated', handleConsentUpdatedEvent);
        window.removeEventListener('cookieConsentRevoked', handleConsentRevokedEvent);
      };
    } catch (error) {
      handleError(createConsentError(
        'Failed to setup event listeners',
        'EVENT_DISPATCH_FAILED',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }, [isMounted, hasError, handleConsentUpdated, handleConsentRevoked, handleError]);

  // Safe consent actions
  const acceptAll = useCallback(() => {
    try {
      const fullConsent: CookieConsent = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      saveConsent(fullConsent);
      setConsent(fullConsent);
      setShowBanner(false);
      setShowModal(false);
      setIsRequired(false);
    } catch (error) {
      handleError(createConsentError(
        'Failed to accept all cookies',
        'STORAGE_ACCESS_DENIED',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }, [handleError]);

  const rejectAll = useCallback(() => {
    try {
      const minimalConsent = getDefaultConsent();
      
      saveConsent(minimalConsent);
      setConsent(minimalConsent);
      setShowBanner(false);
      setShowModal(false);
      setIsRequired(false);
    } catch (error) {
      handleError(createConsentError(
        'Failed to reject all cookies',
        'STORAGE_ACCESS_DENIED',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }, [handleError]);

  const updateConsent = useCallback((newConsent: Partial<CookieConsent>) => {
    try {
      const updatedConsent: CookieConsent = {
        ...consent,
        ...newConsent,
        essential: true, // Always true
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      saveConsent(updatedConsent);
      setConsent(updatedConsent);
      setShowBanner(false);
      setShowModal(false);
      setIsRequired(false);
    } catch (error) {
      handleError(createConsentError(
        'Failed to update consent',
        'STORAGE_ACCESS_DENIED',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }, [consent, handleError]);

  const openModal = useCallback(() => {
    try {
      setShowModal(true);
      setShowBanner(false);
    } catch (error) {
      handleError(createConsentError(
        'Failed to open modal',
        'UNEXPECTED_ERROR',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }, [handleError]);

  const closeModal = useCallback(() => {
    try {
      setShowModal(false);
      if (isRequired) {
        setShowBanner(true);
      }
    } catch (error) {
      handleError(createConsentError(
        'Failed to close modal',
        'UNEXPECTED_ERROR',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }, [isRequired, handleError]);

  const handleRevokeConsent = useCallback(() => {
    try {
      revokeConsent();
      setConsent(getDefaultConsent());
      setShowBanner(true);
      setShowModal(false);
      setIsRequired(true);
    } catch (error) {
      handleError(createConsentError(
        'Failed to revoke consent',
        'STORAGE_ACCESS_DENIED',
        error instanceof Error ? error : new Error(String(error))
      ));
      // Fallback to emergency state
      setConsent(createEmergencyConsent());
      setShowBanner(true);
      setShowModal(false);
      setIsRequired(true);
    }
  }, [handleError]);

  const computedShowBanner = isMounted && showBanner && !hasError;
  const computedShowModal = isMounted && showModal && !hasError;

  const value: SafeCookieConsentContextType = {
    consent,
    isConsentRequired: isRequired,
    showBanner: computedShowBanner,
    showModal: computedShowModal,
    isInitialized,
    hasError,
    error,
    acceptAll,
    rejectAll,
    updateConsent,
    openModal,
    closeModal,
    revokeConsent: handleRevokeConsent,
    retryInitialization,
  };

  return (
    <SafeCookieConsentContext.Provider value={value}>
      {children}
      {/* Show fallback banner when there's an error and no other consent UI is available */}
      {hasError && !computedShowBanner && !computedShowModal && (
        <FallbackConsentBanner
          onAccept={() => {
            try {
              acceptAll();
              setHasError(false);
              setError(null);
            } catch {
              // Fallback banner will handle errors
            }
          }}
          onReject={() => {
            try {
              rejectAll();
              setHasError(false);
              setError(null);
            } catch {
              // Fallback banner will handle errors
            }
          }}
        />
      )}
    </SafeCookieConsentContext.Provider>
  );
}