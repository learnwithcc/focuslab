import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

/**
 * CSP Violation Report Handler
 * Receives and logs Content Security Policy violation reports
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // Only accept POST requests
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }

    // Parse the CSP violation report
    const report = await request.json();
    
    // Log the violation report for debugging
    console.warn("🚨 CSP Violation Report:", {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("User-Agent"),
      url: request.url,
      report
    });

    // In production, you might want to:
    // - Store reports in a database
    // - Send alerts for critical violations
    // - Aggregate reports for analysis
    
    // For now, just acknowledge receipt
    return json({ status: "received" }, { status: 200 });
    
  } catch (error) {
    console.error("❌ Error processing CSP report:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

// CSP reports are always POST requests, no GET needed
export function loader() {
  return json({ error: "CSP reports must be POSTed" }, { status: 405 });
}