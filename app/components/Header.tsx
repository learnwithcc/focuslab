import { Link } from '@remix-run/react';
import { useState } from 'react';
import { MobileThemeToggle } from './VanillaThemeToggle';
import { trackEvent } from '~/utils/posthog';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (destination: string, context: 'desktop' | 'mobile' | 'logo') => {
    trackEvent('navigation_click', {
      destination,
      context,
      timestamp: Date.now(),
    });
  };

  const handleMobileMenuToggle = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    
    trackEvent('mobile_menu_toggle', {
      action: newState ? 'open' : 'close',
      timestamp: Date.now(),
    });
  };
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center"
            onClick={() => handleNavClick('home', 'logo')}
          >
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Focus Lab
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              onClick={() => handleNavClick('home', 'desktop')}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              onClick={() => handleNavClick('about', 'desktop')}
            >
              About
            </Link>
            <Link
              to="/projects"
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              onClick={() => handleNavClick('projects', 'desktop')}
            >
              Projects
            </Link>
            <Link
              to="/contact"
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              onClick={() => handleNavClick('contact', 'desktop')}
            >
              Contact
            </Link>
          </nav>

          {/* Mobile menu and theme toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <MobileThemeToggle />
            <button
              type="button"
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-2 transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={handleMobileMenuToggle}
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                onClick={() => {
                  handleNavClick('home', 'mobile');
                  setIsMobileMenuOpen(false);
                }}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                onClick={() => {
                  handleNavClick('about', 'mobile');
                  setIsMobileMenuOpen(false);
                }}
              >
                About
              </Link>
              <Link
                to="/projects"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                onClick={() => {
                  handleNavClick('projects', 'mobile');
                  setIsMobileMenuOpen(false);
                }}
              >
                Projects
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                onClick={() => {
                  handleNavClick('contact', 'mobile');
                  setIsMobileMenuOpen(false);
                }}
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 