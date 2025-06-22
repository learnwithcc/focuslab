import React, { forwardRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BaseComponentProps } from './types';
import { buildComponentClasses } from './utils/styles';
import { useFocusTrap, Keys, generateId } from './utils/accessibility';
import { Button } from './Button';
import { clsx } from 'clsx';

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventBodyScroll?: boolean;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      children,
      className = '',
      isOpen = false,
      onClose,
      title,
      description,
      size = 'md',
      closeOnBackdropClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      preventBodyScroll = true,
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const [titleId] = useState(() => generateId('modal-title'));
    const [descriptionId] = useState(() => generateId('modal-description'));
    
    // Use focus trap when modal is open
    const focusTrapRef = useFocusTrap(isOpen);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (!preventBodyScroll) return;

      if (isOpen) {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }, [isOpen, preventBodyScroll]);

    // Handle keyboard events
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === Keys.Escape) {
          event.preventDefault();
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, onClose]);

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    };

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4'
    };

    const backdropClasses = buildComponentClasses(
      'fixed inset-0 z-50 overflow-y-auto',
      'bg-black bg-opacity-50',
      'flex items-center justify-center p-4',
      'transition-opacity duration-300 ease-out',
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    );

    const modalClasses = buildComponentClasses(
      // Base modal styles
      'relative bg-white rounded-lg shadow-xl',
      'max-h-full overflow-hidden',
      'w-full',
      sizeClasses[size],
      
      // Animation
      'transition-all duration-300 ease-out transform',
      isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4',
      
      className
    );

    if (!isOpen) return null;

    const modalContent = (
      <>
        <div
          className={clsx(
            'fixed inset-0 z-40 bg-black bg-opacity-50',
            'motion-safe:transition-opacity motion-reduce:transition-none duration-300 ease-out',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={handleBackdropClick}
          role="presentation"
          aria-hidden="true"
        />
        <div
          className={clsx(
            'fixed inset-0 z-50 flex items-center justify-center p-4',
            'motion-safe:transition-all motion-reduce:transition-none duration-300 ease-out transform',
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          )}
        >
          <div
            ref={(node) => {
              // Combine refs
              if (focusTrapRef.current !== node) {
                (focusTrapRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              }
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
              }
            }}
            className={modalClasses}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            data-testid={testId}
            {...rest}
          >
            {/* Modal Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                {title && (
                  <h2
                    id={titleId}
                    className="text-lg font-semibold text-gray-900"
                  >
                    {title}
                  </h2>
                )}
                
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label="Close modal"
                    className="ml-auto -mr-2"
                  >
                    <svg
                      className="w-4 h-4"
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
                  </Button>
                )}
              </div>
            )}

            {/* Modal Description */}
            {description && (
              <div className="px-6 pt-4">
                <p id={descriptionId} className="text-sm text-gray-600">
                  {description}
                </p>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </>
    );

    // Render modal in a portal to avoid z-index issues
    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal'; 