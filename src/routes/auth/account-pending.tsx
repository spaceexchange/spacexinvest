import { createFileRoute, Link } from "@tanstack/react-router";
import { Hourglass } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/auth/account-pending")({
  head: () => ({ meta: [{ title: "Account under review — SpaceX IPO Exchange" }] }),
  component: AccountPending,
});

function AccountPending() {
  return (
    <AuthShell eyebrow="REVIEW IN PROGRESS" title="Your account is under review">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-yellow-500/10 grid place-items-center mx-auto">
          <Hourglass className="h-7 w-7 text-yellow-400" />
        </div>
        <p className="text-sm text-muted-foreground">
          Our compliance team is reviewing your application. This usually takes under 24 hours. You'll receive an email as soon as you're approved.
        </p>
        <Link to="/" className="btn-ghost w-full">Back to home</Link>
      </div>
    </AuthShell>
  );
}

export default AccountPending;
