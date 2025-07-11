import { useState } from 'react';
import type { ConsentModalProps, CookieConsent } from '~/types/cookies';
import { COOKIE_CATEGORIES, COOKIE_DETAILS, getDefaultConsent } from '~/utils/cookies';
import { Modal } from './Modal';
import { Button } from './Button';

export function CookieConsentModal({ 
  isOpen, 
  onClose, 
  onAcceptAll, 
  onRejectAll, 
  onCustomize 
}: ConsentModalProps) {
  const [consent, setConsent] = useState<CookieConsent>(getDefaultConsent());

  const handleCategoryToggle = (category: keyof CookieConsent) => {
    if (category === 'essential' || category === 'timestamp' || category === 'version') return;
    
    setConsent(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSavePreferences = () => {
    onCustomize(consent);
    onClose();
  };

  const handleAcceptAll = () => {
    const allAccepted: CookieConsent = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      version: '1.0.0'
    };
    setConsent(allAccepted);
    onAcceptAll();
    onClose();
  };

  const handleRejectAll = () => {
    const onlyEssential = getDefaultConsent();
    setConsent(onlyEssential);
    onRejectAll();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Cookie Preferences"
      size="lg"
    >
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We respect your privacy and are committed to protecting your personal data. 
            You can choose which types of cookies you want to allow. Please note that blocking 
            some types of cookies may impact your experience on our website.
          </p>
        </div>

        <form>
          <fieldset className="space-y-4">
            <legend className="sr-only">Cookie consent preferences by category</legend>
            {Object.entries(COOKIE_CATEGORIES).map(([category, info]) => {
              const isEssential = category === 'essential';
              const isEnabled = consent[category as keyof CookieConsent] as boolean;
              const toggleId = `cookie-toggle-${category}`;
              const descriptionId = `cookie-description-${category}`;
              
              return (
                <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        <label htmlFor={toggleId} className="cursor-pointer">
                          {info.title}
                          {isEssential && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                              (Always active)
                            </span>
                          )}
                        </label>
                      </h3>
                    </div>
                    <div className="relative inline-flex items-center">
                      <input
                        id={toggleId}
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleCategoryToggle(category as keyof CookieConsent)}
                        disabled={isEssential}
                        className="sr-only peer"
                        aria-describedby={descriptionId}
                        aria-label={isEssential ? `${info.title} cookies are always active and cannot be disabled` : `${isEnabled ? 'Disable' : 'Enable'} ${info.title} cookies`}
                      />
                      <div className={`
                        relative w-11 h-6 rounded-full peer transition-colors cursor-pointer
                        ${isEssential 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gray-200 dark:bg-gray-700 peer-checked:bg-blue-600'
                        }
                        ${!isEssential && 'peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800'}
                      `}>
                        <div className={`
                          absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform
                          ${isEnabled ? 'translate-x-full' : 'translate-x-0'}
                        `} />
                      </div>
                    </div>
                  </div>
                <p 
                  id={descriptionId}
                  className="text-sm text-gray-600 dark:text-gray-300 mb-3"
                >
                  {info.description}
                </p>
                
                {/* Show relevant cookies for this category */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cookies in this category:
                  </h4>
                  <div className="space-y-1">
                    {COOKIE_DETAILS
                      .filter(cookie => cookie.category === category)
                      .map(cookie => (
                        <div key={cookie.name} className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-mono font-medium">{cookie.name}</span>
                          <span className="ml-2">({cookie.duration})</span>
                          <span className="ml-2">- {cookie.description}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                </div>
              );
            })}
          </fieldset>
        </form>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex flex-col sm:flex-row gap-3" role="group" aria-label="Cookie consent actions">
            <Button
              variant="outline"
              onClick={handleRejectAll}
              className="w-full sm:w-auto"
              aria-describedby="reject-help"
            >
              Reject All
            </Button>
            <div id="reject-help" className="sr-only">
              Reject all non-essential cookies. Only essential cookies required for basic site functionality will be used.
            </div>
            <Button
              variant="outline"
              onClick={handleSavePreferences}
              className="w-full sm:w-auto"
              aria-describedby="save-help"
            >
              Save Preferences
            </Button>
            <div id="save-help" className="sr-only">
              Save your current cookie preferences as selected above.
            </div>
            <Button
              variant="primary"
              onClick={handleAcceptAll}
              className="w-full sm:w-auto"
              aria-describedby="accept-help"
            >
              Accept All
            </Button>
            <div id="accept-help" className="sr-only">
              Accept all cookie categories including analytics and marketing cookies.
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            You can change your preferences at any time by visiting our{' '}
            <a href="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </a>{' '}
            page.
          </p>
        </div>
      </div>
    </Modal>
  );
} 