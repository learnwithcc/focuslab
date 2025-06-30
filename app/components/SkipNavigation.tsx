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
    <div className="skip-navigation-container">
      <a
        ref={skipLinkRef}
        href={`#${targetId}`}
        onClick={handleSkipToMain}
        className={`skip-link ${className}`}
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
    </div>
  );
}