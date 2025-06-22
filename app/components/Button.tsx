import React, { forwardRef } from 'react';
import type { 
  BaseComponentProps, 
  LoadingProps 
} from './types';
import { 
  getSizeStyles, 
  getButtonStyles, 
  baseStyles, 
  buildComponentClasses 
} from './utils/styles';

export interface ButtonProps 
  extends BaseComponentProps, 
          LoadingProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
  loading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      loadingText = 'Loading...',
      type = 'button',
      autoFocus = false,
      tabIndex,
      onClick,
      onFocus,
      onBlur,
      onKeyDown,
      onKeyUp,
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const sizeStyles = getSizeStyles(size);
    const variantStyles = getButtonStyles(variant);
    
    const isDisabled = disabled || loading;
    
    const buttonClasses = buildComponentClasses(
      // Base styles
      baseStyles.reset,
      baseStyles.transition,
      baseStyles.borderRadius,
      baseStyles.border,
      baseStyles.fontWeight,
      baseStyles.focusVisible,
      baseStyles.flexCenter,
      baseStyles.shadow,
      
      // Size styles
      sizeStyles.padding,
      sizeStyles.text,
      sizeStyles.minHeight,
      
      // Variant styles
      variantStyles.base,
      !isDisabled && variantStyles.hover,
      !isDisabled && variantStyles.focus,
      !isDisabled && variantStyles.active,
      !isDisabled && baseStyles.interactive,
      isDisabled && variantStyles.disabled,
      isDisabled && baseStyles.disabled,
      
      // Custom classes
      className
    );

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }
      
      // Handle space key for button activation
      if (event.key === ' ') {
        event.preventDefault();
      }
      
      onKeyDown?.(event);
    };

    const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }
      
      // Trigger click on space key release
      if (event.key === ' ') {
        event.preventDefault();
        onClick?.(event as any);
      }
      
      onKeyUp?.(event);
    };

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={isDisabled}
        autoFocus={autoFocus}
        tabIndex={tabIndex}
        onClick={handleClick}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        aria-disabled={isDisabled}
        data-testid={testId}
        {...rest}
      >
        {loading && (
          <div 
            className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            aria-hidden="true"
          />
        )}
        <span className={loading ? 'opacity-75' : ''}>
          {loading && loadingText ? loadingText : children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button'; 