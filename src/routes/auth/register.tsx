import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Trans, useTranslation } from "react-i18next";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";

import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { registerSchema, type RegisterInput } from "@/lib/auth/schemas";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_COUNTRIES } from "@/i18n/config";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Open an account — SpaceX IPO Exchange" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { country: "US", marketingOptIn: false, acceptTerms: false, acceptPrivacy: false },
  });
  const password = watch("password") ?? "";

  async function onSubmit(values: RegisterInput) {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        data: {
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone,
          country: values.country,
          referral_code: values.referralCode ?? "",
          marketing_opt_in: !!values.marketingOptIn,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        toast.error(t("auth.register.existsTitle"), { description: t("auth.register.existsDesc") });
      } else {
        toast.error(t("auth.register.failed"), { description: error.message });
      }
      return;
    }
    toast.success(t("auth.register.createdTitle"), { description: t("auth.register.createdDesc") });
    window.location.href = "/auth/verify-email";
  }

  return (
    <AuthShell
      eyebrow={t("auth.shellEyebrowRegister")}
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={
        <>
          {t("auth.register.haveAccount")}{" "}
          <Link to="/auth/login" className="text-accent-blue hover:underline">
            {t("cta.signIn")}
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("auth.register.firstName")} autoComplete="given-name" {...register("firstName")} error={errors.firstName?.message} />
            <FormField label={t("auth.register.lastName")} autoComplete="family-name" {...register("lastName")} error={errors.lastName?.message} />
          </div>
          <FormField label={t("auth.register.email")} type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
          <FormField label={t("auth.register.phone")} type="tel" autoComplete="tel" placeholder="+1 555 000 0000" {...register("phone")} error={errors.phone?.message} />
          <div className="space-y-1.5">
            <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("auth.register.country")}</label>
            <select
              {...register("country")}
              className="w-full h-11 rounded-md border border-border bg-surface/60 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            {errors.country?.message && <p className="text-xs text-destructive">{errors.country.message}</p>}
          </div>
          <div>
            <FormField
              label={t("auth.register.password")}
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              error={errors.password?.message}
              rightSlot={
                <button type="button" onClick={() => setShowPw((s) => !s)} className="p-1 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <PasswordStrength password={password} />
          </div>
          <FormField label={t("auth.register.confirmPassword")} type="password" autoComplete="new-password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
          <FormField label={t("auth.register.referral")} {...register("referralCode")} error={errors.referralCode?.message} />

          <div className="space-y-2 pt-2">
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" {...register("acceptTerms")} className="mt-0.5 h-3.5 w-3.5 accent-accent-blue" />
              <span>
                <Trans i18nKey="auth.register.acceptTerms">
                  I accept the <Link to="/terms" className="text-accent-blue hover:underline">Terms of Service</Link>
                </Trans>
              </span>
            </label>
            {errors.acceptTerms?.message && <p className="text-xs text-destructive ml-5">{errors.acceptTerms.message}</p>}
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" {...register("acceptPrivacy")} className="mt-0.5 h-3.5 w-3.5 accent-accent-blue" />
              <span>
                <Trans i18nKey="auth.register.acceptPrivacy">
                  I accept the <Link to="/privacy" className="text-accent-blue hover:underline">Privacy Policy</Link>
                </Trans>
              </span>
            </label>
            {errors.acceptPrivacy?.message && <p className="text-xs text-destructive ml-5">{errors.acceptPrivacy.message}</p>}
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" {...register("marketingOptIn")} className="mt-0.5 h-3.5 w-3.5 accent-accent-blue" />
              <span>{t("auth.register.marketingOptIn")}</span>
            </label>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? t("auth.register.submitting") : t("auth.register.submit")}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

export default RegisterPage;
