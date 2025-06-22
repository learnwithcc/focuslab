export type CookieCategory = 'essential' | 'analytics' | 'marketing' | 'functional';

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: number;
  version: string;
}

export interface CookieInfo {
  name: string;
  category: CookieCategory;
  description: string;
  duration: string;
  purpose: string;
}

export interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: (consent: Partial<CookieConsent>) => void;
}

export interface CookieBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
} 