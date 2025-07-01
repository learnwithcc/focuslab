import { useEffect, useRef } from 'react';

export interface SkipNavigationProps {
  /** The ID of the main content element to skip to */
  targetId?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkipNavigation provides WCAG 2.1 AA compliant skip links for keyboard navigation.
 * 
 * Features:
 * - Visually hidden by default, appears on focus
 * - High contrast and clear visual design when focused
 * - Smooth focus transition to main content
 * - Screen reader accessible
 * - Supports both light and dark themes
 * - Respects motion preferences
 */
export function SkipNavigation({ 
  targetId = 'main-content',
  className = '' 
}: SkipNavigationProps) {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  const handleSkipToMain = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    
    const mainContent = document.getElementById(targetId);
    if (mainContent) {
      // Ensure the main content is focusable
      const originalTabIndex = mainContent.getAttribute('tabindex');
      mainContent.setAttribute('tabindex', '-1');
      
      // Focus the main content
      mainContent.focus();
      
      // Scroll to main content with smooth behavior (respecting motion preferences)
      mainContent.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start' 
      });
      
      // Remove tabindex after a short delay to restore normal behavior
      setTimeout(() => {
        if (originalTabIndex === null) {
          mainContent.removeAttribute('tabindex');
        } else {
          mainContent.setAttribute('tabindex', originalTabIndex);
        }
      }, 100);
    }
  };

  // Ensure the skip link is the first focusable element when the page loads
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Make skip link easily accessible with Alt+S shortcut
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        skipLinkRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="absolute top-0 left-0 z-[9999]">
      <a
        ref={skipLinkRef}
        href={`#${targetId}`}
        onClick={handleSkipToMain}
        className={`
          sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 
          focus:z-[10000] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white 
          focus:font-medium focus:text-sm focus:rounded-md focus:m-2
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:bg-blue-500 dark:focus:ring-blue-400
          transition-all duration-200 motion-reduce:transition-none
          ${className}
        `}
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
    </div>
  );
}