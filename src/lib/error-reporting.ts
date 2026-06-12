// Independent error reporting. No third-party telemetry.
// Swap the body for Sentry/PostHog/etc. when you self-host.

type ErrorContext = Record<string, unknown>;

export function reportError(error: unknown, context: ErrorContext = {}) {
  if (typeof window === "undefined") {
    console.error("[error]", error, context);
    return;
  }
  console.error("[error]", error, {
    route: window.location.pathname,
    ...context,
  });
}

// Back-compat alias for existing call sites.
export const reportLovableError = reportError;
