import { addons } from 'storybook/internal/manager-api';
import { themes } from 'storybook/internal/theming';

// Enhanced manager configuration for better docs theme handling
addons.setConfig({
  theme: {
    ...themes.light,
    base: 'light',
    brandTitle: 'FocusLab Components',
    brandUrl: 'https://focuslab.dev',
    appBg: '#ffffff',
    appContentBg: '#ffffff', 
    appPreviewBg: '#ffffff',
    colorPrimary: '#4a0e4e',
    colorSecondary: '#00b2a9',
  },
});

// Listen for theme changes and update docs theme accordingly
if (typeof window !== 'undefined') {
  const updateDocsTheme = () => {
    const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentDocument) {
      const isDark = iframe.contentDocument.documentElement.classList.contains('dark');
      
      // Update manager theme based on preview theme
      if (isDark) {
        addons.setConfig({
          theme: {
            ...themes.dark,
            base: 'dark',
            brandTitle: 'FocusLab Components',
            brandUrl: 'https://focuslab.dev',
            appBg: '#050505',
            appContentBg: '#0B0F24',
            appPreviewBg: '#090D22',
            colorPrimary: '#c77dff',
            colorSecondary: '#06ffa5',
          },
        });
      } else {
        addons.setConfig({
          theme: {
            ...themes.light,
            base: 'light',
            brandTitle: 'FocusLab Components',
            brandUrl: 'https://focuslab.dev',
            appBg: '#ffffff',
            appContentBg: '#ffffff', 
            appPreviewBg: '#ffffff',
            colorPrimary: '#4a0e4e',
            colorSecondary: '#00b2a9',
          },
        });
      }
    }
  };

  // Check for theme changes periodically
  setInterval(updateDocsTheme, 1000);
  
  // Also check on load
  setTimeout(updateDocsTheme, 2000);
}