import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { resetSchema } from "@/lib/auth/schemas";
import { supabase } from "@/integrations/supabase/client";
import { recordSecurityEvent } from "@/lib/auth/device";
import type { z } from "zod";

type ResetInput = z.infer<typeof resetSchema>;

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — SpaceX IPO Exchange" }] }),
  component: ResetPage,
});

function ResetPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setHasRecovery(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetInput>({ resolver: zodResolver(resetSchema) });
  const password = watch("password") ?? "";

  async function onSubmit(v: ResetInput) {
    setSubmitting(true);
    const { data, error } = await supabase.auth.updateUser({ password: v.password });
    setSubmitting(false);
    if (error) {
      toast.error(t("auth.reset.failed"), { description: error.message });
      return;
    }
    if (data.user) await recordSecurityEvent(data.user.id, "password_changed");
    setDone(true);
    setTimeout(() => navigate({ to: "/auth/login" }), 2200);
  }

  if (done) {
    return (
      <AuthShell title={t("auth.reset.doneTitle")} eyebrow={t("auth.shellEyebrowVerifyDone")}>
        <div className="text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
          <p className="text-sm text-muted-foreground">{t("auth.reset.redirecting")}</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow={t("auth.shellEyebrowReset")} title={t("auth.reset.title")} subtitle={t("auth.reset.subtitle")}>
      {!hasRecovery && (
        <p className="mb-4 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-3 py-2">
          {t("auth.reset.openFromLink")}
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <FormField
            label={t("auth.reset.newPassword")}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
            rightSlot={
              <button type="button" onClick={() => setShow((s) => !s)} className="p-1 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <PasswordStrength password={password} />
        </div>
        <FormField label={t("auth.reset.confirm")} type="password" autoComplete="new-password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
        <button type="submit" disabled={submitting || !hasRecovery} className="btn-primary w-full">
          {submitting ? t("auth.reset.submitting") : t("auth.reset.submit")}
        </button>
      </form>
    </AuthShell>
  );
}

export default ResetPage;
