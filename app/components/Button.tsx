import { forwardRef } from 'react';
import type { BaseComponentProps, SizeProps, VariantProps, LoadingProps, FocusableProps } from './types';
import { buildComponentClasses } from './utils/styles';

export interface ButtonProps extends 
  BaseComponentProps, 
  SizeProps, 
  VariantProps, 
  LoadingProps, 
  FocusableProps,
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'disabled'> {
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  target?: string;
  rel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      children,
      className = '',
      size = 'md',
      variant = 'primary',
      disabled = false,
      loading = false,
      loadingText = 'Loading...',
      type = 'button',
      href,
      target,
      rel,
      leftIcon,
      rightIcon,
      autoFocus,
      tabIndex,
      onFocus,
      onBlur,
      onClick,
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const isLink = !!href;
    const isDisabled = disabled || loading;
    
    // Base button styles
    const baseClasses = buildComponentClasses(
      'inline-flex items-center justify-center',
      'font-medium rounded-md',
      'motion-safe:transition-colors motion-reduce:transition-none duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-95 motion-safe:transition-transform motion-reduce:transform-none'
    );

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    // Variant classes
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-transparent',
      secondary: 'bg-white text-gray-900 hover:bg-gray-50 focus:ring-blue-500 border border-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-gray-600',
      outline: 'bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500 border border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:border-blue-400',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 border border-transparent dark:text-gray-300 dark:hover:bg-gray-800',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent',
    };

    const buttonClasses = buildComponentClasses(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      className
    );

    const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event as React.MouseEvent<HTMLButtonElement>);
    };

    const buttonContent = (
      <>
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
        <span>{loading ? loadingText : children}</span>
        {rightIcon && !loading && <span className="ml-2">{rightIcon}</span>}
      </>
    );

    if (isLink) {
      return (
        <a
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          href={isDisabled ? undefined : href}
          target={target}
          rel={rel}
          className={buttonClasses}
          onClick={handleClick}
          onFocus={onFocus}
          onBlur={onBlur}
          tabIndex={isDisabled ? -1 : tabIndex}
          aria-disabled={isDisabled}
          data-testid={testId}
          {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {buttonContent}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type={type}
        className={buttonClasses}
        disabled={isDisabled}
        onClick={handleClick}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        tabIndex={tabIndex}
        data-testid={testId}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';