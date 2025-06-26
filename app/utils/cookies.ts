import type { CookieConsent, CookieCategory, CookieInfo } from '~/types/cookies';
import { safeLocalStorage, isBrowser, initTimer } from '~/utils/ssr';

const CONSENT_VERSION = '1.0.0';
const CONSENT_STORAGE_KEY = 'cookie-consent';

export const COOKIE_CATEGORIES: Record<CookieCategory, { title: string; description: string }> = {
  essential: {
    title: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website.',
  },
  functional: {
    title: 'Functional Cookies',
    description: 'These cookies enable the website to provide enhanced functionality and personalization, such as remembering your preferences and settings.',
  },
  analytics: {
    title: 'Analytics Cookies',
    description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
  },
  marketing: {
    title: 'Marketing Cookies',
    description: 'These cookies are used to track visitors across websites to display relevant and engaging advertisements.',
  },
};

export const COOKIE_DETAILS: CookieInfo[] = [
  {
    name: 'csrf-token',
    category: 'essential',
    description: 'Protects against cross-site request forgery attacks',
    duration: 'Session',
    purpose: 'Security',
  },
  {
    name: 'theme',
    category: 'functional',
    description: 'Stores your preferred color theme (light/dark)',
    duration: '1 year',
    purpose: 'User preference',
  },
  {
    name: 'cookie-consent',
    category: 'essential',
    description: 'Stores your cookie consent preferences',
    duration: '1 year',
    purpose: 'Legal compliance',
  },
];

export const getDefaultConsent = (): CookieConsent => ({
  essential: true, // Always true, cannot be disabled
  functional: false,
  analytics: false,
  marketing: false,
  timestamp: Date.now(),
  version: CONSENT_VERSION,
});

export const loadConsent = (): CookieConsent | null => {
  initTimer.log('cookies', 'loadConsent called - accessing localStorage');
  try {
    const stored = safeLocalStorage.getItem(CONSENT_STORAGE_KEY);
    initTimer.log('cookies', 'localStorage access result', { stored, hasValue: !!stored });
    
    if (!stored) {
      initTimer.log('cookies', 'No stored consent found');
      return null;
    }
    
    const consent = JSON.parse(stored) as CookieConsent;
    initTimer.log('cookies', 'Parsed consent data', { consent });
    
    // Check if consent is from current version
    if (consent.version !== CONSENT_VERSION) {
      initTimer.log('cookies', 'Consent version mismatch', { stored: consent.version, current: CONSENT_VERSION });
      return null;
    }
    
    // Check if consent is not older than 1 year
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
    if (consent.timestamp < oneYearAgo) {
      initTimer.log('cookies', 'Consent expired', { timestamp: consent.timestamp, oneYearAgo });
      return null;
    }
    
    initTimer.log('cookies', 'Valid consent loaded successfully', { consent });
    return consent;
  } catch (error) {
    initTimer.log('cookies', 'Failed to load cookie consent', { error });
    return null;
  }
};

export const saveConsent = (consent: CookieConsent): void => {
  initTimer.log('cookies', 'saveConsent called', { consent });
  try {
    if (!isBrowser) {
      initTimer.log('cookies', 'Not in browser, skipping save');
      return;
    }
    
    const consentWithMeta = {
      ...consent,
      essential: true, // Always true
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    
    initTimer.log('cookies', 'Saving consent to localStorage', { consentWithMeta });
    safeLocalStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentWithMeta));
    initTimer.log('cookies', 'Consent saved successfully');
    
    // Trigger custom event for other parts of the app
    initTimer.log('cookies', 'Dispatching cookieConsentUpdated event');
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
      detail: consentWithMeta,
    }));
    initTimer.log('cookies', 'Event dispatched successfully');
  } catch (error) {
    initTimer.log('cookies', 'Failed to save cookie consent', { error });
  }
};

export const hasConsent = (category: CookieCategory): boolean => {
  const consent = loadConsent();
  if (!consent) return false;
  
  // Essential cookies are always allowed
  if (category === 'essential') return true;
  
  return consent[category] || false;
};

export const revokeConsent = (): void => {
  try {
    if (!isBrowser) return;
    
    safeLocalStorage.removeItem(CONSENT_STORAGE_KEY);
    
    // Clear non-essential cookies
    const cookies = document.cookie.split(';');
    
    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Don't remove essential cookies
      if (!['csrf-token', 'cookie-consent'].includes(name)) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      }
    });
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('cookieConsentRevoked'));
  } catch (error) {
    console.error('Failed to revoke cookie consent:', error);
  }
};

export const isConsentRequired = (): boolean => {
  initTimer.log('cookies', 'isConsentRequired called');
  const consent = loadConsent();
  const required = consent === null;
  initTimer.log('cookies', 'Consent requirement check result', { required, hasConsent: !!consent });
  return required;
};

export const getConsentStatus = (): CookieConsent => {
  return loadConsent() || getDefaultConsent();
}; 