/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import * as Sentry from "@sentry/remix";
import React from "react";

// Only initialize Sentry if we have a valid DSN from the window object
// The DSN should be injected by the server in a script tag
if (typeof window !== 'undefined' && window.ENV?.SENTRY_DSN && window.ENV.SENTRY_DSN !== 'YOUR_SENTRY_DSN_GOES_HERE') {
  Sentry.init({
    dsn: window.ENV.SENTRY_DSN,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration({
        useEffect: React.useEffect,
      }),
      Sentry.replayIntegration(),
    ],
  });
}

console.log('🚀 entry.client.tsx: Starting hydration...');

// Add a global error handler for React errors
window.addEventListener('error', (event) => {
  console.error('❌ Global error during hydration:', event.error);
  console.error('❌ Error message:', event.message);
  console.error('❌ Error filename:', event.filename);
  console.error('❌ Error stack:', event.error?.stack);
});

startTransition(() => {
  console.log('🚀 entry.client.tsx: Inside startTransition');
  
  try {
    hydrateRoot(
      document,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>
    );
    
    console.log('🚀 entry.client.tsx: hydrateRoot called successfully');
  } catch (error) {
    console.error('❌ entry.client.tsx: hydrateRoot failed:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
  }
});
