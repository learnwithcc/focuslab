// Export all utility functions from this directory for clean imports
// Example: export { formatDate, cn } from './helpers';
// This allows: import { formatDate, cn } from '~/utils';

// Theme utilities
export {
  detectSystemTheme,
  validateTheme,
  applyTheme,
  getCurrentTheme,
  createThemeListener,
  getThemeProperty,
  setThemeProperty,
} from './theme';

// Security utilities
export {
  securityHeaders,
  getSecurityHeaders,
  mergeWithSecurityHeaders,
  createSecurityHeaders,
} from './security';

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