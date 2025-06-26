import { useEffect } from 'react';
import type { CookieBannerProps } from '~/types/cookies';
import { Button } from './Button';

// Simple debug utility
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

interface ExtendedCookieBannerProps extends CookieBannerProps {
  isVisible?: boolean;
}

export function CookieBanner({ 
  onAcceptAll, 
  onRejectAll, 
  onCustomize,
  isVisible = true 
}: ExtendedCookieBannerProps) {
  debug.log('CookieBanner', 'Component function called', { isVisible });

  useEffect(() => {
    if (isVisible) {
      debug.mark('COOKIE_BANNER_VISIBLE');
      debug.log('CookieBanner', 'Banner is now visible');
    }
  }, [isVisible]);
  
  debug.log('CookieBanner', 'Rendering banner');

  // Always render the banner content to prevent layout shifts
  // Visibility is controlled by the parent container
  return (
    <div 
      className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
      role="region"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
              By clicking &quot;Accept All&quot;, you consent to our use of cookies.{' '}
              <a 
                href="/privacy-policy" 
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                tabIndex={isVisible ? 0 : -1}
              >
                Learn more
              </a>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onCustomize}
              className="w-full sm:w-auto"
              tabIndex={isVisible ? 0 : -1}
              aria-label="Customize cookie preferences"
            >
              Customize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRejectAll}
              className="w-full sm:w-auto"
              tabIndex={isVisible ? 0 : -1}
              aria-label="Reject all cookies"
            >
              Reject All
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAcceptAll}
              className="w-full sm:w-auto"
              tabIndex={isVisible ? 0 : -1}
              aria-label="Accept all cookies"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 