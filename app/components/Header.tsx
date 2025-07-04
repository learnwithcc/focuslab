import { Link, useLocation } from '@remix-run/react';
import { useState, useEffect, useRef } from 'react';
import { NavbarThemeToggle, MobileNavbarThemeToggle } from './NavbarThemeToggle';
import { trackEvent } from '~/utils/posthog';
import { Breadcrumb } from './Breadcrumb';
import type { BreadcrumbItem } from '~/utils/structured-data';
import { Fragment } from 'react';

type DisplayItem = {
  href: string;
  label: string;
} & ({
  type: 'breadcrumb';
  breadcrumb: BreadcrumbItem[];
} | {
  type: 'link';
});

export function Header({ breadcrumbItems }: { breadcrumbItems?: BreadcrumbItem[] }) {
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

  const displayItems: DisplayItem[] = navigationItems.map(item => {
    const breadcrumbIndex = breadcrumbItems?.findIndex(b => b.path === item.href) ?? -1;
    if (breadcrumbIndex !== -1 && breadcrumbItems) {
      const breadcrumbSegment = breadcrumbItems.slice(breadcrumbIndex);
      if (breadcrumbSegment.length > 1) {
        return { ...item, type: 'breadcrumb', breadcrumb: breadcrumbSegment };
      }
    }
    return { ...item, type: 'link' };
  });

  // Scroll detection for sticky header
  useEffect(() => {
    let ticking = false;
    let lastStickyState = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const newStickyState = scrollTop > 20;
          
          console.log('Header scroll:', { scrollTop, newStickyState, lastStickyState });
          
          // Track state transitions for analytics (avoid excessive events)
          if (newStickyState !== lastStickyState) {
            console.log('Header sticky state changed:', newStickyState ? 'sticky' : 'normal');
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
  
  console.log('Header render:', { isSticky, headerClasses });

  return (
      <header 
        className={headerClasses}
        role="banner"
        aria-label={isSticky ? "Main navigation (sticky)" : "Main navigation"}
      >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
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
            <nav
              className="hidden md:flex items-center space-x-8 ml-8"
              aria-label="Main navigation"
            >
              {displayItems.map(item => {
                if (item.type === 'breadcrumb') {
                  return (
                    <div key={item.href} className="flex items-center text-sm font-medium">
                      {item.breadcrumb.map((b, index) => (
                        <Fragment key={b.path ?? b.name}>
                          {index > 0 && <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>}
                          {b.path && !b.isCurrentPage ? (
                            <Link
                              to={b.path}
                              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
                              onClick={() => handleNavClick(b.path!, 'desktop')}
                            >
                              {b.name}
                            </Link>
                          ) : (
                            <span className="text-primary-600 dark:text-primary-400 font-medium">{b.name}</span>
                          )}
                        </Fragment>
                      ))}
                    </div>
                  );
                }
                
                const isActive = item.href === '/' ? location.pathname === item.href : location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => handleNavClick(item.href, 'desktop')}
                    className={`
                      font-medium transition-colors
                      ${
                        isActive
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side: Controls */}
          <div className="flex items-center">
            {/* Theme Toggle and Mobile Menu Button */}
            <NavbarThemeToggle />
            <div className="md:hidden">
              <button
                ref={mobileToggleRef}
                onClick={handleMobileMenuToggle}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-800"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {/* Icon for menu (hamburger) */}
                <svg
                  className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* Icon for close (X) */}
                <svg
                  className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {isMobileMenuOpen && (
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
            {displayItems.map((item, index) => {
              const isFocused = focusedItemIndex === index;

              if (item.type === 'breadcrumb') {
                return (
                  <div key={item.href} className={`mobile-nav-item ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''} text-sm`}>
                    {item.breadcrumb.map((b, i) => (
                       <Fragment key={b.path ?? b.name}>
                         {i > 0 && <span className="mx-1 text-gray-400 dark:text-gray-500">/</span>}
                         {b.path && !b.isCurrentPage ? (
                           <Link 
                             to={b.path} 
                             className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white" 
                             onClick={() => setIsMobileMenuOpen(false)}
                           >
                             {b.name}
                           </Link>
                         ) : (
                           <span className="font-semibold text-primary-600 dark:text-primary-400">{b.name}</span>
                         )}
                       </Fragment>
                    ))}
                  </div>
                )
              }

              const isActive = item.href === '/' ? location.pathname === item.href : location.pathname.startsWith(item.href);
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
      )}
    </header>
  );
} 