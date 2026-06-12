import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // If already logged in, bounce away from public auth pages (except verify/two-factor/logout)
    const path = location.pathname;
    const allowWhenLoggedIn = ["/auth/verify-email", "/auth/verify-phone", "/auth/two-factor", "/auth/security-check", "/auth/logout", "/auth/account-created", "/auth/account-pending"];
    if (allowWhenLoggedIn.some((p) => path.startsWith(p))) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/account/dashboard" });
  },
  component: () => <Outlet />,
});
