export {};

declare global {
  interface Window {
    ENV?: {
      NODE_ENV?: string;
      SENTRY_DSN?: string;
      POSTHOG_API_KEY?: string;
      POSTHOG_API_HOST?: string;
    };
  }
}