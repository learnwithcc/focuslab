import { Link } from '@remix-run/react';
import { GitHubIcon, EmailIcon, ExternalLinkIcon } from './icons';
import { trackEvent } from '~/utils/posthog';

export function Footer() {
  const handleExternalLinkClick = (destination: string, url: string) => {
    trackEvent('external_link_click', {
      destination,
      url,
      source: 'footer',
      timestamp: Date.now(),
    });
  };

  const handleInternalLinkClick = (destination: string, path: string) => {
    trackEvent('footer_link_click', {
      destination,
      path,
      timestamp: Date.now(),
    });
  };

  return (
    <footer
      role="contentinfo"
      className="bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 border-t border-purple-200 dark:border-gray-700"
    >
      {/* Let's Connect Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 text-center">
          <h2 className="mb-8 text-2xl font-bold">
            <span className="bg-gradient-to-r from-teal-primary to-primary-purple bg-clip-text text-transparent">
              Let's Connect
            </span>
          </h2>
          
          <div className="flex justify-center items-center gap-8">
            <a
              href="https://github.com/learnwithcc"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleExternalLinkClick('github', 'https://github.com/learnwithcc')}
              className="flex items-center gap-2 text-gray-700 hover:text-primary-purple dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
              aria-label="Visit our GitHub profile"
            >
              <GitHubIcon className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">GitHub</span>
            </a>
            
            <a
              href="https://learnwith.cc"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleExternalLinkClick('learnwithcc', 'https://learnwith.cc')}
              className="flex items-center gap-2 text-gray-700 hover:text-primary-purple dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
              aria-label="Visit LearnWith.cc"
            >
              <ExternalLinkIcon className="h-5 w-5" aria-hidden={true} />
              <span className="font-medium">LearnWith.cc</span>
            </a>
            
            <Link
              to="/contact"
              onClick={() => handleInternalLinkClick('contact', '/contact')}
              className="flex items-center gap-2 text-gray-700 hover:text-primary-purple dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
              aria-label="Send us an email"
            >
              <EmailIcon className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">Email</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Bottom Section */}
      <div className="border-t border-purple-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>&copy; {new Date().getFullYear()} FocusLab.io</span>
              <div className="flex items-center gap-4">
                <Link 
                  to="/privacy-policy" 
                  onClick={() => handleInternalLinkClick('privacy_policy', '/privacy-policy')}
                  className="hover:text-primary-purple dark:hover:text-gray-300 transition-colors"
                >
                  Privacy Policy
                </Link>
                <span className="text-gray-600">|</span>
                <Link 
                  to="/terms-of-service" 
                  onClick={() => handleInternalLinkClick('terms_of_service', '/terms-of-service')}
                  className="hover:text-primary-purple dark:hover:text-gray-300 transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Built for developers who think differently.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 