/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './app/test/setup-test-env.ts',
    include: ['./app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,jsx,tsx}'],
  },
}); 