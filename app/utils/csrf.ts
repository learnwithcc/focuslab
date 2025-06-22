import { createCookie, redirect } from "@remix-run/node";
import { randomBytes, timingSafeEqual } from "crypto";

/**
 * CSRF Protection Configuration
 */
const sessionSecret = process.env["SESSION_SECRET"] || "default-dev-secret-change-in-production";

// Create a cookie for CSRF token storage
export const csrfCookie = createCookie("__csrf", {
  sameSite: "lax",
  path: "/",
  httpOnly: true,
  secrets: [sessionSecret],
  secure: process.env["NODE_ENV"] === "production",
  maxAge: 60 * 60 * 24, // 24 hours
});

/**
 * Generate a cryptographically secure random token
 */
export function generateRandomToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Get CSRF token from cookie or generate a new one
 */
export async function getCSRFToken(request: Request): Promise<string> {
  const cookieHeader = request.headers.get("Cookie");
  const existingToken = await csrfCookie.parse(cookieHeader);
  
  if (existingToken && typeof existingToken === "string") {
    return existingToken;
  }
  
  return generateRandomToken();
}

/**
 * Generate CSRF token and get Set-Cookie header
 */
export async function generateCSRFToken(request: Request): Promise<{ token: string; cookie: string }> {
  const cookieHeader = request.headers.get("Cookie");
  const existingToken = await csrfCookie.parse(cookieHeader);
  
  if (existingToken && typeof existingToken === "string") {
    return { token: existingToken, cookie: "" };
  }
  
  const token = generateRandomToken();
  const cookie = await csrfCookie.serialize(token);
  
  return { token, cookie };
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(request: Request): Promise<void> {
  const cookieHeader = request.headers.get("Cookie");
  const cookieToken = await csrfCookie.parse(cookieHeader);
  
  if (!cookieToken || typeof cookieToken !== "string") {
    throw new Response("Missing CSRF token in cookie", { status: 403 });
  }
  
  const formData = await request.formData();
  const formToken = formData.get("csrf");
  
  if (!formToken || typeof formToken !== "string") {
    throw new Response("Missing CSRF token in form", { status: 403 });
  }
  
  if (!timingSafeEqual(Buffer.from(cookieToken), Buffer.from(formToken))) {
    throw new Response("Invalid CSRF token", { status: 403 });
  }
}

/**
 * Validate CSRF token from form data and headers
 */
export async function validateCSRFTokenFromFormData(formData: FormData, headers: Headers): Promise<void> {
  const cookieHeader = headers.get("Cookie");
  const cookieToken = await csrfCookie.parse(cookieHeader);
  
  if (!cookieToken || typeof cookieToken !== "string") {
    throw new Response("Missing CSRF token in cookie", { status: 403 });
  }
  
  const formToken = formData.get("csrf");
  
  if (!formToken || typeof formToken !== "string") {
    throw new Response("Missing CSRF token in form", { status: 403 });
  }
  
  if (!timingSafeEqual(Buffer.from(cookieToken), Buffer.from(formToken))) {
    throw new Response("Invalid CSRF token", { status: 403 });
  }
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
        await validateCSRFToken(request);
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

/**
 * React hook-style function to get CSRF token in loaders
 */
export async function useCSRFToken(request: Request): Promise<{ token: string; cookie?: string }> {
  const result = await generateCSRFToken(request);
  if (result.cookie) {
    return { token: result.token, cookie: result.cookie };
  }
  return { token: result.token };
} 