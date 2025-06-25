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
import { CookieManager, Header, Footer } from "~/components";
import { VanillaThemeToggle, VanillaThemeScript } from "~/components/VanillaThemeToggle";
import { NonceProvider } from '~/utils/nonce-provider';
import { useAxe } from '~/utils/axe';
import { generateNonce } from '~/utils/nonce-generator';
import { Analytics } from "@vercel/analytics/react";
import { PHProvider } from '~/utils/posthog';
import { getThemeFromRequest, type ThemeValue } from '~/utils/theme';

import "./styles/tailwind.css";

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
    POSTHOG_API_KEY: process.env['POSTHOG_API_KEY'] || '',
    POSTHOG_API_HOST: process.env['POSTHOG_API_HOST'] || 'https://us.i.posthog.com',
    SENTRY_DSN: process.env['SENTRY_DSN'] || '',
  };
  
  return json({ nonce, env, theme });
}

// Apply security headers to all routes
export const headers = createSecurityHeaders;

export function Layout({ children, nonce, env, theme }: { children: React.ReactNode; nonce: string; env?: Record<string, string>; theme?: ThemeValue | null }) {
  // Don't apply theme class on server if following system preference
  const themeClass = theme || '';
  return (
    <html lang="en" className={themeClass} data-theme={themeClass || undefined}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <VanillaThemeScript />
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
        <Analytics />
      </body>
    </html>
  );
}

const App = () => {
  const { nonce, env, theme } = useLoaderData<typeof loader>();
  useAxe();

  return (
    <NonceProvider nonce={nonce}>
      <Layout nonce={nonce} env={env} theme={theme}>
        <PHProvider env={env}>
          <CookieConsentProvider>
            <Header />
            <main id="main-content">
              <Outlet />
            </main>
            <Footer />
            <CookieManager />
            <VanillaThemeToggle />
          </CookieConsentProvider>
        </PHProvider>
      </Layout>
    </NonceProvider>
  );
};

export default Sentry.withSentry(App);
