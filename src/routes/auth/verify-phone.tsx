import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Phone, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { otpSchema, phoneSchema } from "@/lib/auth/schemas";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { recordSecurityEvent } from "@/lib/auth/device";

const sendSchema = z.object({ phone: phoneSchema });
type SendInput = z.infer<typeof sendSchema>;
type OtpInput = z.infer<typeof otpSchema>;

export const Route = createFileRoute("/auth/verify-phone")({
  head: () => ({ meta: [{ title: "Verify phone — SpaceX IPO Exchange" }] }),
  component: VerifyPhonePage,
});

function VerifyPhonePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"phone" | "code" | "done">("phone");
  const [phone, setPhone] = useState("");
  const sendForm = useForm<SendInput>({ resolver: zodResolver(sendSchema) });
  const otpForm = useForm<OtpInput>({ resolver: zodResolver(otpSchema) });

  async function sendOtp(v: SendInput) {
    const normalized = v.phone.replace(/[^\d+]/g, "");
    setPhone(normalized);
    const { error } = await supabase.auth.updateUser({ phone: normalized });
    if (error) {
      toast.error("Could not send code", { description: error.message + " — SMS provider must be configured in Cloud settings." });
      return;
    }
    toast.success("Code sent");
    setPhase("code");
  }

  async function verify(v: OtpInput) {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: v.code, type: "phone_change" });
    if (error) {
      toast.error("Invalid code", { description: error.message });
      return;
    }
    if (data.user) {
      await supabase.from("profiles").update({ phone_verified: true, phone }).eq("id", data.user.id);
      await recordSecurityEvent(data.user.id, "phone_verified");
    }
    setPhase("done");
    setTimeout(() => navigate({ to: "/account/dashboard" }), 1800);
  }

  if (phase === "done") {
    return (
      <AuthShell eyebrow="VERIFIED" title="Phone verified">
        <div className="text-center"><CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" /></div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={phase === "phone" ? "PHONE VERIFICATION" : "ENTER CODE"}
      title={phase === "phone" ? "Verify your phone" : "Enter the 6-digit code"}
      subtitle={phase === "phone" ? "We'll text you a 6-digit verification code." : `Sent to ${phone}`}
      footer={<Link to="/account/dashboard" className="text-accent-blue hover:underline">Skip for now</Link>}
    >
      {phase === "phone" ? (
        <form onSubmit={sendForm.handleSubmit(sendOtp)} className="space-y-4">
          <FormField label="Phone number" type="tel" placeholder="+1 555 000 0000" {...sendForm.register("phone")} error={sendForm.formState.errors.phone?.message}
            rightSlot={<Phone className="h-4 w-4 text-muted-foreground mr-1" />} />
          <button type="submit" disabled={sendForm.formState.isSubmitting} className="btn-primary w-full">
            {sendForm.formState.isSubmitting ? "Sending…" : "Send code"}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">SMS verification requires an active SMS provider in Lovable Cloud → Auth Settings.</p>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(verify)} className="space-y-4">
          <FormField label="Verification code" inputMode="numeric" maxLength={6} placeholder="000000" {...otpForm.register("code")} error={otpForm.formState.errors.code?.message} />
          <button type="submit" disabled={otpForm.formState.isSubmitting} className="btn-primary w-full">
            {otpForm.formState.isSubmitting ? "Verifying…" : "Verify"}
          </button>
          <button type="button" onClick={() => setPhase("phone")} className="btn-ghost w-full">Use a different number</button>
        </form>
      )}
    </AuthShell>
  );
}

export default VerifyPhonePage;
