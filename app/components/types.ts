// Base component prop interfaces for consistent component APIs

export type ComponentSize = 'sm' | 'md' | 'lg';
export type ComponentVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

// Base props that most components should support
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  'data-testid'?: string;
}

// Props for components that support sizing
export interface SizeProps {
  size?: ComponentSize;
}

// Props for components that support variants
export interface VariantProps {
  variant?: ComponentVariant;
}

// Props for components that support loading states
export interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
}

// Combined props for interactive components
export interface InteractiveComponentProps extends BaseComponentProps, SizeProps, VariantProps {
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

// Props for form components
export interface FormComponentProps extends InteractiveComponentProps {
  name?: string;
  required?: boolean;
  error?: string | boolean;
  helperText?: string;
}

// Props for components that need focus management
export interface FocusableProps {
  autoFocus?: boolean;
  tabIndex?: number;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
}

// Props for keyboard navigation
export interface KeyboardProps {
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
} 