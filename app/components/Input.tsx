import React, { forwardRef, useState } from 'react';
import type { 
  ComponentSize
} from './types';
import { 
  getSizeStyles, 
  getInputStyles, 
  baseStyles, 
  buildComponentClasses 
} from './utils/styles';
import { 
  generateId, 
  getFormAriaAttributes,
  srOnlyClass 
} from './utils/accessibility';

export interface InputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hideLabel?: boolean;
  size?: ComponentSize;
  error?: string | boolean;
  helperText?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      hideLabel = false,
      size = 'md',
      disabled = false,
      error,
      helperText,
      required = false,
      type = 'text',
      id: providedId,
      name,
      placeholder,
      autoFocus = false,
      tabIndex,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      onKeyUp,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      ...rest
    },
    ref
  ) => {
    const [internalId] = useState(() => providedId || generateId('input'));
    const sizeStyles = getSizeStyles(size);
    const inputStyles = getInputStyles();
    
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : '';
    
    // Generate ARIA attributes
    const ariaAttributes = getFormAriaAttributes({
      id: internalId,
      error: error || undefined,
      helperText: helperText || undefined,
      required,
      describedBy: ariaDescribedby || undefined
    });
    
    const inputClasses = buildComponentClasses(
      // Base styles
      baseStyles.reset,
      baseStyles.transition,
      baseStyles.borderRadius,
      baseStyles.border,
      baseStyles.focusVisible,
      'w-full',
      
      // Size styles
      sizeStyles.padding,
      sizeStyles.text,
      sizeStyles.height,
      
      // Input variant styles
      inputStyles.base,
      !disabled && !hasError && inputStyles.focus,
      hasError && inputStyles.error,
      disabled && inputStyles.disabled,
      
      // Custom classes
      className
    );

    const labelClasses = buildComponentClasses(
      'block text-sm font-medium text-gray-700 mb-1',
      hideLabel && srOnlyClass
    );

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={internalId}
            className={labelClasses}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        <input
          ref={ref}
          type={type}
          id={internalId}
          name={name}
          className={inputClasses}
          disabled={disabled}
          placeholder={placeholder}
          autoFocus={autoFocus}
          tabIndex={tabIndex}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          aria-label={!label ? ariaLabel : undefined}
          aria-labelledby={ariaLabelledby}
          data-testid={testId}
          {...ariaAttributes}
          {...rest}
        />
        
        {helperText && !hasError && (
          <p 
            id={`${internalId}-helper`}
            className="mt-1 text-sm text-gray-600"
          >
            {helperText}
          </p>
        )}
        
        {hasError && errorMessage && (
          <p 
            id={`${internalId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; 