// Common styling utilities for consistent component appearance

import type { ComponentSize, ComponentVariant } from '../types';

// Size variants for components
export const sizeClasses = {
  sm: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    height: 'h-8',
    minHeight: 'min-h-8'
  },
  md: {
    padding: 'px-4 py-2',
    text: 'text-base',
    height: 'h-10',
    minHeight: 'min-h-10'
  },
  lg: {
    padding: 'px-6 py-3',
    text: 'text-lg',
    height: 'h-12',
    minHeight: 'min-h-12'
  }
} as const;

// Button variant styles
export const buttonVariants = {
  primary: {
    base: 'bg-blue-600 text-white border-blue-600',
    hover: 'hover:bg-blue-700 hover:border-blue-700',
    focus: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    active: 'active:bg-blue-800',
    disabled: 'disabled:bg-blue-300 disabled:border-blue-300 disabled:cursor-not-allowed'
  },
  secondary: {
    base: 'bg-gray-600 text-white border-gray-600',
    hover: 'hover:bg-gray-700 hover:border-gray-700',
    focus: 'focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
    active: 'active:bg-gray-800',
    disabled: 'disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed'
  },
  outline: {
    base: 'bg-transparent text-blue-600 border-blue-600',
    hover: 'hover:bg-blue-50 hover:text-blue-700',
    focus: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    active: 'active:bg-blue-100',
    disabled: 'disabled:text-blue-300 disabled:border-blue-300 disabled:cursor-not-allowed'
  },
  ghost: {
    base: 'bg-transparent text-gray-700 border-transparent',
    hover: 'hover:bg-gray-100 hover:text-gray-900',
    focus: 'focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
    active: 'active:bg-gray-200',
    disabled: 'disabled:text-gray-300 disabled:cursor-not-allowed'
  },
  danger: {
    base: 'bg-red-600 text-white border-red-600',
    hover: 'hover:bg-red-700 hover:border-red-700',
    focus: 'focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
    active: 'active:bg-red-800',
    disabled: 'disabled:bg-red-300 disabled:border-red-300 disabled:cursor-not-allowed'
  }
} as const;

// Input variant styles
export const inputVariants = {
  default: {
    base: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    focus: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    error: 'border-red-500 focus:ring-red-500 focus:border-red-500',
    disabled: 'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'
  }
} as const;

// Common base styles
export const baseStyles = {
  // Reset and base styles
  reset: 'appearance-none',
  transition: 'transition-colors duration-200 ease-in-out',
  borderRadius: 'rounded-md',
  border: 'border',
  fontWeight: 'font-medium',
  
  // Focus styles
  focusVisible: 'focus-visible:outline-none',
  
  // Interactive states
  interactive: 'cursor-pointer select-none',
  disabled: 'disabled:opacity-50',
  
  // Layout
  flexCenter: 'flex items-center justify-center',
  flexStart: 'flex items-center justify-start',
  
  // Typography
  textEllipsis: 'truncate',
  textCenter: 'text-center',
  
  // Shadows
  shadow: 'shadow-sm',
  shadowHover: 'hover:shadow-md',
} as const;

// Helper functions to get styles
export const getSizeStyles = (size: ComponentSize = 'md') => {
  return sizeClasses[size];
};

export const getButtonStyles = (variant: ComponentVariant = 'primary') => {
  return buttonVariants[variant];
};

export const getInputStyles = () => {
  return inputVariants.default;
};

// Helper to build component class strings
export const buildComponentClasses = (
  baseClasses: string,
  ...conditionalClasses: (string | undefined | false)[]
): string => {
  return [baseClasses, ...conditionalClasses.filter(Boolean)].join(' ');
};

// Common layout classes
export const layoutClasses = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-12 md:py-16 lg:py-20',
  grid: 'grid gap-6',
  gridResponsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  flexCol: 'flex flex-col',
  flexRow: 'flex flex-row',
  spaceBetween: 'justify-between',
  center: 'items-center justify-center',
} as const;

// Spacing utilities
export const spacing = {
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
} as const;

// Dark mode utilities (if needed later)
export const darkModeClasses = {
  text: 'dark:text-white',
  bg: 'dark:bg-gray-900',
  border: 'dark:border-gray-700',
} as const; 