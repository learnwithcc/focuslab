import type { Preview } from '@storybook/react-vite';
import '../app/styles/tailwind.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: {
        base: 'light',
        colorPrimary: '#8b5cf6',
        colorSecondary: '#6366f1',
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
        wide: {
          name: 'Wide',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light theme' },
          { value: 'dark', icon: 'moon', title: 'Dark theme' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      
      // Apply theme to the preview iframe
      const htmlElement = document.documentElement;
      htmlElement.classList.remove('light', 'dark');
      htmlElement.classList.add(theme);
      htmlElement.setAttribute('data-theme', theme);
      htmlElement.style.colorScheme = theme;
      
      // Apply background color
      document.body.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
      document.body.style.color = theme === 'dark' ? '#f8fafc' : '#1e293b';
      
      return (
        <div 
          className={`min-h-screen bg-background text-foreground ${theme}`}
          style={{
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            color: theme === 'dark' ? '#f8fafc' : '#1e293b',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;