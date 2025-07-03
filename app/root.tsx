import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import * as Sentry from "@sentry/remix";
import { createSecurityHeaders } from "~/utils/security";
import { CookieConsentProvider } from "~/contexts";
import { CookieManager, Header, Footer, SkipNavigation, ErrorBoundary as CustomErrorBoundary, AnalyticsErrorBoundary } from "~/components";

import { ThemeProvider } from "~/components/theme-provider";
import { NonceProvider } from '~/utils/nonce-provider';
import { useAxe } from '~/utils/axe';
import { generateNonce } from '~/utils/nonce-generator';
import { Analytics } from "@vercel/analytics/react";
import { PHProvider } from '~/utils/posthog';
import { getThemeFromRequest } from '~/utils/theme';

import "./styles/tailwind.css";
import "./styles/index.css";

// Only initialize Sentry if DSN is provided
if (process.env['SENTRY_DSN'] && process.env['SENTRY_DSN'] !== 'YOUR_SENTRY_DSN_GOES_HERE') {
  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    tracesSampleRate: 1.0,
  });
}

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

export async function loader({ request }: LoaderFunctionArgs) {
  const nonce = generateNonce();
  
  // Get theme preference from cookie
  const theme = getThemeFromRequest(request);
  
  // Pass environment variables to the client safely
  const env = {
    NODE_ENV: process.env['NODE_ENV'] || 'development',
    POSTHOG_API_KEY: process.env['POSTHOG_API_KEY'] || '',
    POSTHOG_API_HOST: process.env['POSTHOG_API_HOST'] || 'https://us.i.posthog.com',
    SENTRY_DSN: process.env['SENTRY_DSN'] || '',
  };
  
  return json({ nonce, env, theme });
}

// Apply security headers to all routes
export const headers = createSecurityHeaders;

// Define the loader data type for better type safety
type LoaderData = {
  nonce: string;
  env: {
    NODE_ENV: string;
    POSTHOG_API_KEY: string;
    POSTHOG_API_HOST: string;
    SENTRY_DSN: string;
  };
  theme: string | null;
};

// Safe helper function to get loader data with fallbacks
function getSafeLoaderData(): LoaderData | null {
  try {
    return useLoaderData<typeof loader>();
  } catch (error) {
    // This can happen in error boundary contexts
    console.warn('🚨 getSafeLoaderData: useLoaderData failed:', error);
    return null;
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  // Safe data extraction that handles error contexts where loader hasn't run
  const loaderData = getSafeLoaderData();

  // Provide safe defaults when loader data is unavailable
  const nonce = loaderData?.nonce || 'fallback-nonce';
  const env = loaderData?.env || null;
  const theme = loaderData?.theme || '';
  
  // Don't apply theme class on server to prevent hydration mismatch
  // The VanillaThemeScript will handle theme application
  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {env && (
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(env)}`,
            }}
          />
        )}
      </head>
      <body className="bg-background text-foreground">
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <AnalyticsErrorBoundary service="vercel">
          <Analytics />
        </AnalyticsErrorBoundary>
      </body>
    </html>
  );
}

function App() {
  console.log('🚀 App: Component rendering');
  
  // Safe data extraction that handles error contexts where loader hasn't run
  const loaderData = (() => {
    try {
      return useLoaderData<typeof loader>();
    } catch (error) {
      // In error contexts, useLoaderData throws or returns undefined
      console.warn('🚨 App: useLoaderData failed, using fallback values:', error);
      return null;
    }
  })();

  // Provide safe defaults when loader data is unavailable
  const nonce = loaderData?.nonce || 'fallback-nonce';
  const env = loaderData?.env || null;
  const theme = loaderData?.theme || '';
  useAxe();

  // Safe environment object for PHProvider
  const safeEnv = env ? {
    POSTHOG_API_KEY: env.POSTHOG_API_KEY,
    POSTHOG_API_HOST: env.POSTHOG_API_HOST
  } : undefined;

  return (
    <CustomErrorBoundary level="app" name="root-app">
      <NonceProvider nonce={nonce}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        <CookieConsentProvider>
          <AnalyticsErrorBoundary service="posthog">
            <PHProvider env={safeEnv}>
            <SkipNavigation />
            <CustomErrorBoundary level="component" name="header" enableRetry={true}>
              <Header />
            </CustomErrorBoundary>
            <main id="main-content">
              <Outlet />
            </main>
            <CustomErrorBoundary level="component" name="footer" enableRetry={true}>
              <Footer />
            </CustomErrorBoundary>
            <CookieManager />

            </PHProvider>
          </AnalyticsErrorBoundary>
        </CookieConsentProvider>
        </ThemeProvider>
      </NonceProvider>
    </CustomErrorBoundary>
  );
}

// Error Boundary component that renders using Layout safely
export function ErrorBoundary() {
  const error = useRouteError();
  
  // Safe data extraction for error boundary
  const loaderData = (() => {
    try {
      return useLoaderData<typeof loader>();
    } catch (err) {
      // Expected in error contexts - return safe defaults
      return null;
    }
  })();

  const nonce = loaderData?.nonce || 'error-fallback-nonce';
  
  let errorMessage = "Something went wrong";
  let errorStatus = 500;
  
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - FocusLab</title>
        <Links />
      </head>
      <body className="bg-background text-foreground">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-6xl font-bold text-red-600 mb-4">{errorStatus}</h1>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {errorMessage}
            </p>
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
              <a
                href="/"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default Sentry.withSentry(App);
