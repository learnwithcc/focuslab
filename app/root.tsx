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
import { createSecurityHeaders } from "~/utils/security";
import { CookieConsentProvider } from "~/contexts";
import { CookieManager } from "~/components";
import { NonceProvider, useNonce } from '~/utils/nonce-provider';
import { useAxe } from '~/utils/axe';
import { generateNonce } from '~/utils/nonce-generator';

import "./styles/tailwind.css";

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

export function Layout({ children }: { children: React.ReactNode }) {
  const nonce = useNonce();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <CookieConsentProvider>
          {children}
          <CookieManager />
        </CookieConsentProvider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const { nonce } = useLoaderData<typeof loader>();
  useAxe();

  return (
    <NonceProvider nonce={nonce}>
      <Layout>
        <Outlet />
      </Layout>
    </NonceProvider>
  );
}
