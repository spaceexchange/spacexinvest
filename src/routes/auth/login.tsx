import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Eye, EyeOff, Briefcase, Headphones, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";

import { loginSchema, type LoginInput } from "@/lib/auth/schemas";
import { supabase } from "@/integrations/supabase/client";
import { recordSecurityEvent, trackDevice } from "@/lib/auth/device";
import { provisionDemoAccount } from "@/lib/auth/demo.functions";
import { getRedirectAfterLogin } from "@/lib/auth/roles";


const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth/login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — SpaceX IPO Exchange" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/login" });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<null | "investor" | "support" | "admin">(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  async function loginAsDemo(kind: "investor" | "support" | "admin") {
    setDemoLoading(kind);
    try {
      const creds = await provisionDemoAccount({ data: { kind } });
      const { data: sd, error } = await supabase.auth.signInWithPassword({ email: creds.email, password: creds.password });
      if (error) throw error;
      toast.success(t("auth.login.demoSignedIn", { kind: kind.charAt(0).toUpperCase() + kind.slice(1) }));
      const dest = sd.user ? await getRedirectAfterLogin(sd.user.id) : "/account/dashboard";
      navigate({ to: search.redirect ?? dest });
    } catch (e: any) {
      toast.error(t("auth.login.demoFailed"), { description: e?.message ?? String(e) });
    } finally {
      setDemoLoading(null);
    }
  }


  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    const identifier = values.identifier.trim();
    const isPhone = /^\+?[0-9\s\-()]{7,}$/.test(identifier) && !identifier.includes("@");

    await supabase.from("login_attempts").insert({ identifier, success: false });

    const { data, error } = isPhone
      ? await supabase.auth.signInWithPassword({ phone: identifier.replace(/[^\d+]/g, ""), password: values.password })
      : await supabase.auth.signInWithPassword({ email: identifier, password: values.password });

    if (error) {
      setSubmitting(false);
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error(t("auth.login.emailUnverifiedTitle"), { description: t("auth.login.emailUnverifiedDesc") });
        navigate({ to: "/auth/verify-email" });
        return;
      }
      toast.error(t("auth.login.failed"), { description: error.message });
      return;
    }

    if (data.user) {
      await Promise.all([
        supabase.from("login_attempts").insert({ identifier, success: true }),
        recordSecurityEvent(data.user.id, "login_success"),
        trackDevice(data.user.id),
      ]);
      toast.success(t("auth.login.welcomeToast"));
      const dest = await getRedirectAfterLogin(data.user.id);
      navigate({ to: search.redirect ?? dest });
    }
  }

  return (
    <AuthShell eyebrow={t("auth.shellEyebrowLogin")} title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      <div className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label={t("auth.login.identifier")} type="text" autoComplete="username" {...register("identifier")} error={errors.identifier?.message} />
          <FormField
            label={t("auth.login.password")}
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            {...register("password")}
            error={errors.password?.message}
            rightSlot={
              <button type="button" onClick={() => setShowPw((s) => !s)} className="p-1 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
              <input type="checkbox" {...register("remember")} className="h-3.5 w-3.5 accent-accent-blue" />
              {t("auth.login.remember")}
            </label>
            <Link to="/auth/forgot-password" className="text-accent-blue hover:underline">
              {t("auth.login.forgot")}
            </Link>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? t("auth.login.submitting") : t("auth.login.submit")}
          </button>
        </form>

      </div>
    </AuthShell>
  );
}

export default LoginPage;
