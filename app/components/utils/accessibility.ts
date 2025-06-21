// Accessibility utility functions for consistent ARIA attributes and focus management

import { useEffect, useRef } from 'react';

// Generate unique IDs for components
let idCounter = 0;
export const generateId = (prefix: string = 'component'): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

// Common keyboard keys for navigation
export const Keys = {
  Enter: 'Enter',
  Space: ' ',
  Tab: 'Tab',
  Escape: 'Escape',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
} as const;

// Check if a key press should trigger an action (Enter or Space)
export const isActionKey = (key: string): boolean => {
  return key === Keys.Enter || key === Keys.Space;
};

// Check if a key is an arrow key
export const isArrowKey = (key: string): boolean => {
  return [Keys.ArrowUp, Keys.ArrowDown, Keys.ArrowLeft, Keys.ArrowRight].includes(key as any);
};

// Focus trap hook for modals and dialogs
export const useFocusTrap = (isActive: boolean = false) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      if (!containerRef.current) return [];
      
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ');
      
      return Array.from(containerRef.current.querySelectorAll(focusableSelectors));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== Keys.Tab) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab - move to previous element
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab - move to next element
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

// Hook for managing focus on mount
export const useAutoFocus = (autoFocus: boolean = false) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (autoFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [autoFocus]);

  return elementRef;
};

// Generate ARIA attributes for form components
export const getFormAriaAttributes = (options: {
  id?: string;
  error?: string | boolean;
  helperText?: string;
  required?: boolean;
  describedBy?: string;
}) => {
  const { id, error, helperText, required, describedBy } = options;
  
  const attributes: Record<string, any> = {};
  
  if (required) {
    attributes['aria-required'] = true;
  }
  
  if (error) {
    attributes['aria-invalid'] = true;
  }
  
  // Build aria-describedby from error and helper text
  const describedByParts: string[] = [];
  if (describedBy) describedByParts.push(describedBy);
  if (error && typeof error === 'string' && id) describedByParts.push(`${id}-error`);
  if (helperText && id) describedByParts.push(`${id}-helper`);
  
  if (describedByParts.length > 0) {
    attributes['aria-describedby'] = describedByParts.join(' ');
  }
  
  return attributes;
};

// Announce content to screen readers
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove the announcement after a short delay
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Screen reader only class utility
export const srOnlyClass = 'absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 clip-rect-0';

// Helper to combine class names
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
}; 