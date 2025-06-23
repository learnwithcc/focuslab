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
import { CookieManager, Header } from "~/components";
import { NonceProvider } from '~/utils/nonce-provider';
import { useAxe } from '~/utils/axe';
import { generateNonce } from '~/utils/nonce-generator';
import { Analytics } from "@vercel/analytics/react";
import { PHProvider } from '~/utils/posthog';

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

export async function loader({ request }: LoaderFunctionArgs) {
  const nonce = generateNonce();
  return json({ nonce });
}

// Apply security headers to all routes
export const headers = createSecurityHeaders;

export function Layout({ children, nonce }: { children: React.ReactNode; nonce: string }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground">
        <PHProvider>
          <CookieConsentProvider>
            <Header />
            <main id="main-content">{children}</main>
            <CookieManager />
          </CookieConsentProvider>
        </PHProvider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <Analytics />
      </body>
    </html>
  );
}

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
