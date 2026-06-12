import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { recordSecurityEvent } from "@/lib/auth/device";

export const Route = createFileRoute("/auth/logout")({
  head: () => ({ meta: [{ title: "Signing out" }] }),
  component: LogoutPage,
});

function LogoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          try { await recordSecurityEvent(data.user.id, "logout"); } catch {}
        }
        // 1. Stop any in-flight queries
        await queryClient.cancelQueries();
        // 2. Revoke server session
        await supabase.auth.signOut();
        // 3. Wipe all cached user data (investments, KYC, wallet, etc.)
        queryClient.clear();
        // 4. Wipe any local app state stored client-side
        if (typeof window !== "undefined") {
          try {
            // Preserve locale prefs only; drop everything else app-scoped.
            const lang = localStorage.getItem("spx_lang");
            const country = localStorage.getItem("spx_country");
            sessionStorage.clear();
            // Remove any keys that look user-scoped while keeping locale.
            Object.keys(localStorage).forEach((k) => {
              if (k.startsWith("sb-") || k.startsWith("spx_user_") || k.startsWith("spx_cache_")) {
                localStorage.removeItem(k);
              }
            });
            if (lang) localStorage.setItem("spx_lang", lang);
            if (country) localStorage.setItem("spx_country", country);
          } catch {}
        }
      } finally {
        setTimeout(() => navigate({ to: "/auth/login", replace: true }), 400);
      }
    })();
  }, [navigate, queryClient]);

  return (
    <AuthShell eyebrow="SESSION TERMINATED" title="Signing you out">
      <div className="text-center space-y-3">
        <LogOut className="h-12 w-12 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
        <Link to="/" className="text-accent-blue hover:underline text-sm">Back to home</Link>
      </div>
    </AuthShell>
  );
}

export default LogoutPage;

