/// <reference types="vitest" />

import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from '@vitejs/plugin-react';
import { vercelPreset } from '@vercel/remix/vite';

installGlobals();


export default defineConfig({
  plugins: [
    !process.env['VITEST'] && !process.env['STORYBOOK'] && remix(),
    tsconfigPaths(),
    process.env['STORYBOOK'] && react(),
  ].filter(Boolean),
  define: {
    'process.env': {},
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './app/test/setup-test-env.tsx',
    include: ['./app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  server: {
    port: 3000,
  },
  ssr: {
    noExternal: ['remix-themes', 'posthog-js', 'posthog-js/react'],
  },
});
