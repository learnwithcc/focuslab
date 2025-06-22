import { createCookie, redirect } from "@remix-run/node";

/**
 * CSRF Protection Configuration
 */
const sessionSecret = process.env["SESSION_SECRET"] || "default-dev-secret-change-in-production";

// Create a cookie for CSRF token storage
const csrfCookie = createCookie("csrf-token", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24, // 24 hours
  secrets: [sessionSecret],
});

/**
 * Generate a secure random CSRF token
 */
export async function generateCSRFToken(): Promise<string> {
  // Only use crypto on the server side
  if (typeof window !== 'undefined') {
    throw new Error('CSRF token generation should only happen on the server');
  }
  
  const crypto = await import('crypto');
  const bytes = crypto.randomBytes(32);
  return bytes.toString('base64url');
}

/**
 * Validate CSRF token using timing-safe comparison
 */
export async function validateCSRFToken(token: string, expectedToken: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    throw new Error('CSRF token validation should only happen on the server');
  }
  
  const crypto = await import('crypto');
  
  // Ensure both tokens are the same length to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'base64url'),
      Buffer.from(expectedToken, 'base64url')
    );
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

/**
 * Get CSRF token from request cookies
 */
export async function getCSRFToken(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  try {
    return await csrfCookie.parse(cookieHeader);
  } catch (error) {
    console.error('Error parsing CSRF cookie:', error);
    return null;
  }
}

/**
 * Set CSRF token in response cookies
 */
export async function setCSRFToken(token: string): Promise<string> {
  return await csrfCookie.serialize(token);
}

/**
 * Create CSRF token and cookie header for response
 */
export async function createCSRFTokenAndCookie(): Promise<{ token: string; cookie: string }> {
  const token = await generateCSRFToken();
  const cookie = await setCSRFToken(token);
  return { token, cookie };
}

/**
 * Validate CSRF token from form data against cookie
 */
export async function validateCSRFFromRequest(request: Request, formData: FormData): Promise<boolean> {
  const cookieToken = await getCSRFToken(request);
  const formToken = formData.get('csrf-token');
  
  if (!cookieToken || !formToken || typeof formToken !== 'string') {
    return false;
  }
  
  return await validateCSRFToken(formToken, cookieToken);
}

/**
 * Hook for React components to include CSRF token in forms (server-side only)
 */
export function useCSRFToken(request: Request) {
  if (typeof window !== 'undefined') {
    console.warn('useCSRFToken should only be called on the server side');
    return null;
  }
  
  return {
    async getToken(): Promise<string | null> {
      return await getCSRFToken(request);
    },
    
    async createToken(): Promise<{ token: string; cookie: string }> {
      return await createCSRFTokenAndCookie();
    }
  };
}

/**
 * Create CSRF protected form action
 * Use this in route actions to automatically validate CSRF tokens
 */
export function withCSRFProtection<T extends any[]>(
  action: (request: Request, ...args: T) => Promise<Response | any>
) {
  return async (request: Request, ...args: T): Promise<Response | any> => {
    if (needsCSRFProtection(request)) {
      try {
        const formData = await request.clone().formData();
        const isValid = await validateCSRFFromRequest(request, formData);
        if (!isValid) {
          throw new Response("Invalid CSRF token", { status: 403 });
        }
      } catch (error) {
        console.error("CSRF validation failed:", error);
        throw error;
      }
    }
    return action(request, ...args);
  };
}

/**
 * CSRF error handler - redirects to a safe page on validation failure
 */
export function handleCSRFError(error: any, redirectTo: string = "/") {
  console.error("CSRF validation error:", error);
  return redirect(redirectTo);
}

/**
 * Check if request needs CSRF protection
 * GET, HEAD, and OPTIONS requests don't need CSRF protection
 */
export function needsCSRFProtection(request: Request): boolean {
  const method = request.method.toLowerCase();
  return !["get", "head", "options"].includes(method);
} 