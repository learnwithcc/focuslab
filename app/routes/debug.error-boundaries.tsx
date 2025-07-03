import type { MetaFunction } from "@remix-run/node";
import { Container, Section } from "~/components/Layout";
import { ErrorBoundaryDemo } from "~/components";

export const meta: MetaFunction = () => {
  return [
    { title: "Error Boundary Debug - FocusLab" },
    { name: "description", content: "Debug page for testing error boundaries" },
    { name: "robots", content: "noindex, nofollow" }, // Don't index debug pages
  ];
};

export default function ErrorBoundaryDebugPage() {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Debug Page Not Available
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This debug page is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Section spacing="lg">
        <Container maxWidth="7xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Error Boundary Testing
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              This page allows you to test different error boundary implementations 
              and their recovery mechanisms. Use the controls below to trigger 
              errors and observe how they are handled.
            </p>
          </div>
          
          <ErrorBoundaryDemo />
          
          <div className="mt-12 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Development Only
            </h2>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This debug page is only available during development and will not be accessible in production.
              Use it to verify error boundary behavior and ensure proper error handling throughout the application.
            </p>
          </div>
        </Container>
      </Section>
    </div>
  );
}