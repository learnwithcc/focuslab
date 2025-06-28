import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react({
      // Completely disable Fast Refresh in Storybook to prevent symbol conflicts
      fastRefresh: false,
      // Disable React refresh transforms that cause symbol duplication
      include: /\.(jsx?|tsx?)$/,
      exclude: [/node_modules/],
      babel: {
        // Disable React refresh transforms in Babel
        plugins: [],
        presets: []
      }
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '~': new URL('../app', import.meta.url).pathname,
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  // Completely disable HMR and Hot Reload in Storybook
  server: {
    hmr: false,
  },
  // Prevent any React refresh related optimizations
  optimizeDeps: {
    exclude: ['@vitejs/plugin-react'],
  },
});