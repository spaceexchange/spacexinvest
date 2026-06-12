import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { recordSecurityEvent } from "@/lib/auth/device";

export const Route = createFileRoute("/auth/verify-email")({
  head: () => ({ meta: [{ title: "Verify email — SpaceX IPO Exchange" }] }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"waiting" | "verified">("waiting");
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      if (data.user?.email_confirmed_at) setStatus("verified");
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        setStatus("verified");
        await recordSecurityEvent(session.user.id, "email_verified");
      }
      if (event === "USER_UPDATED" && session?.user?.email_confirmed_at) {
        setStatus("verified");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function resend() {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) toast.error(t("auth.verify.resendFailed"), { description: error.message });
    else toast.success(t("auth.verify.resendSuccess"));
  }

  if (status === "verified") {
    return (
      <AuthShell eyebrow={t("auth.shellEyebrowVerifyDone")} title={t("auth.verify.doneTitle")}>
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto" />
          <p className="text-sm text-muted-foreground">{t("auth.verify.doneBody")}</p>
          <button onClick={() => navigate({ to: "/account/dashboard" })} className="btn-primary w-full">
            {t("auth.verify.goAccount")}
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t("auth.shellEyebrowVerifyWaiting")}
      title={t("auth.verify.title")}
      subtitle={email ? t("auth.verify.subtitleWithEmail", { email }) : t("auth.verify.subtitleNoEmail")}
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="h-14 w-14 rounded-full bg-accent-blue/10 grid place-items-center">
            <Mail className="h-6 w-6 text-accent-blue" />
          </div>
          <p className="text-sm text-muted-foreground">{t("auth.verify.instruction")}</p>
        </div>
        <button onClick={resend} disabled={resending || !email} className="btn-ghost w-full">
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.verify.resend")}
        </button>
        <Link to="/auth/login" className="block text-center text-xs text-muted-foreground hover:text-foreground">
          {t("auth.verify.back")}
        </Link>
      </div>
    </AuthShell>
  );
}

export default VerifyEmailPage;
