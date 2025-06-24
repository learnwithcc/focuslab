// Vanilla JavaScript theme toggle that works without React hydration
// This bypasses all RefreshRuntime and React mounting issues

export function VanillaThemeToggle() {
  // This renders a basic button that gets enhanced with vanilla JS
  return (
    <div 
      id="vanilla-theme-toggle"
      className="fixed right-4 z-50 transform -translate-y-1/2"
      style={{ top: '20%', display: 'none' }} // Hidden until JS loads
    >
      <button
        id="vanilla-theme-button"
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
        <span id="vanilla-theme-icon" className="w-5 h-5">🌙</span>
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
          function initVanillaThemeToggle() {
            const container = document.getElementById('vanilla-theme-toggle');
            const button = document.getElementById('vanilla-theme-button');
            
            if (!container || !button) {
              console.warn('VanillaThemeToggle: Elements not found');
              return;
            }
            
            // Show the toggle
            container.style.display = 'block';
            
            // Get current theme
            function getCurrentTheme() {
              return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            }
            
            // Update button icon based on theme
            function updateButton() {
              const theme = getCurrentTheme();
              const icon = document.getElementById('vanilla-theme-icon');
              if (icon) {
                icon.textContent = theme === 'light' ? '🌙' : '☀️';
              }
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
            
            // Set up click handler
            button.addEventListener('click', toggleTheme);
            
            // Initialize button text
            updateButton();
            
            console.log('VanillaThemeToggle: Initialized successfully');
          }
          
          // Try to initialize immediately
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initVanillaThemeToggle);
          } else {
            initVanillaThemeToggle();
          }
          
          // Also try after a delay in case DOM changes
          setTimeout(initVanillaThemeToggle, 1000);
        })();
      `,
    }}
  />
);