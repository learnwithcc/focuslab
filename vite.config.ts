/// <reference types="vitest" />

// Load environment variables early
import 'dotenv/config';

import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from '@vitejs/plugin-react';
import { vercelPreset } from '@vercel/remix/vite';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

installGlobals();

// Detect if we're building for Vercel
const isVercel = process.env['VERCEL'] === '1';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      mdx({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeHighlight],
        providerImportSource: '@mdx-js/react',
      }),
      !process.env['VITEST'] && !process.env['STORYBOOK'] && remix({
        // Apply vercelPreset only for Vercel builds
        ...(isVercel ? { presets: [vercelPreset()] } : {})
      }),
      tsconfigPaths(),
      process.env['STORYBOOK'] && react(),
    ].filter(Boolean),
    define: {
      // CRITICAL: Define process polyfill to prevent "process is not defined" errors
      // This must work for both development and production (Vercel) builds
      'process.env.NODE_ENV': JSON.stringify(env['NODE_ENV'] || 'development'),
      'process.env.POSTHOG_API_KEY': JSON.stringify(env['POSTHOG_API_KEY'] || ''),
      'process.env': JSON.stringify({
        NODE_ENV: env['NODE_ENV'] || 'development',
        POSTHOG_API_KEY: env['POSTHOG_API_KEY'] || '',
      }),
      global: 'globalThis',
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
  };
});
