import { Link, useLocation } from '@remix-run/react';
import { useState, useEffect, useRef } from 'react';
import { MobileThemeToggle } from './ui/theme-toggle';
import { trackEvent } from '~/utils/posthog';

export function Header() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const menuItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Navigation items for easier management
  const navigationItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/projects', label: 'Projects' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ];

  // Scroll detection for sticky header
  useEffect(() => {
    let ticking = false;
    let lastStickyState = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const newStickyState = scrollTop > 20;
          
          // Track state transitions for analytics (avoid excessive events)
          if (newStickyState !== lastStickyState) {
            trackEvent('header_sticky_transition', {
              state: newStickyState ? 'sticky' : 'normal',
              scrollTop,
              timestamp: Date.now(),
            });
            lastStickyState = newStickyState;
          }
          
          setIsSticky(newStickyState);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Set initial state based on current scroll position
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const initialStickyState = scrollTop > 20;
    setIsSticky(initialStickyState);
    lastStickyState = initialStickyState;

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    
    // Focus management for accessibility
    if (newState) {
      // Menu is opening - focus first menu item
      setTimeout(() => {
        const firstMenuItem = menuItemRefs.current[0];
        if (firstMenuItem) {
          firstMenuItem.focus();
          setFocusedItemIndex(0);
        }
      }, 100); // Small delay to ensure menu is rendered
    } else {
      // Menu is closing - return focus to toggle button
      if (mobileToggleRef.current) {
        mobileToggleRef.current.focus();
      }
      setFocusedItemIndex(-1);
    }
    
    trackEvent('mobile_menu_toggle', {
      action: newState ? 'open' : 'close',
      timestamp: Date.now(),
    });
  };

  // Keyboard navigation for mobile menu
  const handleMenuKeyDown = (event: React.KeyboardEvent, itemIndex: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (itemIndex + 1) % navigationItems.length;
        const nextItem = menuItemRefs.current[nextIndex];
        if (nextItem) {
          nextItem.focus();
          setFocusedItemIndex(nextIndex);
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = itemIndex === 0 ? navigationItems.length - 1 : itemIndex - 1;
        const prevItem = menuItemRefs.current[prevIndex];
        if (prevItem) {
          prevItem.focus();
          setFocusedItemIndex(prevIndex);
        }
        break;
        
      case 'Home':
        event.preventDefault();
        const firstItem = menuItemRefs.current[0];
        if (firstItem) {
          firstItem.focus();
          setFocusedItemIndex(0);
        }
        break;
        
      case 'End':
        event.preventDefault();
        const lastIndex = navigationItems.length - 1;
        const lastItem = menuItemRefs.current[lastIndex];
        if (lastItem) {
          lastItem.focus();
          setFocusedItemIndex(lastIndex);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setIsMobileMenuOpen(false);
        if (mobileToggleRef.current) {
          mobileToggleRef.current.focus();
        }
        setFocusedItemIndex(-1);
        break;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && 
          mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target as Node) &&
          mobileToggleRef.current &&
          !mobileToggleRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
        setFocusedItemIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Trap focus within mobile menu when open
  useEffect(() => {
    const handleTabKey = (event: KeyboardEvent) => {
      if (!isMobileMenuOpen) return;
      
      if (event.key === 'Tab') {
        const focusableElements = [
          ...menuItemRefs.current.filter(Boolean),
          mobileToggleRef.current
        ].filter(Boolean);
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isMobileMenuOpen]);

  // Dynamic className logic - always sticky, conditionally glassmorphic
  const headerClasses = `
    header-base
    ${isSticky ? 'header-glassmorphic header-sticky-shadow' : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'}
  `.trim();

  return (
      <header 
        className={headerClasses}
        role="banner"
        aria-label={isSticky ? "Main navigation (sticky)" : "Main navigation"}
      >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center"
            onClick={() => handleNavClick('home', 'logo')}
          >
            <span className="font-heading text-xl font-bold text-gray-900 dark:text-white">
              Focus Lab
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8" aria-label="Main navigation">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    px-3 py-2 text-sm font-medium transition-colors
                    ${isActive 
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleNavClick(item.label.toLowerCase(), 'desktop')}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu and theme toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <MobileThemeToggle />
            <button
              ref={mobileToggleRef}
              type="button"
              className="
                relative inline-flex items-center justify-center p-2 rounded-md
                text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white
                hover:bg-gray-100 dark:hover:bg-gray-800
                focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                motion-safe:transition-colors motion-reduce:transition-none duration-200
              "
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-haspopup="true"
              onClick={handleMobileMenuToggle}
            >
              <span className="sr-only">
                {isMobileMenuOpen ? "Close main menu" : "Open main menu"}
              </span>
              
              {/* Hamburger/Close Icon with smooth animation */}
              <div className="relative w-6 h-6" aria-hidden="true">
                <span 
                  className={`
                    hamburger-line
                    ${isMobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'}
                  `}
                />
                <span 
                  className={`
                    hamburger-line
                    ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}
                  `}
                />
                <span 
                  className={`
                    hamburger-line
                    ${isMobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'}
                  `}
                />
              </div>
            </button>
          </div>
        </div>
        
        {/* Enhanced Mobile Menu with Slide Animation */}
        <div 
          className={`
            mobile-menu-container md:hidden
            motion-safe:transition-all motion-reduce:transition-none duration-300 ease-in-out
            ${isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}
            ${isSticky ? 'mobile-menu-sticky' : 'border-t border-gray-200 dark:border-gray-700'}
          `}
          id="mobile-menu"
          ref={mobileMenuRef}
        >
          <nav 
            className="px-4 pt-4 pb-6 space-y-2"
            role="navigation"
            aria-label="Mobile navigation"
          >
            {navigationItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              const isFocused = focusedItemIndex === index;
              
              return (
                <Link
                  key={item.href}
                  ref={(el) => {
                    menuItemRefs.current[index] = el;
                  }}
                  to={item.href}
                  className={`
                    mobile-nav-item
                    ${isActive ? 'active' : ''}
                    ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  `}
                  role="menuitem"
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    handleNavClick(item.label.toLowerCase(), 'mobile');
                    setIsMobileMenuOpen(false);
                    setFocusedItemIndex(-1);
                  }}
                  onKeyDown={(e) => handleMenuKeyDown(e, index)}
                  onFocus={() => setFocusedItemIndex(index)}
                >
                  <span className="flex items-center justify-between">
                    {item.label}
                    {isActive && (
                      <span className="text-sm text-blue-600 dark:text-blue-400" aria-hidden="true">
                        ●
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
} 