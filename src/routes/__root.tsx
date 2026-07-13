import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import "../i18n/config";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { AuthProvider } from "../lib/auth/AuthProvider";
import { supabase } from "../integrations/supabase/client";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs tracking-[0.3em] text-accent-blue">SIGNAL LOST</div>
        <h1 className="mt-4 font-display text-7xl font-bold silver-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Trajectory not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for has drifted out of orbit.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary">Return to base</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Mission interrupted
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Recalibrating systems.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-primary">Retry</button>
          <a href="/" className="btn-ghost">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SpaceX IPO Exchange — Premier Aerospace Investment Platform" },
      { name: "description", content: "Invest in SpaceX pre-IPO shares, Tesla equity, vehicles and Starlink services on the world's most advanced aerospace investment platform." },
      { name: "author", content: "SpaceX IPO Exchange" },
      { property: "og:title", content: "SpaceX IPO Exchange" },
      { property: "og:description", content: "Premier aerospace investment platform for SpaceX, Tesla and Starlink." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0b0f1a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "SpaceX IPO" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
  const script = document.createElement("script");
  script.src = "//code.jivosite.com/widget/uFVoitS6N8";
  script.async = true;

  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
}, []);
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>
          <Outlet />
          <Toaster theme="dark" position="top-right" richColors closeButton />
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
