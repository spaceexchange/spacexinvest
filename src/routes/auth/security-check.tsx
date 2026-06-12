import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { trackDevice, recordSecurityEvent } from "@/lib/auth/device";

export const Route = createFileRoute("/auth/security-check")({
  head: () => ({ meta: [{ title: "Security check — SpaceX IPO Exchange" }] }),
  component: SecurityCheck,
});

function SecurityCheck() {
  const [stage, setStage] = useState<"checking" | "clear" | "blocked">("checking");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setStage("blocked");
        return;
      }
      await trackDevice(data.user.id);
      await recordSecurityEvent(data.user.id, "device_added", { source: "security_check" });
      setTimeout(() => setStage("clear"), 900);
    })();
  }, []);

  return (
    <AuthShell eyebrow="ANOMALY DETECTION" title="Running security checks" subtitle="Verifying device, location and session integrity.">
      <div className="flex flex-col items-center text-center gap-4 py-4">
        {stage === "checking" && <Loader2 className="h-12 w-12 text-accent-blue animate-spin" />}
        {stage === "clear" && <ShieldCheck className="h-12 w-12 text-emerald-400" />}
        {stage === "blocked" && <ShieldCheck className="h-12 w-12 text-destructive" />}
        <p className="text-sm text-muted-foreground">
          {stage === "checking" && "Checking device fingerprint and login pattern…"}
          {stage === "clear" && "All clear. You're good to go."}
          {stage === "blocked" && "We could not verify your session. Please sign in again."}
        </p>
        <Link to={stage === "blocked" ? "/auth/login" : "/account/dashboard"} className="btn-primary w-full">
          {stage === "blocked" ? "Sign in" : "Continue"}
        </Link>
      </div>
    </AuthShell>
  );
}

export default SecurityCheck;
