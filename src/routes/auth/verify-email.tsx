import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/AuthShell";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { recordSecurityEvent, trackDevice } from "@/lib/auth/device";
import { getRedirectAfterLogin } from "@/lib/auth/roles";

const search = z.object({ email: z.string().optional() });

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Verify email — SpaceX IPO Exchange" }] }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { email: emailParam } = Route.useSearch();
  const [email, setEmail] = useState<string>(emailParam ?? "");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!emailParam) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) setEmail(data.user.email);
      });
    }
  }, [emailParam]);

  async function verify(token: string) {
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    setVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setVerifying(false);
    if (error) {
      toast.error("Invalid or expired code", { description: error.message });
      setCode("");
      return;
    }
    if (data.user) {
      await Promise.all([
        recordSecurityEvent(data.user.id, "email_verified"),
        trackDevice(data.user.id),
      ]);
      toast.success("Email verified");
      const dest = await getRedirectAfterLogin(data.user.id);
      navigate({ to: dest });
    }
  }

  async function resend() {
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) toast.error("Could not resend code", { description: error.message });
    else toast.success("New code sent");
  }

  return (
    <AuthShell
      eyebrow="VERIFY YOUR EMAIL"
      title="Enter your code"
      subtitle={email ? `We sent a 6-digit code to ${email}.` : "Enter the email you registered with and the code we sent you."}
    >
      <div className="space-y-5">
        {!emailParam && (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full h-11 rounded-md border border-border bg-surface/60 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
            />
          </div>
        )}

        <div className="flex flex-col items-center gap-3 py-2">
          <div className="h-14 w-14 rounded-full bg-accent-blue/10 grid place-items-center">
            <ShieldCheck className="h-6 w-6 text-accent-blue" />
          </div>
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(v) => {
              setCode(v);
              if (v.length === 6) verify(v);
            }}
            disabled={verifying}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-10 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs text-muted-foreground text-center">
            The code expires in 10 minutes.
          </p>
        </div>

        <button
          onClick={() => verify(code)}
          disabled={verifying || code.length !== 6}
          className="btn-primary w-full disabled:opacity-50"
        >
          {verifying ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Verify & continue"}
        </button>

        <button onClick={resend} disabled={resending} className="btn-ghost w-full">
          {resending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Resend code"}
        </button>

        <Link to="/auth/login" className="block text-center text-xs text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}

export default VerifyEmailPage;
