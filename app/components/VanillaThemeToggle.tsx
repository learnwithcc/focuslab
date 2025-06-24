// Vanilla JavaScript theme toggle that works without React hydration
// This bypasses all RefreshRuntime and React mounting issues

export function VanillaThemeToggle() {
  // Renders a theme toggle that matches the original ThemeToggle design
  return (
    <div 
      id="vanilla-theme-toggle"
      className="fixed right-4 z-50 transform -translate-y-1/2"
      style={{ top: '20%' }}
    >
      <button
        id="vanilla-theme-button"
        className="
          relative flex items-center justify-center overflow-hidden
          h-10 w-10 rounded-full border transition-all duration-300
          shadow-lg backdrop-blur-sm cursor-pointer select-none
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 border-gray-200
          dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-blue-400 dark:border-gray-700
          dark:focus-visible:ring-offset-gray-900
        "
        type="button"
        aria-label="Toggle theme"
        title="Toggle theme"
        style={{ 
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: '2.5rem' // 40px minimum width
        }}
      >
        <span 
          id="vanilla-theme-icon" 
          className="flex items-center justify-center transition-all duration-300"
          style={{ transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* Icon will be injected here by JavaScript */}
        </span>
        <span 
          id="vanilla-theme-text" 
          className="ml-2 text-sm font-medium whitespace-nowrap opacity-0 transition-all duration-300"
          style={{ 
            width: '0px',
            overflow: 'hidden',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Text will be injected here by JavaScript */}
        </span>
      </button>
    </div>
  );
}

// Vanilla JS script that works even when React fails
export const VanillaThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          // SVG Icons
          const SUN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" /></svg>';
          const MOON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>';
          
          function initVanillaThemeToggle() {
            const container = document.getElementById('vanilla-theme-toggle');
            const button = document.getElementById('vanilla-theme-button');
            const icon = document.getElementById('vanilla-theme-icon');
            const text = document.getElementById('vanilla-theme-text');
            
            if (!container || !button || !icon || !text) {
              console.warn('VanillaThemeToggle: Elements not found');
              return;
            }
            
            // Get current theme
            function getCurrentTheme() {
              return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            }
            
            // Update button icon and text based on current theme
            function updateButton() {
              const theme = getCurrentTheme();
              
              // Show current theme icon (sun for light, moon for dark)
              if (theme === 'light') {
                icon.innerHTML = SUN_SVG;
                text.textContent = 'Light';
                button.setAttribute('aria-label', 'Switch to dark mode');
                button.setAttribute('title', 'Switch to dark mode');
              } else {
                icon.innerHTML = MOON_SVG;
                text.textContent = 'Dark';
                button.setAttribute('aria-label', 'Switch to light mode');
                button.setAttribute('title', 'Switch to light mode');
              }
            }
            
            // Handle hover expansion
            function expandButton() {
              button.style.width = '7.5rem'; // 120px
              text.style.width = 'auto';
              text.style.opacity = '1';
            }
            
            function contractButton() {
              button.style.width = '2.5rem'; // 40px
              text.style.width = '0px';
              text.style.opacity = '0';
            }
            
            // Apply theme to DOM
            function applyTheme(theme) {
              const root = document.documentElement;
              root.classList.remove('light', 'dark');
              root.classList.add(theme);
              root.setAttribute('data-theme', theme);
              root.style.colorScheme = theme;
              
              try {
                localStorage.setItem('focuslab-theme-preference', theme);
              } catch (e) {
                console.warn('Could not save theme preference:', e);
              }
              
              updateButton();
              console.log('VanillaThemeToggle: Applied theme:', theme);
            }
            
            // Toggle theme
            function toggleTheme() {
              const currentTheme = getCurrentTheme();
              const newTheme = currentTheme === 'light' ? 'dark' : 'light';
              applyTheme(newTheme);
            }
            
            // Set up event handlers
            button.addEventListener('click', toggleTheme);
            button.addEventListener('mouseenter', expandButton);
            button.addEventListener('mouseleave', contractButton);
            
            // Initialize button
            updateButton();
            contractButton(); // Start in contracted state
            
            console.log('VanillaThemeToggle: Initialized successfully');
          }
          
          // Try to initialize immediately
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initVanillaThemeToggle);
          } else {
            initVanillaThemeToggle();
          }
          
          // Also try after a delay in case DOM changes
          setTimeout(initVanillaThemeToggle, 500);
        })();
      `,
    }}
  />
);