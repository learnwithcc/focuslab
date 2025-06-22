import React, { forwardRef, useState } from 'react';
import type { 
  ComponentSize
} from './types';
import { 
  getSizeStyles, 
  buildComponentClasses 
} from './utils/styles';
import { 
  generateId, 
  getFormAriaAttributes
} from './utils/accessibility';

export interface InputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hideLabel?: boolean;
  size?: ComponentSize;
  error?: string | boolean | undefined;
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
    const [internalIdState] = useState(() => providedId || generateId('input'));
    const sizeStyles = getSizeStyles(size);
    
    const internalId = providedId || internalIdState;
    const helperId = helperText || error ? `${internalId}-help` : undefined;
    
    // Build aria attributes object dynamically to handle exactOptionalPropertyTypes
    const ariaAttributesConfig: {
      id?: string;
      error?: string | boolean;
      helperText?: string;
      required?: boolean;
      describedBy?: string;
    } = {
      id: internalId,
      required
    };
    
    if (typeof error === 'string') {
      ariaAttributesConfig.error = error;
    } else if (error) {
      ariaAttributesConfig.error = true;
    }
    
    if (helperText) {
      ariaAttributesConfig.helperText = helperText;
    }
    
    if (helperId) {
      ariaAttributesConfig.describedBy = helperId;
    }
    
    const ariaAttributes = getFormAriaAttributes(ariaAttributesConfig);

    const errorStyles = error
    ? 'border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-primary';

    const inputClasses = buildComponentClasses(
      'block w-full rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 duration-200 px-4 py-2 text-base h-10 border-gray-300 focus:border-primary-purple dark:border-gray-700 dark:bg-gray-800 dark:text-white motion-safe:transition-colors motion-reduce:transition-none',
      errorStyles,
      disabled ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed' : '',
      className
    );

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={internalId}
            className={`block text-sm font-medium ${
              error ? 'text-red-700' : 'text-gray-700'
            } ${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}
          >
            {label}
          </label>
        )}
        
        <input
          {...rest}
          {...ariaAttributes}
          ref={ref}
          id={internalId}
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          disabled={disabled}
          required={required}
          className={inputClasses}
          data-testid={'data-testid' in rest ? rest['data-testid'] : undefined}
        />
        
        {(helperText || error) && (
          <p
            id={`${internalId}-help`}
            className={`text-sm ${
              error ? 'text-red-600' : 'text-gray-500'
            }`}
            role={error ? 'alert' : undefined}
            aria-live={error ? 'polite' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';