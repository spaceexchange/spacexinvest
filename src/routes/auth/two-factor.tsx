import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, KeyRound, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { supabase } from "@/integrations/supabase/client";
import { recordSecurityEvent } from "@/lib/auth/device";

export const Route = createFileRoute("/auth/two-factor")({
  head: () => ({ meta: [{ title: "Two-factor — SpaceX IPO Exchange" }] }),
  component: TwoFactorPage,
});

function TwoFactorPage() {
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  const [hasFactor, setHasFactor] = useState(false);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (verified) setHasFactor(true);
    });
  }, []);

  async function enroll() {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator App" });
    setEnrolling(false);
    if (error) {
      toast.error("Could not start 2FA setup", { description: error.message });
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function verify() {
    if (!factorId) return;
    const { data: chall, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr) return toast.error("Challenge failed", { description: cErr.message });
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: chall.id, code });
    if (error) {
      toast.error("Invalid code", { description: error.message });
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("profiles").update({ two_factor_enabled: true }).eq("id", u.user.id);
      await recordSecurityEvent(u.user.id, "2fa_enabled");
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/account/security" }), 2000);
  }

  async function disable() {
    const { data } = await supabase.auth.mfa.listFactors();
    const factor = data?.totp?.[0];
    if (!factor) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) return toast.error("Could not disable", { description: error.message });
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("profiles").update({ two_factor_enabled: false }).eq("id", u.user.id);
      await recordSecurityEvent(u.user.id, "2fa_disabled");
    }
    toast.success("2FA disabled");
    setHasFactor(false);
  }

  if (done) return (
    <AuthShell eyebrow="ARMED" title="Two-factor enabled">
      <div className="text-center"><CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" /></div>
    </AuthShell>
  );

  if (hasFactor) {
    return (
      <AuthShell eyebrow="2FA ACTIVE" title="Two-factor authentication is on" subtitle="Your account is protected with an authenticator app.">
        <div className="space-y-3">
          <Link to="/account/security" className="btn-primary w-full text-center">Back to Security Center</Link>
          <button onClick={disable} className="btn-ghost w-full text-destructive">Disable 2FA</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="MISSION-GRADE SECURITY" title="Enable two-factor" subtitle="Scan a QR code with your authenticator app.">
      {!qr ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center gap-3 py-3">
            <div className="h-14 w-14 rounded-full bg-accent-blue/10 grid place-items-center">
              <ShieldCheck className="h-6 w-6 text-accent-blue" />
            </div>
            <p className="text-sm text-muted-foreground">
              Use Google Authenticator, 1Password, Authy, or any TOTP-compatible app.
            </p>
          </div>
          <button onClick={enroll} disabled={enrolling} className="btn-primary w-full">
            {enrolling ? "Preparing…" : "Start setup"}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            SMS and email 2FA codes are also supported once an SMS provider is configured.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-md mx-auto w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="2FA QR Code" width={180} height={180} />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground">MANUAL ENTRY</div>
            <div className="font-mono text-xs text-foreground break-all mt-1">{secret}</div>
          </div>
          <FormField label="Enter 6-digit code from app" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} inputMode="numeric" rightSlot={<KeyRound className="h-4 w-4 text-muted-foreground mr-1" />} />
          <button onClick={verify} disabled={code.length !== 6} className="btn-primary w-full">Verify and enable</button>
        </div>
      )}
    </AuthShell>
  );
}

export default TwoFactorPage;
