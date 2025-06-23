import React from 'react';

// Pure HTML theme toggle that works without React hydration
export function ThemeToggle() {
  return (
    <>
      {/* Pure HTML theme toggle button */}
      <div 
        id="theme-toggle-container"
        className="fixed top-1/2 right-4 z-50 transform -translate-y-1/2"
        data-testid="theme-toggle-container"
      >
        <button
          id="theme-toggle-button"
          data-testid="theme-toggle-button"
          className="
            relative flex items-center justify-center overflow-hidden
            h-10 w-10 rounded-full border transition-all duration-300 ease-out
            shadow-lg backdrop-blur-sm cursor-pointer select-none
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
            bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 border-gray-200
            dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-blue-400 dark:border-gray-700
            dark:focus-visible:ring-offset-gray-900
          "
          type="button"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          <div className="flex items-center justify-center w-full h-full px-2">
            {/* Sun icon (visible in light mode) */}
            <svg 
              id="sun-icon"
              className="w-5 h-5 transition-all duration-200"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
            {/* Moon icon (visible in dark mode) */}
            <svg 
              id="moon-icon"
              className="w-5 h-5 transition-all duration-200 hidden"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            {/* Theme label (shown on hover) */}
            <span id="theme-label" className="text-xs font-medium whitespace-nowrap ml-2 hidden">
              Light
            </span>
          </div>
        </button>
      </div>

      {/* Pure JavaScript theme toggle functionality */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            console.log('ThemeToggle: Initializing pure JavaScript version');
            
            function getCurrentTheme() {
              return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            }
            
            function updateIcons(theme) {
              const sunIcon = document.getElementById('sun-icon');
              const moonIcon = document.getElementById('moon-icon');
              const label = document.getElementById('theme-label');
              
              if (theme === 'dark') {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
                if (label) label.textContent = 'Dark';
              } else {
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
                if (label) label.textContent = 'Light';
              }
            }
            
            function toggleTheme() {
              const currentTheme = getCurrentTheme();
              const newTheme = currentTheme === 'light' ? 'dark' : 'light';
              console.log('ThemeToggle: Switching from', currentTheme, 'to', newTheme);
              
              // Update DOM
              const root = document.documentElement;
              root.classList.remove('light', 'dark');
              root.classList.add(newTheme);
              root.setAttribute('data-theme', newTheme);
              root.style.colorScheme = newTheme;
              
              // Update icons
              updateIcons(newTheme);
              
              // Store in localStorage
              try {
                localStorage.setItem('focuslab-theme-preference', newTheme);
                console.log('ThemeToggle: Saved theme to localStorage:', newTheme);
              } catch (error) {
                console.warn('ThemeToggle: Could not save to localStorage:', error);
              }
            }
            
            function setupHoverEffects() {
              const button = document.getElementById('theme-toggle-button');
              const label = document.getElementById('theme-label');
              
              if (!button) return;
              
              let isMouseHover = false;
              let isKeyboardFocus = false;
              
              // Mouse hover effects
              button.addEventListener('mouseenter', function() {
                console.log('ThemeToggle: Mouse enter');
                isMouseHover = true;
                button.style.width = '120px';
                if (label) label.classList.remove('hidden');
              });
              
              button.addEventListener('mouseleave', function() {
                console.log('ThemeToggle: Mouse leave');
                isMouseHover = false;
                if (!isKeyboardFocus) {
                  button.style.width = '40px';
                  if (label) label.classList.add('hidden');
                }
              });
              
              // Keyboard navigation effects (only expand on Tab focus, not click focus)
              button.addEventListener('focus', function(e) {
                // Check if focus was triggered by keyboard (not mouse click)
                if (e.target.matches(':focus-visible')) {
                  console.log('ThemeToggle: Keyboard focus');
                  isKeyboardFocus = true;
                  button.style.width = '120px';
                  if (label) label.classList.remove('hidden');
                }
              });
              
              button.addEventListener('blur', function() {
                console.log('ThemeToggle: Blur');
                isKeyboardFocus = false;
                if (!isMouseHover) {
                  button.style.width = '40px';
                  if (label) label.classList.add('hidden');
                }
              });
              
              // Prevent focus on mouse click to avoid distracting highlight
              button.addEventListener('mousedown', function(e) {
                e.preventDefault();
              });
            }
            
            function init() {
              const button = document.getElementById('theme-toggle-button');
              if (!button) {
                console.log('ThemeToggle: Button not found, retrying in 100ms');
                setTimeout(init, 100);
                return;
              }
              
              console.log('ThemeToggle: Button found, setting up functionality');
              
              // Set initial icon state
              updateIcons(getCurrentTheme());
              
              // Add click handler
              button.addEventListener('click', toggleTheme);
              
              // Setup hover effects
              setupHoverEffects();
              
              console.log('ThemeToggle: Pure JavaScript version ready');
            }
            
            // Initialize when DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', init);
            } else {
              init();
            }
          })();
        `
      }} />
    </>
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