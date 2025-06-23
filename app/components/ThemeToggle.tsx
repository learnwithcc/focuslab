import React, { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from './icons';

// Client-side theme toggle that uses proper React patterns
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Mount on client side
  useEffect(() => {
    setMounted(true);
    
    // Initialize theme
    const isDark = document.documentElement.classList.contains('dark');
    const initialTheme = isDark ? 'dark' : 'light';
    setCurrentTheme(initialTheme);
    
    console.log('ThemeToggle: Mounted with theme:', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    console.log('ThemeToggle: Switching from', currentTheme, 'to', newTheme);
    
    // Update DOM
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    root.setAttribute('data-theme', newTheme);
    root.style.colorScheme = newTheme;
    
    // Update state
    setCurrentTheme(newTheme);
    
    // Store in localStorage
    try {
      localStorage.setItem('focuslab-theme-preference', newTheme);
      console.log('ThemeToggle: Saved theme to localStorage:', newTheme);
    } catch (error) {
      console.warn('ThemeToggle: Could not save to localStorage:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent focus on mouse click to avoid distracting highlight
    e.preventDefault();
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  const CurrentIcon = currentTheme === 'light' ? SunIcon : MoonIcon;
  const nextThemeLabel = currentTheme === 'light' ? 'dark' : 'light';

  return (
    <div 
      className="fixed top-1/5 right-4 z-50 transform -translate-y-1/2"
      data-testid="theme-toggle-container"
    >
      <button
        data-testid="theme-toggle-button"
        className="
          relative flex items-center justify-center overflow-hidden
          h-10 rounded-full border transition-all duration-300 ease-out
          shadow-lg backdrop-blur-sm cursor-pointer select-none
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 border-gray-200
          dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-blue-400 dark:border-gray-700
          dark:focus-visible:ring-offset-gray-900
        "
        style={{
          width: isHovered ? '120px' : '40px',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={toggleTheme}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
        aria-label={`Switch to ${nextThemeLabel} theme`}
        title={`Switch to ${nextThemeLabel} theme`}
        type="button"
      >
        <div className="flex items-center justify-center w-full h-full px-2">
          {isHovered ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <CurrentIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium whitespace-nowrap">
                  {currentTheme === 'light' ? 'Light' : 'Dark'}
                </span>
              </div>
              <div className="w-4 h-4 flex-shrink-0 opacity-60">
                {currentTheme === 'light' ? (
                  <MoonIcon className="w-4 h-4" />
                ) : (
                  <SunIcon className="w-4 h-4" />
                )}
              </div>
            </div>
          ) : (
            <CurrentIcon className="w-5 h-5" />
          )}
        </div>
      </button>
    </div>
  );
}

// Add a script to initialize theme before React loads
export const ThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            var stored = localStorage.getItem('focuslab-theme-preference');
            var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            var root = document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(theme);
            root.setAttribute('data-theme', theme);
            root.style.colorScheme = theme;
            console.log('ThemeScript: Applied theme:', theme);
          } catch (e) {
            console.warn('ThemeScript: Error:', e);
          }
        })();
      `,
    }}
  />
);