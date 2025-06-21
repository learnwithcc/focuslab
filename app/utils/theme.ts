import { Theme } from '../contexts/ThemeContext';

/**
 * Detects the system theme preference
 * @returns 'dark' if system preference is dark, 'light' otherwise
 */
export const detectSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

/**
 * Validates if a given value is a valid theme
 * @param theme - The theme value to validate
 * @returns true if the theme is valid, false otherwise
 */
export const validateTheme = (theme: string): theme is Theme => {
  return theme === 'light' || theme === 'dark';
};

/**
 * Applies theme classes to the document root element
 * @param theme - The theme to apply ('light' or 'dark')
 */
export const applyTheme = (theme: Theme): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  
  // Add the new theme class
  root.classList.add(theme);
  
  // Update data attribute for CSS targeting
  root.setAttribute('data-theme', theme);
  
  // Update color scheme for browser UI
  root.style.colorScheme = theme;
};

/**
 * Gets the current theme from the document element
 * @returns The current theme or null if not set
 */
export const getCurrentTheme = (): Theme | null => {
  if (typeof document === 'undefined') return null;
  
  const root = document.documentElement;
  if (root.classList.contains('dark')) return 'dark';
  if (root.classList.contains('light')) return 'light';
  
  return null;
};

/**
 * Creates a media query listener for system theme changes
 * @param callback - Function to call when theme changes
 * @returns Cleanup function to remove the listener
 */
export const createThemeListener = (callback: (theme: Theme) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    const newTheme = e.matches ? 'dark' : 'light';
    callback(newTheme);
  };

  mediaQuery.addEventListener('change', handleChange);
  
  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
};

/**
 * Utility to get theme-aware CSS custom property values
 * @param property - The CSS custom property name (without -- prefix)
 * @returns The computed value of the CSS custom property
 */
export const getThemeProperty = (property: string): string => {
  if (typeof document === 'undefined') return '';
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  return computedStyle.getPropertyValue(`--${property}`).trim();
};

/**
 * Sets a CSS custom property value on the document root
 * @param property - The CSS custom property name (without -- prefix)
 * @param value - The value to set
 */
export const setThemeProperty = (property: string, value: string): void => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  root.style.setProperty(`--${property}`, value);
}; 