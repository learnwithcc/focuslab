import { useEffect, useState } from 'react';
import { 
  THEMES, 
  type ThemeValue,
  applyThemeToDocument,
  saveThemePreference,
  hasThemeOverride
} from '~/utils/theme';

// SVG Icons as components for better SSR
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M6.34 17.66l-1.41 1.41" />
    <path d="M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export function VanillaThemeToggle() {
  // Start with undefined to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeValue | undefined>(undefined);
  const [isExpanded, setIsExpanded] = useState(false);

  // Only run on client after mount
  useEffect(() => {
    setMounted(true);
    
    // Get the actual theme from DOM
    const currentTheme = document.documentElement.classList.contains(THEMES.DARK) 
      ? THEMES.DARK 
      : THEMES.LIGHT;
    
    setTheme(currentTheme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      // Only update if no manual override exists
      if (!hasThemeOverride()) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        applyThemeToDocument(newTheme);
        setTheme(newTheme);
      }
    };
    
    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }
    
    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    if (!theme) return;
    
    const newTheme = theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    
    // Apply theme immediately
    applyThemeToDocument(newTheme);
    saveThemePreference(newTheme);
    setTheme(newTheme);
  };

  // Don't render interactive elements until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div 
        className="fixed right-4 z-50 transform -translate-y-1/2"
        style={{ top: '20%' }}
      >
        <div
          className="
            relative flex items-center justify-center overflow-hidden
            h-10 w-10 rounded-full border transition-all duration-300
            shadow-lg backdrop-blur-sm
            bg-white/90 text-gray-700 border-gray-200
            dark:bg-gray-800/90 dark:text-gray-300 dark:border-gray-700
          "
          style={{ 
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '2.5rem'
          }}
        >
          {/* Empty placeholder during SSR */}
        </div>
      </div>
    );
  }

  const currentTheme = theme || THEMES.LIGHT;
  const isLight = currentTheme === THEMES.LIGHT;

  return (
    <div 
      className="fixed right-4 z-50 transform -translate-y-1/2"
      style={{ top: '20%' }}
    >
      <button
        className="
          relative flex items-center justify-center overflow-hidden
          h-10 rounded-full border transition-all duration-300
          shadow-lg backdrop-blur-sm cursor-pointer select-none
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 border-gray-200
          dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-blue-400 dark:border-gray-700
          dark:focus-visible:ring-offset-gray-900
        "
        type="button"
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        onClick={toggleTheme}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        style={{ 
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          width: isExpanded ? '7.5rem' : '2.5rem',
          minWidth: '2.5rem'
        }}
      >
        <span 
          className="flex items-center justify-center transition-all duration-300"
          style={{ transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {isLight ? <SunIcon /> : <MoonIcon />}
        </span>
        <span 
          className="ml-2 text-sm font-medium whitespace-nowrap transition-all duration-300"
          style={{ 
            width: isExpanded ? 'auto' : '0px',
            opacity: isExpanded ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {isLight ? 'Light' : 'Dark'}
        </span>
      </button>
    </div>
  );
}

// Script to prevent FOUC - runs before React hydration
export const VanillaThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          function getCookie(name) {
            const match = document.cookie.match(new RegExp(name + '=([^;]+)'));
            return match ? match[1] : null;
          }
          
          function getSystemTheme() {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
              ? 'dark' 
              : 'light';
          }
          
          // Check for manual override first (session-based)
          const overrideTheme = getCookie('focuslab-theme-override');
          
          // Use override if present, otherwise follow system preference
          const theme = overrideTheme || getSystemTheme();
          
          // Apply theme immediately to prevent flash
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(theme);
          root.setAttribute('data-theme', theme);
          root.style.colorScheme = theme;
          
          // Listen for system theme changes when no override is set
          if (!overrideTheme && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
              // Only update if no manual override exists
              if (!getCookie('focuslab-theme-override')) {
                const newTheme = e.matches ? 'dark' : 'light';
                root.classList.remove('light', 'dark');
                root.classList.add(newTheme);
                root.setAttribute('data-theme', newTheme);
                root.style.colorScheme = newTheme;
              }
            });
          }
        })();
      `,
    }}
  />
);