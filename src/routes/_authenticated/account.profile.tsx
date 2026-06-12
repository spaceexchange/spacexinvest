import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGUAGES, SUPPORTED_COUNTRIES } from "@/i18n/config";

export const Route = createFileRoute("/_authenticated/account/profile")({
  head: () => ({ meta: [{ title: "Profile — SpaceX IPO Exchange" }] }),
  component: ProfilePage,
});

interface ProfileForm {
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  timezone: string;
  language: string;
  preferred_currency: string;
}

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<{ email: string | null; email_verified: boolean; phone_verified: boolean; two_factor_enabled: boolean; referral_code: string | null } | null>(null);
  const { register, handleSubmit, reset } = useForm<ProfileForm>();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) {
        reset({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          phone: data.phone ?? "",
          country: data.country ?? "US",
          timezone: data.timezone ?? "UTC",
          language: data.language ?? "en",
          preferred_currency: data.preferred_currency ?? "USD",
        });
        setProfile({
          email: data.email,
          email_verified: data.email_verified,
          phone_verified: data.phone_verified,
          two_factor_enabled: data.two_factor_enabled,
          referral_code: data.referral_code,
        });
      }
      setLoading(false);
    })();
  }, [reset]);

  async function onSave(values: ProfileForm) {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update(values).eq("id", u.user.id);
    setSaving(false);
    if (error) toast.error("Could not save", { description: error.message });
    else toast.success("Profile updated");
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and preferences.</p>
      </header>

      <div className="glass-card rounded-xl p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent-blue to-purple-500 grid place-items-center">
          <UserIcon className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{profile?.email}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Referral code: <span className="font-mono text-accent-blue">{profile?.referral_code}</span></div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <StatusBadge ok={!!profile?.email_verified} label="Email" />
        <StatusBadge ok={!!profile?.phone_verified} label="Phone" />
        <StatusBadge ok={!!profile?.two_factor_enabled} label="2FA" />
      </div>

      <form onSubmit={handleSubmit(onSave)} className="glass-card rounded-xl p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name"><input {...register("first_name")} className={inputCls} /></Field>
          <Field label="Last name"><input {...register("last_name")} className={inputCls} /></Field>
        </div>
        <Field label="Phone"><input {...register("phone")} className={inputCls} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Country">
            <select {...register("country")} className={inputCls}>
              {SUPPORTED_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          </Field>
          <Field label="Language">
            <select {...register("language")} className={inputCls}>
              {SUPPORTED_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Timezone"><input {...register("timezone")} className={inputCls} placeholder="UTC" /></Field>
          <Field label="Preferred currency">
            <select {...register("preferred_currency")} className={inputCls}>
              {["USD","EUR","GBP","CHF","AED","SGD","JPY","HKD"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full h-10 rounded-md border border-border bg-surface/60 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`glass-card rounded-lg px-4 py-3 flex items-center gap-2 ${ok ? "text-emerald-400" : "text-yellow-400"}`}>
      {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground ml-auto">{ok ? "Verified" : "Pending"}</span>
    </div>
  );
}
