import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { CookieConsent } from '~/types/cookies';
import { 
  loadConsent, 
  saveConsent, 
  getDefaultConsent, 
  isConsentRequired,
  revokeConsent,
} from '~/utils/cookies';
import { useIsMounted, useEventListener } from '~/utils/ssr';

interface CookieConsentContextType {
  consent: CookieConsent;
  isConsentRequired: boolean;
  showBanner: boolean;
  showModal: boolean;
  isInitialized: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  updateConsent: (newConsent: Partial<CookieConsent>) => void;
  openModal: () => void;
  closeModal: () => void;
  revokeConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}

interface CookieConsentProviderProps {
  children: ReactNode;
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [consent, setConsent] = useState<CookieConsent>(getDefaultConsent());
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isMounted = useIsMounted();

  // Initialize consent state after mounting (client-side only)
  useEffect(() => {
    if (!isMounted) return;

    // Load consent on mount
    const savedConsent = loadConsent();
    const required = isConsentRequired();
    
    if (savedConsent) {
      setConsent(savedConsent);
      setShowBanner(false);
    } else {
      setShowBanner(required);
    }
    
    setIsRequired(required);
    setIsInitialized(true);
  }, [isMounted]);

  // Handle consent events using SSR-safe event listeners
  const handleConsentUpdated = useCallback((event: CustomEvent<CookieConsent>) => {
    setConsent(event.detail);
    setShowBanner(false);
    setShowModal(false);
    setIsRequired(false);
  }, []);

  const handleConsentRevoked = useCallback(() => {
    setConsent(getDefaultConsent());
    setShowBanner(true);
    setShowModal(false);
    setIsRequired(true);
  }, []);

  // Handle consent events using custom event types
  useEffect(() => {
    if (!isMounted) return;

    const handleConsentUpdatedEvent = handleConsentUpdated as EventListener;
    const handleConsentRevokedEvent = handleConsentRevoked as EventListener;

    window.addEventListener('cookieConsentUpdated', handleConsentUpdatedEvent);
    window.addEventListener('cookieConsentRevoked', handleConsentRevokedEvent);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdatedEvent);
      window.removeEventListener('cookieConsentRevoked', handleConsentRevokedEvent);
    };
  }, [isMounted, handleConsentUpdated, handleConsentRevoked]);

  const acceptAll = () => {
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
  };

  const rejectAll = () => {
    const minimalConsent = getDefaultConsent();
    
    saveConsent(minimalConsent);
    setConsent(minimalConsent);
    setShowBanner(false);
    setShowModal(false);
    setIsRequired(false);
  };

  const updateConsent = (newConsent: Partial<CookieConsent>) => {
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
  };

  const openModal = () => {
    setShowModal(true);
    setShowBanner(false);
  };

  const closeModal = () => {
    setShowModal(false);
    if (isRequired) {
      setShowBanner(true);
    }
  };

  const handleRevokeConsent = () => {
    revokeConsent();
    setConsent(getDefaultConsent());
    setShowBanner(true);
    setShowModal(false);
    setIsRequired(true);
  };

  const value: CookieConsentContextType = {
    consent,
    isConsentRequired: isRequired,
    showBanner: isMounted && showBanner, // Only show banner after mounting
    showModal: isMounted && showModal, // Only show modal after mounting
    isInitialized,
    acceptAll,
    rejectAll,
    updateConsent,
    openModal,
    closeModal,
    revokeConsent: handleRevokeConsent,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
} 