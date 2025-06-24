// Cookie name for theme preference
export const THEME_COOKIE_NAME = 'focuslab-theme-preference';

// Valid theme values
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export type ThemeValue = typeof THEMES[keyof typeof THEMES];

/**
 * Parse theme from cookie value
 */
export function parseThemeCookie(cookieHeader: string | null): ThemeValue | null {
  if (!cookieHeader) return null;
  
  const match = cookieHeader.match(new RegExp(`${THEME_COOKIE_NAME}=(light|dark)`));
  return match ? (match[1] as ThemeValue) : null;
}

/**
 * Get theme preference from request (server-side)
 */
export function getThemeFromRequest(request: Request): ThemeValue | null {
  const cookieHeader = request.headers.get('Cookie');
  return parseThemeCookie(cookieHeader);
}

/**
 * Create theme cookie string
 */
export function createThemeCookie(theme: ThemeValue): string {
  // Set cookie with 1 year expiry, secure in production
  const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Get system theme preference (client-side only)
 */
export function getSystemTheme(): ThemeValue {
  if (typeof window === 'undefined') {
    return THEMES.LIGHT;
  }
  
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches 
    ? THEMES.DARK 
    : THEMES.LIGHT;
}

/**
 * Apply theme to document (client-side only)
 */
export function applyThemeToDocument(theme: ThemeValue): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  root.classList.remove(THEMES.LIGHT, THEMES.DARK);
  root.classList.add(theme);
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
}

/**
 * Save theme preference (client-side only)
 */
export function saveThemePreference(theme: ThemeValue): void {
  if (typeof window === 'undefined') return;
  
  // Save to localStorage for backwards compatibility
  try {
    localStorage.setItem(THEME_COOKIE_NAME, theme);
  } catch (e) {
    console.warn('Could not save theme to localStorage:', e);
  }
  
  // Save to cookie for SSR
  document.cookie = createThemeCookie(theme);
}

/**
 * Get saved theme preference (client-side only)
 */
export function getSavedTheme(): ThemeValue | null {
  if (typeof window === 'undefined') return null;
  
  // Check cookie first
  const cookieTheme = parseThemeCookie(document.cookie);
  if (cookieTheme) return cookieTheme;
  
  // Fall back to localStorage
  try {
    const stored = localStorage.getItem(THEME_COOKIE_NAME);
    return stored === THEMES.DARK || stored === THEMES.LIGHT ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Get initial theme with fallback chain
 */
export function getInitialTheme(cookieTheme?: ThemeValue | null): ThemeValue {
  // Server-side: use cookie or default to light
  if (typeof window === 'undefined') {
    return cookieTheme || THEMES.LIGHT;
  }
  
  // Client-side: cookie > localStorage > system > light
  return cookieTheme || getSavedTheme() || getSystemTheme();
}