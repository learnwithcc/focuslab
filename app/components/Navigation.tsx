import React, { forwardRef, useState, useRef } from 'react';
import type { BaseComponentProps } from './types';
import { buildComponentClasses } from './utils/styles';
import { Keys } from './utils/accessibility';

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  children?: NavigationItem[];
  disabled?: boolean;
}

export interface NavigationProps extends BaseComponentProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'primary' | 'secondary';
  mobileMenuButton?: boolean;
  'aria-label'?: string;
}

export const Navigation = forwardRef<HTMLElement, NavigationProps>(
  (
    {
      items = [],
      orientation = 'horizontal',
      variant = 'primary',
      mobileMenuButton = true,
      className = '',
      'aria-label': ariaLabel = 'Main navigation',
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const navRef = useRef<HTMLElement>(null);
    const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

    // Combine refs
    const combinedRef = (node: HTMLElement | null) => {
      if (navRef.current !== node) {
        (navRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    };

    // Focus management
    const focusItem = (index: number) => {
      const item = itemRefs.current[index];
      if (item && !item.hasAttribute('disabled')) {
        item.focus();
        setFocusedIndex(index);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
      const flatItems = flattenItems(items);
      
      switch (event.key) {
        case Keys.ArrowRight:
          if (orientation === 'horizontal') {
            event.preventDefault();
            const nextIndex = (index + 1) % flatItems.length;
            focusItem(nextIndex);
          }
          break;
          
        case Keys.ArrowLeft:
          if (orientation === 'horizontal') {
            event.preventDefault();
            const prevIndex = index === 0 ? flatItems.length - 1 : index - 1;
            focusItem(prevIndex);
          }
          break;
          
        case Keys.ArrowDown:
          if (orientation === 'vertical') {
            event.preventDefault();
            const nextIndex = (index + 1) % flatItems.length;
            focusItem(nextIndex);
          }
          break;
          
        case Keys.ArrowUp:
          if (orientation === 'vertical') {
            event.preventDefault();
            const prevIndex = index === 0 ? flatItems.length - 1 : index - 1;
            focusItem(prevIndex);
          }
          break;
          
        case Keys.Home:
          event.preventDefault();
          focusItem(0);
          break;
          
        case Keys.End:
          event.preventDefault();
          focusItem(flatItems.length - 1);
          break;
          
        case Keys.Escape:
          if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
          }
          break;
      }
    };

    // Flatten nested items for keyboard navigation
    const flattenItems = (items: NavigationItem[]): NavigationItem[] => {
      return items.reduce<NavigationItem[]>((acc, item) => {
        acc.push(item);
        if (item.children) {
          acc.push(...flattenItems(item.children));
        }
        return acc;
      }, []);
    };

    const renderNavigationItem = (item: NavigationItem, index: number, level: number = 0) => {
      const isButton = !item.href && item.onClick;
      const Element = isButton ? 'button' : 'a';
      
             const itemClasses = buildComponentClasses(
         'block px-3 py-2 text-sm font-medium transition-colors duration-200',
         'focus:outline-none focus:ring-2 focus:ring-offset-2',
         
         // Variant styles
         variant === 'primary' ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-300 hover:text-white hover:bg-gray-700',
         variant === 'primary' ? 'focus:ring-blue-500' : 'focus:ring-gray-500',
         item.isActive && (variant === 'primary' ? 'text-blue-600 bg-blue-50' : 'text-white bg-gray-900'),
         
         // Disabled styles
         item.disabled && 'opacity-50 cursor-not-allowed',
         
         // Level indentation
         level > 0 && `ml-${level * 4}`
       );

      const handleClick = (event: React.MouseEvent) => {
        if (item.disabled) {
          event.preventDefault();
          return;
        }
        
        if (item.onClick) {
          item.onClick();
        }
        
        // Close mobile menu on item click
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      };

      return (
                 <Element
           key={item.id}
           ref={(el: HTMLAnchorElement | HTMLButtonElement | null) => {
             itemRefs.current[index] = el;
           }}
          href={!isButton ? item.href : undefined}
          className={itemClasses}
          role="menuitem"
          tabIndex={focusedIndex === index ? 0 : -1}
          aria-current={item.isActive ? 'page' : undefined}
          aria-disabled={item.disabled}
          onClick={handleClick}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={() => setFocusedIndex(index)}
        >
          {item.label}
        </Element>
      );
    };

    const renderNavigationItems = (items: NavigationItem[], level: number = 0) => {
      const flatItems = flattenItems(items);
      
      return flatItems.map((item, index) => (
        renderNavigationItem(item, index, level)
      ));
    };

    const navClasses = buildComponentClasses(
      // Base navigation styles
      'relative',
      
      // Variant styles
      variant === 'primary' ? 'bg-white shadow-sm border-b border-gray-200' : 'bg-gray-800',
      
      className
    );

         const menuClasses = buildComponentClasses(
       // Base menu styles
       orientation === 'horizontal' ? 'flex space-x-1' : 'space-y-1',
       
       // Mobile responsive
       mobileMenuButton && 'md:flex',
       mobileMenuButton && (isMobileMenuOpen ? 'block' : 'hidden md:block')
     );

    const mobileToggleClasses = buildComponentClasses(
      'md:hidden p-2 rounded-md transition-colors',
      variant === 'primary' ? 
        'text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:ring-blue-500' :
        'text-gray-300 hover:text-white hover:bg-gray-700 focus:ring-gray-500',
      'focus:outline-none focus:ring-2 focus:ring-offset-2'
    );

    return (
      <nav
        ref={combinedRef}
        className={navClasses}
        role="navigation"
        aria-label={ariaLabel}
        data-testid={testId}
        {...rest}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                {/* Logo or brand area */}
              </div>
              
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <div
                  className={menuClasses}
                  role="menubar"
                  aria-orientation={orientation}
                >
                  {renderNavigationItems(items)}
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            {mobileMenuButton && (
              <div className="md:hidden">
                <button
                  type="button"
                  className={mobileToggleClasses}
                  aria-controls="mobile-menu"
                  aria-expanded={isMobileMenuOpen}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <span className="sr-only">Open main menu</span>
                  {/* Hamburger icon */}
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={isMobileMenuOpen 
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                      }
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuButton && (
          <div
            className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}
            id="mobile-menu"
          >
            <div
              className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200"
              role="menubar"
              aria-orientation="vertical"
            >
              {renderNavigationItems(items)}
            </div>
          </div>
        )}
      </nav>
    );
  }
);

Navigation.displayName = 'Navigation'; 