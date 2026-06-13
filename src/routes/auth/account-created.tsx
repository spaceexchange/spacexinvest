import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";

const search = z.object({ email: z.string().optional() });

export const Route = createFileRoute("/auth/account-created")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Account created — SpaceX IPO Exchange" }] }),
  component: AccountCreated,
});

function AccountCreated() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");

  async function verifyOtp() {
    if (!email || !otp) {
      toast.error("Please enter the verification code");
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Email verified successfully");

    navigate({
      to: "/account/dashboard",
    });
  }

  return (
    <AuthShell eyebrow="LIFT-OFF CONFIRMED" title="Verify Your Email">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-accent-blue/10 grid place-items-center mx-auto">
          <Rocket className="h-7 w-7 text-accent-blue" />
        </div>

        <p className="text-sm text-muted-foreground">
          {email
            ? <>Enter the 6-digit code sent to <span className="text-foreground">{email}</span></>
            : "Enter the 6-digit verification code sent to your email"}
        </p>

        <div className="space-y-2 pt-2">
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/20 p-3 text-center text-xl tracking-widest"
          />

          <button
            onClick={verifyOtp}
            className="btn-primary w-full"
          >
            Verify Code
          </button>

          <Link
            to="/auth/login"
            className="btn-ghost w-full text-center"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

export default AccountCreated; 