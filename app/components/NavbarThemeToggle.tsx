import { useEffect, useState } from 'react';
import { 
  THEMES, 
  type ThemeValue,
  applyThemeToDocument,
  saveThemePreference,
  hasThemeOverride,
  clearThemeOverride,
  getSystemTheme
} from '~/utils/theme';
import { trackEvent } from '~/utils/posthog';

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

const AutoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

// Client-side theme detection helper
function getSavedTheme(): ThemeValue | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const match = document.cookie.match(/focuslab-theme-override=([^;]+)/);
    const savedTheme = match ? match[1] : null;
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
  } catch {
    return null;
  }
}

export function NavbarThemeToggle() {
  // Start with values that match server-rendered state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeValue>(THEMES.LIGHT); // Default to light like server
  const [isAuto, setIsAuto] = useState(true); // Default to auto like server
  const [isExpanded, setIsExpanded] = useState(false);

  // Only run on client after mount
  useEffect(() => {
    // Use same logic as server to prevent hydration mismatch
    let currentTheme: ThemeValue;
    
    // First check for saved theme (same as server-side getThemeFromRequest)
    const savedTheme = getSavedTheme();
    if (savedTheme) {
      currentTheme = savedTheme;
    } else {
      // Use system preference if no override exists
      currentTheme = getSystemTheme();
    }
    
    // Ensure DOM matches our detected theme
    applyThemeToDocument(currentTheme);
    
    const hasOverride = hasThemeOverride();
    
    // Update state in one batch to prevent multiple renders
    setTheme(currentTheme);
    setIsAuto(!hasOverride);
    setMounted(true);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      // Only update if no manual override exists
      if (!hasThemeOverride()) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        const previousTheme = theme;
        
        applyThemeToDocument(newTheme);
        setTheme(newTheme);
        setIsAuto(true);

        // Track automatic system theme change
        if (previousTheme && previousTheme !== newTheme) {
          trackEvent('theme_auto_change', {
            device_type: 'desktop',
            trigger: 'system_preference_change',
            previous_theme: previousTheme,
            new_theme: newTheme,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight
          });
        }
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
    
    const previousState = isAuto ? 'auto' : theme;
    let newState: string;
    
    if (isAuto) {
      // Auto → Light
      const newTheme = THEMES.LIGHT;
      applyThemeToDocument(newTheme);
      saveThemePreference(newTheme);
      setTheme(newTheme);
      setIsAuto(false);
      newState = 'light';
    } else if (theme === THEMES.LIGHT) {
      // Light → Dark
      const newTheme = THEMES.DARK;
      applyThemeToDocument(newTheme);
      saveThemePreference(newTheme);
      setTheme(newTheme);
      setIsAuto(false);
      newState = 'dark';
    } else {
      // Dark → Auto
      clearThemeOverride();
      const systemTheme = getSystemTheme();
      setTheme(systemTheme);
      setIsAuto(true);
      newState = 'auto';
    }

    // Track the theme toggle event
    trackEvent('theme_toggle', {
      device_type: 'desktop',
      toggle_type: 'navbar_button',
      previous_theme: previousState,
      new_theme: newState,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    });
  };

  // Don't render interactive elements until mounted to prevent hydration issues
  if (!mounted) {
    // Render static version that matches what will be shown after hydration
    return (
      <div className="flex items-center">
        <div
          className="
            relative flex items-center justify-center overflow-hidden
            h-10 w-10 rounded-full border transition-all duration-300
            shadow-sm backdrop-blur-sm
            bg-white/80 text-gray-700 border-gray-200
            dark:bg-gray-800/80 dark:text-gray-300 dark:border-gray-700
          "
          style={{ 
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '2.5rem'
          }}
        >
          {/* Show auto icon as default to match initial state */}
          <AutoIcon />
        </div>
      </div>
    );
  }

  const currentTheme = theme || THEMES.LIGHT;
  
  // Determine what to show
  const getThemeDisplay = () => {
    if (isAuto) {
      return { icon: <AutoIcon />, label: 'Auto', ariaLabel: 'Switch to light mode (currently following system)' };
    } else if (currentTheme === THEMES.LIGHT) {
      return { icon: <SunIcon />, label: 'Light', ariaLabel: 'Switch to dark mode' };
    } else {
      return { icon: <MoonIcon />, label: 'Dark', ariaLabel: 'Switch to automatic (system preference)' };
    }
  };
  
  const { icon, label, ariaLabel } = getThemeDisplay();

  return (
    <div className="flex items-center">
      <button
        className="
          relative flex items-center justify-center overflow-hidden
          h-10 rounded-full border transition-all duration-300
          shadow-sm backdrop-blur-sm cursor-pointer select-none
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          bg-white/80 hover:bg-white/90 text-gray-700 hover:text-blue-600 border-gray-200 hover:border-blue-300
          dark:bg-gray-800/80 dark:hover:bg-gray-800/90 dark:text-gray-300 dark:hover:text-blue-400 dark:border-gray-700 dark:hover:border-blue-600
          dark:focus-visible:ring-offset-gray-900
        "
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        onClick={toggleTheme}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onFocus={() => setIsExpanded(true)}
        onBlur={() => setIsExpanded(false)}
        style={{ 
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          width: isExpanded ? '6.5rem' : '2.5rem',
          minWidth: '2.5rem'
        }}
      >
        <span 
          className="flex items-center justify-center transition-all duration-300"
          style={{ 
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            width: '2.5rem',
            flexShrink: 0
          }}
        >
          {icon}
        </span>
        <span 
          className="text-sm font-medium whitespace-nowrap transition-all duration-300"
          style={{ 
            marginLeft: isExpanded ? '0.5rem' : '0px',
            width: isExpanded ? 'auto' : '0px',
            opacity: isExpanded ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {label}
        </span>
      </button>
    </div>
  );
}

// Mobile version for navbar (simplified, no expansion)
export function MobileNavbarThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeValue>(THEMES.LIGHT);
  const [isAuto, setIsAuto] = useState(true);

  useEffect(() => {
    // Use same logic as server to prevent hydration mismatch
    let currentTheme: ThemeValue;
    
    // First check for saved theme (same as server-side getThemeFromRequest)
    const savedTheme = getSavedTheme();
    if (savedTheme) {
      currentTheme = savedTheme;
    } else {
      // Use system preference if no override exists
      currentTheme = getSystemTheme();
    }
    
    // Ensure DOM matches our detected theme
    applyThemeToDocument(currentTheme);
    
    const hasOverride = hasThemeOverride();
    
    setTheme(currentTheme);
    setIsAuto(!hasOverride);
    setMounted(true);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (!hasThemeOverride()) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        const previousTheme = theme;
        
        applyThemeToDocument(newTheme);
        setTheme(newTheme);
        setIsAuto(true);

        // Track automatic system theme change
        if (previousTheme && previousTheme !== newTheme) {
          trackEvent('theme_auto_change', {
            device_type: 'mobile',
            trigger: 'system_preference_change',
            previous_theme: previousTheme,
            new_theme: newTheme,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight
          });
        }
      }
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }
    
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
    
    const previousState = isAuto ? 'auto' : theme;
    let newState: string;
    
    if (isAuto) {
      const newTheme = THEMES.LIGHT;
      applyThemeToDocument(newTheme);
      saveThemePreference(newTheme);
      setTheme(newTheme);
      setIsAuto(false);
      newState = 'light';
    } else if (theme === THEMES.LIGHT) {
      const newTheme = THEMES.DARK;
      applyThemeToDocument(newTheme);
      saveThemePreference(newTheme);
      setTheme(newTheme);
      setIsAuto(false);
      newState = 'dark';
    } else {
      clearThemeOverride();
      const systemTheme = getSystemTheme();
      setTheme(systemTheme);
      setIsAuto(true);
      newState = 'auto';
    }

    // Track the theme toggle event for mobile
    trackEvent('theme_toggle', {
      device_type: 'mobile',
      toggle_type: 'navbar_button',
      previous_theme: previousState,
      new_theme: newState,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    });
  };

  if (!mounted) {
    return (
      <button 
        className="
          relative flex items-center justify-center
          h-10 w-10 rounded-full border transition-all duration-200
          shadow-sm backdrop-blur-sm
          bg-white/80 text-gray-700 border-gray-200
          dark:bg-gray-800/80 dark:text-gray-300 dark:border-gray-700
        "
        disabled
        aria-label="Theme toggle loading"
      >
        <AutoIcon />
      </button>
    );
  }

  const getThemeDisplay = () => {
    if (isAuto) {
      return { icon: <AutoIcon />, ariaLabel: 'Switch to light mode (currently following system)' };
    } else if (theme === THEMES.LIGHT) {
      return { icon: <SunIcon />, ariaLabel: 'Switch to dark mode' };
    } else {
      return { icon: <MoonIcon />, ariaLabel: 'Switch to automatic (system preference)' };
    }
  };
  
  const { icon, ariaLabel } = getThemeDisplay();

  return (
    <button
      className="
        relative flex items-center justify-center
        h-10 w-10 rounded-full border transition-all duration-200
        shadow-sm backdrop-blur-sm cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        bg-white/80 hover:bg-white/90 text-gray-700 hover:text-blue-600 border-gray-200 hover:border-blue-300
        dark:bg-gray-800/80 dark:hover:bg-gray-800/90 dark:text-gray-300 dark:hover:text-blue-400 dark:border-gray-700 dark:hover:border-blue-600
        dark:focus-visible:ring-offset-gray-900
      "
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={toggleTheme}
    >
      {icon}
    </button>
  );
} 