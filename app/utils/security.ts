import type { HeadersFunction } from "@remix-run/node";

/**
 * Security Headers Configuration
 * Provides comprehensive security headers for the application
 */
export const securityHeaders = {
  // Content Security Policy - Restricts resource loading to prevent XSS
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us-assets.i.posthog.com https://va.vercel-scripts.com", // Allow inline scripts for Remix hydration, PostHog, and Vercel Analytics
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow inline styles and Google Fonts
    "img-src 'self' data: https:", // Allow images from self, data URLs, and HTTPS
    "font-src 'self' data: https://fonts.gstatic.com", // Allow fonts from self, data URLs, and Google Fonts
    "connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com https://fonts.googleapis.com", // Allow AJAX/fetch requests to same origin, PostHog, and Google Fonts
    "media-src 'self'", // Allow media from same origin
    "object-src 'none'", // Disable plugins like Flash
    "child-src 'self'", // Allow frames from same origin
    "worker-src 'self'", // Allow web workers from same origin
    "frame-ancestors 'none'", // Prevent embedding in frames (duplicate of X-Frame-Options)
    "form-action 'self'", // Restrict form submissions to same origin
    "base-uri 'self'", // Restrict base tag URLs
    "upgrade-insecure-requests", // Upgrade HTTP to HTTPS
  ].join("; "),

  // HTTP Strict Transport Security - Force HTTPS
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

  // Prevent clickjacking by disallowing embedding in frames
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS filtering (legacy but still useful)
  "X-XSS-Protection": "1; mode=block",

  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Disable interest cohort tracking (FLoC)
  "Permissions-Policy": "interest-cohort=()",
};

/**
 * SEO-specific headers for different route types
 */
export const seoHeaders = {
  // Standard pages - allow indexing
  pages: {
    "X-Robots-Tag": "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  },
  
  // API routes - prevent indexing
  api: {
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
  },
  
  // Sitemap and robots.txt - special handling
  seo: {
    "X-Robots-Tag": "noindex", // Don't index the sitemap itself
  },
};

/**
 * Get security headers as a Headers object
 */
export function getSecurityHeaders(): Headers {
  const headers = new Headers();
  
  Object.entries(securityHeaders).forEach(([name, value]) => {
    headers.set(name, value);
  });
  
  return headers;
}

/**
 * Get security headers with SEO headers for specific route types
 */
export function getSecurityHeadersWithSEO(routeType: 'pages' | 'api' | 'seo' = 'pages'): Headers {
  const headers = getSecurityHeaders();
  
  // Add SEO-specific headers
  Object.entries(seoHeaders[routeType]).forEach(([name, value]) => {
    headers.set(name, value);
  });
  
  return headers;
}

/**
 * Merge security headers with existing headers
 */
export function mergeWithSecurityHeaders(existingHeaders?: HeadersInit): Headers {
  const headers = getSecurityHeaders();
  
  if (existingHeaders) {
    if (existingHeaders instanceof Headers) {
      existingHeaders.forEach((value, name) => {
        headers.set(name, value);
      });
    } else if (Array.isArray(existingHeaders)) {
      existingHeaders.forEach(([name, value]) => {
        headers.set(name, value);
      });
    } else {
      Object.entries(existingHeaders).forEach(([name, value]) => {
        if (value !== undefined) {
          headers.set(name, value);
        }
      });
    }
  }
  
  return headers;
}

/**
 * Merge security and SEO headers with existing headers
 */
export function mergeWithSecurityAndSEOHeaders(
  routeType: 'pages' | 'api' | 'seo' = 'pages',
  existingHeaders?: HeadersInit
): Headers {
  const headers = getSecurityHeadersWithSEO(routeType);
  
  if (existingHeaders) {
    if (existingHeaders instanceof Headers) {
      existingHeaders.forEach((value, name) => {
        headers.set(name, value);
      });
    } else if (Array.isArray(existingHeaders)) {
      existingHeaders.forEach(([name, value]) => {
        headers.set(name, value);
      });
    } else {
      Object.entries(existingHeaders).forEach(([name, value]) => {
        if (value !== undefined) {
          headers.set(name, value);
        }
      });
    }
  }
  
  return headers;
}

/**
 * Headers function for Remix routes (default to pages)
 */
export const createSecurityHeaders: HeadersFunction = ({ parentHeaders }) => {
  return mergeWithSecurityAndSEOHeaders('pages', parentHeaders);
};

/**
 * Headers function for API routes
 */
export const createAPIHeaders: HeadersFunction = ({ parentHeaders }) => {
  return mergeWithSecurityAndSEOHeaders('api', parentHeaders);
};

/**
 * Headers function for SEO utility routes (sitemap, robots.txt)
 */
export const createSEOHeaders: HeadersFunction = ({ parentHeaders }) => {
  return mergeWithSecurityAndSEOHeaders('seo', parentHeaders);
}; 