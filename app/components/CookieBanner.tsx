import { useEffect, useState } from 'react';
import type { CookieBannerProps } from '~/types/cookies';
import { Button } from './Button';

export function CookieBanner({ onAcceptAll, onRejectAll, onCustomize }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to prevent layout shift
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
              By clicking "Accept All", you consent to our use of cookies.{' '}
              <a 
                href="/privacy-policy" 
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
            >
              Customize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRejectAll}
              className="w-full sm:w-auto"
            >
              Reject All
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAcceptAll}
              className="w-full sm:w-auto"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 