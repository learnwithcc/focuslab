import { createContext, useContext, useEffect, useCallback, type ReactNode, startTransition, useReducer } from 'react';
import type { CookieConsent } from '~/types/cookies';
import { 
  loadConsent, 
  saveConsent, 
  getDefaultConsent, 
  isConsentRequired,
  revokeConsent,
} from '~/utils/cookies';
import { isBrowser } from '~/utils/ssr';

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

// Atomic state management to prevent race conditions
interface ConsentState {
  consent: CookieConsent;
  showBanner: boolean;
  showModal: boolean;
  isRequired: boolean;
  isInitialized: boolean;
}

type ConsentAction = 
  | { type: 'INITIALIZE'; payload: { consent: CookieConsent | null; isRequired: boolean } }
  | { type: 'UPDATE_CONSENT'; payload: CookieConsent }
  | { type: 'SHOW_MODAL' }
  | { type: 'HIDE_MODAL' }
  | { type: 'REVOKE' };

function consentReducer(state: ConsentState, action: ConsentAction): ConsentState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        consent: action.payload.consent || getDefaultConsent(),
        showBanner: action.payload.isRequired && !action.payload.consent,
        isRequired: action.payload.isRequired,
        isInitialized: true,
      };
    case 'UPDATE_CONSENT':
      return {
        ...state,
        consent: action.payload,
        showBanner: false,
        showModal: false,
        isRequired: false,
      };
    case 'SHOW_MODAL':
      return {
        ...state,
        showModal: true,
        showBanner: false,
      };
    case 'HIDE_MODAL':
      return {
        ...state,
        showModal: false,
        showBanner: state.isRequired,
      };
    case 'REVOKE':
      return {
        ...state,
        consent: getDefaultConsent(),
        showBanner: true,
        showModal: false,
        isRequired: true,
      };
    default:
      return state;
  }
}

// SSR-safe initialization function
function getInitialState(): ConsentState {
  // ALWAYS return the same state for server and client to prevent hydration mismatch
  return {
    consent: getDefaultConsent(),
    showBanner: false,
    showModal: false,
    isRequired: false,
    isInitialized: false,
  };
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  console.log('🍪 CookieConsentProvider: Component rendering');
  
  // Use reducer for atomic state updates
  const [state, dispatch] = useReducer(consentReducer, null, getInitialState);
  
  console.log('🍪 CookieConsentProvider: Initial state:', state);

  // Re-initialize on client if SSR state was used
  useEffect(() => {
    console.log('🍪 CookieConsentProvider: useEffect called', { 
      isInitialized: state.isInitialized, 
      isBrowser 
    });
    
    if (!state.isInitialized && isBrowser) {
      console.log('🍪 CookieConsentProvider: Starting initialization...');
      
      // Use startTransition for non-urgent updates
      startTransition(() => {
        const savedConsent = loadConsent();
        const required = isConsentRequired();
        
        console.log('🍪 CookieConsentProvider: Initialization values', { 
          savedConsent, 
          required 
        });
        
        dispatch({ 
          type: 'INITIALIZE', 
          payload: { consent: savedConsent, isRequired: required } 
        });
        
        console.log('🍪 CookieConsentProvider: Dispatched INITIALIZE action');
      });
    }
  }, [state.isInitialized]);

  // Handle consent events using SSR-safe event listeners
  const handleConsentUpdated = useCallback((event: CustomEvent<CookieConsent>) => {
    dispatch({ type: 'UPDATE_CONSENT', payload: event.detail });
  }, []);

  const handleConsentRevoked = useCallback(() => {
    dispatch({ type: 'REVOKE' });
  }, []);

  // Handle consent events using custom event types
  useEffect(() => {
    if (!isBrowser) return;

    const handleConsentUpdatedEvent = handleConsentUpdated as EventListener;
    const handleConsentRevokedEvent = handleConsentRevoked as EventListener;

    window.addEventListener('cookieConsentUpdated', handleConsentUpdatedEvent);
    window.addEventListener('cookieConsentRevoked', handleConsentRevokedEvent);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdatedEvent);
      window.removeEventListener('cookieConsentRevoked', handleConsentRevokedEvent);
    };
  }, [handleConsentUpdated, handleConsentRevoked]);

  const acceptAll = useCallback(() => {
    const fullConsent: CookieConsent = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      version: '1.0.0',
    };
    
    saveConsent(fullConsent);
    dispatch({ type: 'UPDATE_CONSENT', payload: fullConsent });
  }, []);

  const rejectAll = useCallback(() => {
    const minimalConsent = getDefaultConsent();
    
    saveConsent(minimalConsent);
    dispatch({ type: 'UPDATE_CONSENT', payload: minimalConsent });
  }, []);

  const updateConsent = useCallback((newConsent: Partial<CookieConsent>) => {
    const updatedConsent: CookieConsent = {
      ...state.consent,
      ...newConsent,
      essential: true, // Always true
      timestamp: Date.now(),
      version: '1.0.0',
    };
    
    saveConsent(updatedConsent);
    dispatch({ type: 'UPDATE_CONSENT', payload: updatedConsent });
  }, [state.consent]);

  const openModal = useCallback(() => {
    dispatch({ type: 'SHOW_MODAL' });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'HIDE_MODAL' });
  }, []);

  const handleRevokeConsent = useCallback(() => {
    revokeConsent();
    dispatch({ type: 'REVOKE' });
  }, []);

  const value: CookieConsentContextType = {
    consent: state.consent,
    isConsentRequired: state.isRequired,
    showBanner: state.showBanner,
    showModal: state.showModal,
    isInitialized: state.isInitialized,
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