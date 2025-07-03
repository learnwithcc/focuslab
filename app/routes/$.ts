import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { resolve } from "path";

/**
 * Catch-all route for unmatched URLs including Chrome DevTools requests
 * 
 * This route handles any requests that don't match other routes, specifically
 * handling development tool requests like Chrome DevTools to prevent routing errors.
 * 
 * Specifically handles:
 * - /.well-known/appspecific/com.chrome.devtools.json (Chrome DevTools workspace config)
 * - Other .well-known requests
 * - Any other unmatched URLs
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const splat = params['*'] || '';
  const url = new URL(request.url);
  
  // Handle Chrome DevTools configuration request
  if (splat === '.well-known/appspecific/com.chrome.devtools.json') {
    // Only serve this in development mode to avoid exposing paths in production
    if (process.env.NODE_ENV === 'production') {
      throw new Response('Not Found', { 
        status: 404,
        statusText: 'Not Found'
      });
    }
    
    // Only serve for localhost origins (Chrome DevTools requirement)
    const isLocalhost = url.hostname === 'localhost' || 
                       url.hostname === '127.0.0.1' || 
                       url.hostname.startsWith('localhost:') ||
                       url.hostname.startsWith('127.0.0.1:');
    
    if (!isLocalhost) {
      throw new Response('Not Found', { 
        status: 404,
        statusText: 'Not Found'
      });
    }
    
    // Get the absolute path to the project root
    const projectRoot = resolve(process.cwd());
    
    // Generate a consistent UUID for this project
    // Using a simple hash of the project path to ensure consistency
    const projectHash = Buffer.from(projectRoot).toString('base64').slice(0, 8);
    const uuid = `53b029bb-c989-4dca-969b-835fecec${projectHash.padEnd(4, '0').slice(0, 4)}`;
    
    // DevTools configuration object
    const devToolsConfig = {
      workspace: {
        root: projectRoot,
        uuid: uuid
      }
    };
    
    console.log(`🔧 Chrome DevTools: Serving workspace config for ${projectRoot}`);
    
    // Return the configuration as JSON with proper headers
    return json(devToolsConfig, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
  
  // Handle other .well-known requests
  if (splat.startsWith('.well-known/')) {
    // Log the request for debugging purposes (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 .well-known request: /${splat} from ${url.hostname}`);
    }
    
    // Return a proper 404 response instead of letting it bubble up as a router error
    throw new Response('Not Found', {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
  
  // For all other unmatched routes, return standard 404
  throw new Response('Not Found', {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}