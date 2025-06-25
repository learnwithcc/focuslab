// Cookie name for theme preference
export const THEME_COOKIE_NAME = 'focuslab-theme-preference';
export const THEME_OVERRIDE_COOKIE_NAME = 'focuslab-theme-override';

// Valid theme values
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export type ThemeValue = typeof THEMES[keyof typeof THEMES];

/**
 * Parse theme from cookie value
 */
export function parseThemeCookie(cookieHeader: string | null, cookieName: string = THEME_COOKIE_NAME): ThemeValue | null {
  if (!cookieHeader) return null;
  
  const match = cookieHeader.match(new RegExp(`${cookieName}=(light|dark)`));
  return match ? (match[1] as ThemeValue) : null;
}

/**
 * Get theme preference from request (server-side)
 */
export function getThemeFromRequest(request: Request): ThemeValue | null {
  const cookieHeader = request.headers.get('Cookie');
  // Check for manual override first (session-based)
  const override = parseThemeCookie(cookieHeader, THEME_OVERRIDE_COOKIE_NAME);
  if (override) return override;
  
  // Otherwise return null to use system preference
  return null;
}

/**
 * Create theme cookie string
 */
export function createThemeCookie(theme: ThemeValue, isOverride: boolean = false): string {
  const cookieName = isOverride ? THEME_OVERRIDE_COOKIE_NAME : THEME_COOKIE_NAME;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  
  if (isOverride) {
    // Session cookie (no Max-Age = expires when browser closes)
    return `${cookieName}=${theme}; Path=/; SameSite=Lax${secure}`;
  } else {
    // Persistent cookie for backwards compatibility
    const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
    return `${cookieName}=${theme}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }
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
  
  // Save as session override cookie
  document.cookie = createThemeCookie(theme, true);
  
  // Clear any old persistent preferences
  clearPersistentTheme();
}

/**
 * Clear persistent theme settings to revert to system preference
 */
export function clearPersistentTheme(): void {
  if (typeof window === 'undefined') return;
  
  // Remove from localStorage
  try {
    localStorage.removeItem(THEME_COOKIE_NAME);
  } catch (e) {
    console.warn('Could not clear theme from localStorage:', e);
  }
  
  // Expire the persistent cookie
  document.cookie = `${THEME_COOKIE_NAME}=; Path=/; Max-Age=0`;
}

/**
 * Get saved theme preference (client-side only)
 */
export function getSavedTheme(): ThemeValue | null {
  if (typeof window === 'undefined') return null;
  
  // Check override cookie first (session-based)
  const overrideTheme = parseThemeCookie(document.cookie, THEME_OVERRIDE_COOKIE_NAME);
  if (overrideTheme) return overrideTheme;
  
  // Don't check persistent storage - we want to follow system preference
  return null;
}

/**
 * Get initial theme with fallback chain
 */
export function getInitialTheme(cookieTheme?: ThemeValue | null): ThemeValue {
  // Server-side: use override or system preference
  if (typeof window === 'undefined') {
    return cookieTheme || THEMES.LIGHT; // Default to light on server
  }
  
  // Client-side: override > system preference
  return getSavedTheme() || getSystemTheme();
}

/**
 * Check if theme is manually overridden
 */
export function hasThemeOverride(): boolean {
  if (typeof window === 'undefined') return false;
  
  const overrideTheme = parseThemeCookie(document.cookie, THEME_OVERRIDE_COOKIE_NAME);
  return overrideTheme !== null;
}