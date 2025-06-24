/// <reference types="vitest" />

import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from '@vitejs/plugin-react';
import { vercelPreset } from '@vercel/remix/vite';

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    !process.env['VITEST'] && !process.env['STORYBOOK'] && remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      presets: [vercelPreset()],
    }),
    tsconfigPaths(),
    (!process.env['VITEST'] && !process.env['STORYBOOK']) ? react() : null,
    process.env['STORYBOOK'] && react(),
  ].filter(Boolean),
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
