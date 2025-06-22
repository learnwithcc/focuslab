import type { HeadersFunction } from "@remix-run/node";

/**
 * Security Headers Configuration
 * Provides comprehensive security headers for the application
 */
export const securityHeaders = {
  // Content Security Policy - Restricts resource loading to prevent XSS
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for Remix hydration
    "style-src 'self' 'unsafe-inline'", // Allow inline styles for CSS-in-JS and Tailwind
    "img-src 'self' data: https:", // Allow images from self, data URLs, and HTTPS
    "font-src 'self' data:", // Allow fonts from self and data URLs
    "connect-src 'self'", // Allow AJAX/fetch requests to same origin
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
 * Headers function for Remix routes
 */
export const createSecurityHeaders: HeadersFunction = ({ parentHeaders }) => {
  return mergeWithSecurityHeaders(parentHeaders);
}; 