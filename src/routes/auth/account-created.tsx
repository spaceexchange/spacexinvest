import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Rocket } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

const search = z.object({ email: z.string().optional() });

export const Route = createFileRoute("/auth/account-created")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Account created — SpaceX IPO Exchange" }] }),
  component: AccountCreated,
});

function AccountCreated() {
  const { email } = Route.useSearch();
  return (
    <AuthShell eyebrow="LIFT-OFF CONFIRMED" title="Your account is live">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-accent-blue/10 grid place-items-center mx-auto">
          <Rocket className="h-7 w-7 text-accent-blue" />
        </div>
        <p className="text-sm text-muted-foreground">
          {email ? <>We sent a verification link to <span className="text-foreground">{email}</span>.</> : "We sent you a verification link."} Click it to activate your investor profile.
        </p>
        <div className="space-y-2 pt-2">
          <Link to="/auth/verify-email" className="btn-primary w-full text-center">I've verified my email</Link>
          <Link to="/auth/login" className="btn-ghost w-full text-center">Back to sign in</Link>
        </div>
      </div>
    </AuthShell>
  );
}

export default AccountCreated;
