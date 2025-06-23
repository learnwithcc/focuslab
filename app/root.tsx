import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from '@remix-run/node';
import * as Sentry from "@sentry/remix";
import { createSecurityHeaders } from "~/utils/security";
import { CookieConsentProvider } from "~/contexts";
import { CookieManager, Header, ErrorBoundary } from "~/components";
import { NonceProvider } from '~/utils/nonce-provider';
import { useAxe } from '~/utils/axe';
import { generateNonce } from '~/utils/nonce-generator';
import { Analytics } from "@vercel/analytics/react";
import { PHProvider } from '~/utils/posthog';
import { useEffect, useState } from 'react';

import "./styles/tailwind.css";

Sentry.init({
  dsn: process.env['SENTRY_DSN'] || "YOUR_SENTRY_DSN_GOES_HERE",
  tracesSampleRate: 1.0,
});

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({}: LoaderFunctionArgs) {
  const nonce = generateNonce();
  return json({ nonce });
}

// Apply security headers to all routes
export const headers = createSecurityHeaders;

/**
 * Layout component props interface for better type safety
 * Ensures proper typing for all layout-related props
 */
interface LayoutProps {
  children: React.ReactNode;
  nonce: string;
}

/**
 * ClientOnlyWrapper component to prevent hydration mismatches
 * Renders children only after client-side hydration is complete
 */
function ClientOnlyWrapper({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Main Layout component that wraps all routes with consistent structure
 * 
 * LAYOUT ARCHITECTURE:
 * - Single Header source: Prevents duplication across all routes
 * - ErrorBoundary: Catches and handles layout-level errors gracefully
 * - Main content area: Semantic HTML with proper ARIA roles
 * - Global providers: Cookie consent, analytics, theme management
 * - Hydration-safe rendering: Prevents SSR/client mismatches
 * 
 * COMPOSITION PATTERNS:
 * - Global elements (Header, CookieManager) at layout level
 * - Route-specific content isolated in main element
 * - Provider hierarchy: NonceProvider > CookieConsentProvider > PHProvider
 * - Error boundaries protect against layout crashes
 * 
 * HYDRATION CONSISTENCY:
 * - ClientOnlyWrapper prevents client-server rendering mismatches
 * - Conditional rendering safely handled with hydration checks
 * - Server-side and client-side rendering produce identical DOM structure
 */
export function Layout({ children, nonce }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground">
        <ErrorBoundary fallback={<div>Something went wrong with the layout.</div>}>
          <PHProvider>
            <CookieConsentProvider>
              {/* 
                GLOBAL HEADER - Single Source of Navigation
                - Rendered once for all routes to prevent duplication
                - Contains main navigation, logo, and mobile menu
                - Consistent across all pages without route-specific headers
              */}
              <Header />
              
              {/* 
                MAIN CONTENT AREA - Route-Specific Content
                - Semantic main element with proper ARIA role
                - Contains only route-specific content (no global elements)
                - Outlet renders the current route component
                - Skip link target for accessibility
              */}
              <main id="main-content" role="main" className="flex-1">
                                 <ErrorBoundary fallback={<div>Something went wrong with this page.</div>}>
                   {children}
                 </ErrorBoundary>
               </main>
              
              {/* 
                GLOBAL COOKIE MANAGER - Hydration-Safe
                - Wrapped in ClientOnlyWrapper to prevent hydration mismatches
                - Only renders after client-side hydration is complete
                - Manages cookie consent banner and modal
              */}
              <ClientOnlyWrapper>
                <CookieManager />
              </ClientOnlyWrapper>
            </CookieConsentProvider>
          </PHProvider>
        </ErrorBoundary>
        
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <Analytics />
      </body>
    </html>
  );
}

/**
 * Main App component with enhanced hydration handling
 * - Uses NonceProvider for CSP security
 * - Integrates accessibility checking in development
 * - Wraps everything in Layout component for consistent structure
 */
const App = () => {
  const { nonce } = useLoaderData<typeof loader>();
  useAxe();

  return (
    <NonceProvider nonce={nonce}>
      <Layout nonce={nonce}>
        <Outlet />
      </Layout>
    </NonceProvider>
  );
};

export default Sentry.withSentry(App);
