import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { forgotSchema } from "@/lib/auth/schemas";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import type { z } from "zod";

type ForgotInput = z.infer<typeof forgotSchema>;

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — SpaceX IPO Exchange" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema) });

  async function onSubmit(v: ForgotInput) {
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(v.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(t("auth.forgot.failed"), { description: error.message });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell eyebrow={t("auth.shellEyebrowSent")} title={t("auth.forgot.sentTitle")}>
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
          <p className="text-sm text-muted-foreground">{t("auth.forgot.sentBody")}</p>
          <Link to="/auth/login" className="btn-ghost w-full">{t("auth.forgot.backToLogin")}</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t("auth.shellEyebrowForgot")}
      title={t("auth.forgot.title")}
      subtitle={t("auth.forgot.subtitle")}
      footer={<Link to="/auth/login" className="text-accent-blue hover:underline">{t("auth.forgot.backToLogin")}</Link>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label={t("auth.register.email")} type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
        </button>
      </form>
    </AuthShell>
  );
}

export default ForgotPage;
