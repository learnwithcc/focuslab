// Export all utility functions from this directory for clean imports
// Example: export { formatDate, cn } from './helpers';
// This allows: import { formatDate, cn } from '~/utils';

// Theme utilities removed - now handled by VanillaThemeToggle

// Security utilities
export {
  securityHeaders,
  getSecurityHeaders,
  mergeWithSecurityHeaders,
  createSecurityHeaders,
} from './security';

// CSRF protection utilities
export {
  csrfCookie,
  generateRandomToken,
  getCSRFToken,
  generateCSRFToken,
  validateCSRFToken,
  validateCSRFTokenFromFormData,
  withCSRFProtection,
  handleCSRFError,
  needsCSRFProtection,
  useCSRFToken,
} from './csrf';

// Cookie utilities
export * from './cookies';

/**
 * Debounces a function call, ensuring it only executes after a delay
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Add utility exports here as they are created 